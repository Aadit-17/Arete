import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireApprovedUser, apiError } from "@/lib/middleware";
import type { UserGoalsDoc } from "@/lib/types";

// ---------------------------------------------------------------------------
// GET /api/goals — return current user's goals (or empty targets)
// PUT /api/goals — upsert goals targets
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const db = await getDb();
    const doc = await db
        .collection<UserGoalsDoc>("user_goals")
        .findOne({ userId: auth.userId });

    return NextResponse.json({
        targets: doc?.targets ?? {},
        notes: doc?.notes ?? null,
        updatedAt: doc?.updatedAt ?? null,
    });
}

export async function PUT(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return apiError("Invalid JSON body", 400);
    }

    const { targets, notes } = body as Record<string, unknown>;
    if (!targets || typeof targets !== "object") return apiError("targets object required", 400);

    const now = new Date();
    const db = await getDb();

    await db.collection<UserGoalsDoc>("user_goals").updateOne(
        { userId: auth.userId },
        {
            $set: {
                userId: auth.userId,
                targets: targets as UserGoalsDoc["targets"],
                notes: typeof notes === "string" ? notes : undefined,
                updatedAt: now,
            },
        },
        { upsert: true }
    );

    return NextResponse.json({ success: true, updatedAt: now });
}

// PATCH is an alias for PUT (partial update same behaviour in v1)
export { PUT as PATCH };
