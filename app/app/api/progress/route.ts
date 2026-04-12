import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireApprovedUser, apiError } from "@/lib/middleware";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import type { UserProgressDoc, DailyEntryDoc } from "@/lib/types";

// ---------------------------------------------------------------------------
// GET /api/progress — return current user's progress narrative
// PUT /api/progress — Refresh/Regenerate the progress narrative (LLM-powered)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const db = await getDb();
    const doc = await db
        .collection<UserProgressDoc>("user_progress")
        .findOne({ userId: auth.userId });

    return NextResponse.json({
        narrative: doc?.narrative ?? null,
        lastRefreshedAt: doc?.lastRefreshedAt ?? null,
    });
}

export async function PUT(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const db = await getDb();

    // 1. Fetch last 14-20 days of data for context
    const entries = await db.collection<DailyEntryDoc>("daily_entries")
        .find({ userId: auth.userId })
        .sort({ dateKey: -1 })
        .limit(20)
        .toArray();

    if (entries.length === 0) {
        return apiError("No logs found to refresh progress.", 404, "NO_DATA");
    }

    // 2. Call Gemini for a deep progress narrative
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `
Generate a deep, reflective progress narrative (approx 14-day view) for the user.
Analyze their logs, identify behavioral patterns, and offer high-level reflection on their journey.
Use Markdown with sections for 'Recent Highlights', 'Patterns identified', and 'Coach's Insight'.

RECENT LOGS:
---
${entries.reverse().map(e => `[${e.dateKey}] ${e.dailySummary}`).join("\n")}
---
    `.trim();

        const result = await model.generateContent(prompt);
        const narrative = result.response.text();

        const now = new Date();
        await db.collection<UserProgressDoc>("user_progress").updateOne(
            { userId: auth.userId },
            {
                $set: {
                    userId: auth.userId,
                    narrative,
                    lastRefreshedAt: now,
                    updatedAt: now,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, narrative, lastRefreshedAt: now });

    } catch (error) {
        console.error("[api/progress] Refresh error:", error);
        return apiError("Failed to refresh progress narrative.", 500);
    }
}
