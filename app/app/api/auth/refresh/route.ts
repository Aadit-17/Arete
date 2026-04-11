import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
    signAccessToken,
    generateRefreshTokenValue,
    hashRefreshToken,
    getRefreshExpiryDate,
} from "@/lib/auth";
import { apiError } from "@/lib/middleware";
import type { RefreshTokenDoc, UserDoc } from "@/lib/types";
import { ObjectId } from "mongodb";

const REFRESH_COOKIE_NAME = "refresh_token";

function setRefreshCookie(res: NextResponse, token: string): void {
    res.cookies.set(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: 60 * 60 * 24 * 30,
    });
}

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// Token rotation: validates current refresh → issues new access + new refresh, revokes old
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    // Accept from httpOnly cookie (preferred) OR body (fallback)
    const cookieToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    let bodyToken: string | undefined;
    try {
        const body = await req.json();
        bodyToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
    } catch {
        // body may be empty — that's fine if cookie is present
    }

    const rawToken = cookieToken ?? bodyToken;
    if (!rawToken) return apiError("Refresh token required", 401, "MISSING_REFRESH_TOKEN");

    const tokenHash = hashRefreshToken(rawToken);
    const db = await getDb();

    const record = await db
        .collection<RefreshTokenDoc>("refresh_tokens")
        .findOne({ tokenHash });

    if (!record) return apiError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    if (record.revokedAt) return apiError("Refresh token has been revoked", 401, "REFRESH_REVOKED");
    if (record.expiresAt < new Date()) return apiError("Refresh token expired", 401, "REFRESH_EXPIRED");

    // Check user still exists + is not deleted
    const user = await db
        .collection<UserDoc>("users")
        .findOne({ _id: record.userId });
    if (!user) return apiError("User not found", 401, "USER_NOT_FOUND");

    // Rotate: revoke old, issue new
    await db.collection<RefreshTokenDoc>("refresh_tokens").updateOne(
        { _id: record._id },
        { $set: { revokedAt: new Date() } }
    );

    const userId = user._id!.toString();
    const newAccessToken = signAccessToken(userId);

    const newRawRefresh = generateRefreshTokenValue();
    const newHash = hashRefreshToken(newRawRefresh);
    const expiresAt = getRefreshExpiryDate();
    const now = new Date();

    await db.collection<RefreshTokenDoc>("refresh_tokens").insertOne({
        userId: user._id!,
        tokenHash: newHash,
        expiresAt,
        createdAt: now,
        revokedAt: null,
    });

    const res = NextResponse.json({
        accessToken: newAccessToken,
        user: {
            id: userId,
            status: user.status,
        },
    });
    setRefreshCookie(res, newRawRefresh);
    return res;
}
