import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireApprovedUser, apiError } from "@/lib/middleware";
import { genAI } from "@/lib/gemini";
import { serializePeriodSummaryPublic } from "@/lib/serialize-public";
import type { DailyEntryDoc, PeriodSummaryDoc } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers for Date math (Sunday-start weeks)
// ---------------------------------------------------------------------------

function getSundayStartOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - day);
    return d;
}

function formatDateKey(date: Date): string {
    return date.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// GET /api/summaries
// ?type=weekly|monthly&page=1&limit=10
//
// POST /api/summaries/generate
// PUT /api/progress/refresh
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const periodType = searchParams.get("type") as "weekly" | "monthly" | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10", 10));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const col = db.collection<PeriodSummaryDoc>("period_summaries");

    const filter: Record<string, unknown> = { userId: auth.userId };
    if (periodType) filter.periodType = periodType;

    const [docs, total] = await Promise.all([
        col.find(filter).sort({ rangeStart: -1 }).skip(skip).limit(limit).toArray(),
        col.countDocuments(filter),
    ]);

    const total_pages = Math.ceil(total / limit);

    return NextResponse.json({
        summaries: docs.map(serializePeriodSummaryPublic),
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
    });
}

export async function POST(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Invalid JSON body", 400); }

    const { type, rangeStart, rangeEnd } = body as Record<string, unknown>;
    if (!type || !["weekly", "monthly"].includes(type as string)) {
        return apiError("type must be weekly or monthly", 400);
    }

    if (typeof rangeStart !== "string" || typeof rangeEnd !== "string") {
        return apiError("rangeStart and rangeEnd (YYYY-MM-DD) are required", 400);
    }

    const db = await getDb();

    // 1. Fetch all entries in this range
    const entries = await db.collection<DailyEntryDoc>("daily_entries")
        .find({ userId: auth.userId, dateKey: { $gte: rangeStart, $lte: rangeEnd } })
        .sort({ dateKey: 1 })
        .toArray();

    if (entries.length === 0) {
        return apiError("No logs found for this period to summarize.", 404, "NO_DATA");
    }

    // 2. Call Gemini for the summary
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const prompt = `
Generate a ${type} summary for the user based on their nightly logs from ${rangeStart} to ${rangeEnd}.
Focus on trends, wins, and areas where they might want to focus next.
Be supportive and encouraging, like a personal coach. Use Markdown.

LOGS:
---
${entries.map(e => `[${e.dateKey}] ${e.dailySummary}`).join("\n")}
---
    `.trim();

        const result = await model.generateContent(prompt);
        const summaryText = result.response.text();

        const summaryDoc: PeriodSummaryDoc = {
            userId: auth.userId,
            periodType: type as "weekly" | "monthly",
            rangeStart,
            rangeEnd,
            summaryText,
            createdAt: new Date(),
        };

        // 3. Store the summary
        await db.collection<PeriodSummaryDoc>("period_summaries").replaceOne(
            { userId: auth.userId, periodType: type as any, rangeStart, rangeEnd },
            summaryDoc,
            { upsert: true }
        );

        return NextResponse.json({ success: true, summary: summaryText });

    } catch (error) {
        console.error("[api/summaries] Generation error:", error);
        return apiError("Failed to generate summary.", 500);
    }
}
