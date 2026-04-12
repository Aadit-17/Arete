import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireApprovedUser, apiError } from "@/lib/middleware";
import { genAI } from "@/lib/gemini";
import { serializePeriodSummaryPublic } from "@/lib/serialize-public";
import type { DailyEntryDoc, PeriodSummaryDoc, UserGoalsDoc } from "@/lib/types";

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

    const [entries, goalsDoc] = await Promise.all([
        db.collection<DailyEntryDoc>("daily_entries")
            .find({ userId: auth.userId, dateKey: { $gte: rangeStart, $lte: rangeEnd } })
            .sort({ dateKey: 1 })
            .toArray(),
        db.collection<UserGoalsDoc>("user_goals").findOne({ userId: auth.userId }),
    ]);

    if (entries.length === 0) {
        return apiError("No logs found for this period to summarize.", 404, "NO_DATA");
    }

    const goalsBlock =
        goalsDoc?.targets && Object.keys(goalsDoc.targets).length > 0
            ? Object.entries(goalsDoc.targets)
                  .map(([k, v]) => `- ${k.replace(/([A-Z])/g, " $1").trim()}: ${v}`)
                  .join("\n")
            : "(No goals saved — still judge the week on consistency and stated daily summaries only.)";

    const logLines = entries.map((e) => {
        const s = e.structured || {};
        const parts = [
            e.dailySummary || "—",
            s.workout?.didSession
                ? `workout: ${s.workout.sessions?.map((x: { label: string }) => x.label).join(", ") || "yes"}`
                : s.workout ? "workout: rest" : null,
            s.food?.description ? `food: ${s.food.description}` : null,
            s.water?.amountMl != null ? `water_ml: ${s.water.amountMl}` : null,
            s.sleep?.mainSleepHours != null
                ? `sleep_h: ${s.sleep.mainSleepHours}${s.sleep.napHours ? `+nap ${s.sleep.napHours}` : ""}`
                : null,
            s.screenTimeMinutes != null ? `screen_min: ${s.screenTimeMinutes}` : null,
            s.productivityScore != null ? `productivity/10: ${s.productivityScore}` : null,
            e.energyEstimate?.caloriesInEstimate != null
                ? `kcal_in~${e.energyEstimate.caloriesInEstimate}`
                : null,
        ].filter(Boolean);
        return `[${e.dateKey}] ${parts.join(" | ")}`;
    });

    // 2. Call Gemini for the summary
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const prompt = `
You are writing a **concise ${type} recap** for a habit-tracking user. Output **Markdown only**.

Tone: direct, concrete, zero fluff—no buzzwords, no "journey", no cheerleading. Prefer numbers and dates from the data.

Use exactly these sections (## headings):
## What went well
Bullet facts tied to the logs (sleep, workouts, food, water, screen, productivity, energy—only what the data supports).

## What needs improvement
Honest gaps vs patterns in the logs. If something wasn't logged, say "not enough data" instead of inventing.

## Goals check-in
Compare the week to the user's saved goals below. State where they met, missed, or had no signal.

## Suggestions for next week
3–6 **specific** actions (measurable or time-bound). Tie them to goals and to what actually happened this week.

USER GOALS (may be partial):
${goalsBlock}

DAILY LOGS (${rangeStart} through ${rangeEnd}, chronological):
---
${logLines.join("\n")}
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
