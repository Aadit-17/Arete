import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, apiError } from "@/lib/middleware";
import type { UserDoc } from "@/lib/types";

// ---------------------------------------------------------------------------
// GET /api/me — return current user profile (any auth status)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
    const auth = await requireUser(req);
    if (auth instanceof NextResponse) return auth;

    const db = await getDb();
    const user = await db
        .collection<UserDoc>("users")
        .findOne({ _id: auth.userId });

    if (!user) return apiError("User not found", 404);

    return NextResponse.json({
        id: user._id!.toString(),
        email: user.email,
        username: user.username,
        status: user.status,
        timezone: user.timezone,
        createdAt: user.createdAt,
    });
}
