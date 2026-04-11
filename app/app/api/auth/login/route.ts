import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, ensureIndexes } from "@/lib/db";
import {
    signAccessToken,
    generateRefreshTokenValue,
    hashRefreshToken,
    getRefreshExpiryDate,
} from "@/lib/auth";
import { apiError } from "@/lib/middleware";
import { rateLimiter } from "@/lib/rate-limit";
import type { UserDoc, RefreshTokenDoc } from "@/lib/types";

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
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);

    // Rate limit: 10 attempts per IP per 15 minutes
    if (!rateLimiter.allow("login", ip, 10, 15 * 60 * 1000)) {
        return apiError("Too many login attempts. Please try again later.", 429, "RATE_LIMITED");
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return apiError("Invalid JSON body", 400, "BAD_REQUEST");
    }

    const { email, password } = body as Record<string, unknown>;
    if (!email || typeof email !== "string") return apiError("email is required", 400);
    if (!password || typeof password !== "string") return apiError("password is required", 400);

    await ensureIndexes();
    const db = await getDb();

    const user = await db
        .collection<UserDoc>("users")
        .findOne({ email: email.toLowerCase().trim() });

    // Constant-time: always hash compare even if user not found to prevent timing attacks
    const dummyHash = "$2b$12$invalidhashpaddingtomakethislong123456789012";
    const passwordMatch = await bcrypt.compare(
        password,
        user?.passwordHash ?? dummyHash
    );

    if (!user || !passwordMatch) {
        return apiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Issue tokens
    const userId = user._id!.toString();
    const accessToken = signAccessToken(userId);

    const rawRefreshToken = generateRefreshTokenValue();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = getRefreshExpiryDate();
    const now = new Date();

    const refreshRecord: RefreshTokenDoc = {
        userId: user._id!,
        tokenHash,
        expiresAt,
        createdAt: now,
        revokedAt: null,
    };
    await db.collection<RefreshTokenDoc>("refresh_tokens").insertOne(refreshRecord);

    const res = NextResponse.json({
        accessToken,
        user: {
            id: userId,
            email: user.email,
            username: user.username,
            status: user.status,
            timezone: user.timezone,
        },
    });

    setRefreshCookie(res, rawRefreshToken);
    return res;
}
