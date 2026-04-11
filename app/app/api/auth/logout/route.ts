import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, apiError } from "@/lib/middleware";
import { hashRefreshToken } from "@/lib/auth";
import type { RefreshTokenDoc } from "@/lib/types";

const REFRESH_COOKIE_NAME = "refresh_token";

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// Revokes the refresh token; clears the cookie
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    const auth = await requireUser(req);
    // Even if token is expired/invalid we still try to clear the cookie
    if (auth instanceof NextResponse) {
        // Clear cookie anyway
        const res = NextResponse.json({ message: "Logged out" });
        res.cookies.set(REFRESH_COOKIE_NAME, "", { maxAge: 0, path: "/api/auth" });
        return res;
    }

    const cookieToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (cookieToken) {
        const tokenHash = hashRefreshToken(cookieToken);
        const db = await getDb();
        await db.collection<RefreshTokenDoc>("refresh_tokens").updateMany(
            { userId: auth.userId, tokenHash },
            { $set: { revokedAt: new Date() } }
        );
    }

    const res = NextResponse.json({ message: "Logged out successfully" });
    res.cookies.set(REFRESH_COOKIE_NAME, "", { maxAge: 0, path: "/api/auth" });
    return res;
}
