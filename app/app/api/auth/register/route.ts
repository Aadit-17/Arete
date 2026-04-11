import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, ensureIndexes } from "@/lib/db";
import { signAccessToken, generateRefreshTokenValue, hashRefreshToken, getRefreshExpiryDate } from "@/lib/auth";
import { apiError } from "@/lib/middleware";
import { rateLimiter } from "@/lib/rate-limit";
import type { UserDoc, RefreshTokenDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

const BCRYPT_ROUNDS = 12;
const REFRESH_COOKIE_NAME = "refresh_token";

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}

function setRefreshCookie(res: NextResponse, token: string): void {
    res.cookies.set(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);

    // Rate limit: 5 registrations per IP per 15 minutes
    if (!rateLimiter.allow("register", ip, 5, 15 * 60 * 1000)) {
        return apiError("Too many registration attempts. Please try again later.", 429, "RATE_LIMITED");
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return apiError("Invalid JSON body", 400, "BAD_REQUEST");
    }

    const { email, username, password, timezone } = body as Record<string, unknown>;

    if (!email || typeof email !== "string") return apiError("email is required", 400);
    if (!username || typeof username !== "string") return apiError("username is required", 400);
    if (!password || typeof password !== "string" || password.length < 8)
        return apiError("password must be at least 8 characters", 400);

    const normalizedEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();
    const tz = (timezone && typeof timezone === "string") ? timezone : "UTC";

    await ensureIndexes();
    const db = await getDb();

    // Check uniqueness
    const existing = await db.collection<UserDoc>("users").findOne({
        $or: [{ email: normalizedEmail }, { username: cleanUsername }],
    });
    if (existing) {
        const field = existing.email === normalizedEmail ? "email" : "username";
        return apiError(`${field} is already taken`, 409, "CONFLICT");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date();
    const user: UserDoc = {
        email: normalizedEmail,
        username: cleanUsername,
        passwordHash,
        status: "pending",
        timezone: tz,
        createdAt: now,
        updatedAt: now,
    };

    const result = await db.collection<UserDoc>("users").insertOne(user);

    return NextResponse.json(
        {
            message: "Registration successful. Your account is pending approval.",
            userId: result.insertedId.toString(),
            status: "pending",
        },
        { status: 201 }
    );
}
