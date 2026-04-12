import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireApprovedUser, apiError } from "@/lib/middleware";
import { serializeDailyEntryPublic } from "@/lib/serialize-public";
import type { DailyEntryDoc } from "@/lib/types";

// ---------------------------------------------------------------------------
// GET /api/daily-entries
// ?dateKey=YYYY-MM-DD        → single entry
// ?from=YYYY-MM-DD&to=YYYY-MM-DD → range (max 90 days)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const dateKey = searchParams.get("dateKey");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const db = await getDb();
    const col = db.collection<DailyEntryDoc>("daily_entries");

    if (dateKey) {
        const entry = await col.findOne({ userId: auth.userId, dateKey });
        if (!entry) return NextResponse.json({ entry: null });
        return NextResponse.json({ entry: serializeDailyEntryPublic(entry) });
    }

    if (from && to) {
        const entries = await col
            .find({ userId: auth.userId, dateKey: { $gte: from, $lte: to } })
            .sort({ dateKey: -1 })
            .limit(90)
            .toArray();
        return NextResponse.json({ entries: entries.map(serializeDailyEntryPublic) });
    }

    // Default: latest 30 entries
    const entries = await col
        .find({ userId: auth.userId })
        .sort({ dateKey: -1 })
        .limit(30)
        .toArray();
    return NextResponse.json({ entries: entries.map(serializeDailyEntryPublic) });
}
