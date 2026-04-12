import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";
import { getDb } from "./db";
import { ObjectId } from "mongodb";
import type { UserDoc } from "./types";

// ---------------------------------------------------------------------------
// Shared error shape
// ---------------------------------------------------------------------------

export function apiError(
    message: string,
    status: number,
    code?: string
): NextResponse {
    return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

// ---------------------------------------------------------------------------
// Extract Bearer token from Authorization header
// ---------------------------------------------------------------------------

function extractBearerToken(req: NextRequest): string | null {
    const header = req.headers.get("authorization") ?? "";
    if (!header.startsWith("Bearer ")) return null;
    return header.slice(7).trim() || null;
}

// ---------------------------------------------------------------------------
// requireUser — any authenticated user (pending OR approved)
// ---------------------------------------------------------------------------

const DEMO_EMAIL = process.env.DEMO_ACCOUNT_EMAIL || "demo@example.com";

export interface AuthContext {
    userId: ObjectId;
    status: "pending" | "approved";
    isDemo: boolean;
}

export async function requireUser(req: NextRequest): Promise<AuthContext | NextResponse> {
    const token = extractBearerToken(req);
    if (!token) return apiError("Missing authorization token", 401, "UNAUTHORIZED");

    let payload: { sub: string };
    try {
        payload = verifyAccessToken(token) as { sub: string };
    } catch {
        return apiError("Invalid or expired access token", 401, "TOKEN_INVALID");
    }

    let userId: ObjectId;
    try {
        userId = new ObjectId(payload.sub);
    } catch {
        return apiError("Malformed token payload", 401, "TOKEN_INVALID");
    }

    // Verify user still exists and is not deleted
    const db = await getDb();
    const user = await db.collection<UserDoc>("users").findOne({ _id: userId });
    if (!user) return apiError("User not found", 401, "USER_NOT_FOUND");

    return { userId, status: user.status, isDemo: user.email === DEMO_EMAIL };
}

// ---------------------------------------------------------------------------
// requireApprovedUser — only approved users
// ---------------------------------------------------------------------------

export async function requireApprovedUser(
    req: NextRequest
): Promise<{ userId: ObjectId; isDemo: boolean } | NextResponse> {
    const result = await requireUser(req);
    if (result instanceof NextResponse) return result;
    if (result.status !== "approved") {
        return apiError(
            "Your account is pending approval. Please wait for an admin to approve it.",
            403,
            "ACCOUNT_PENDING"
        );
    }
    return { userId: result.userId, isDemo: result.isDemo };
}
