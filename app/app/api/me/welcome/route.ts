import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireApprovedUser } from "@/lib/middleware";
import type { DailyEntryDoc, PeriodSummaryDoc, UserGoalsDoc } from "@/lib/types";

// ---------------------------------------------------------------------------
// GET /api/me/welcome
// Provides fresh context for the "App Open" experience:
// - Latest streak (placeholder or simple count)
// - Latest period summary
// - Goal progress hints
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const db = await getDb();

    const [latestEntry, lastSummary, goals, allEntries] = await Promise.all([
        db.collection<DailyEntryDoc>("daily_entries")
            .findOne({ userId: auth.userId }, { sort: { dateKey: -1 } }),
        db.collection<PeriodSummaryDoc>("period_summaries")
            .findOne({ userId: auth.userId }, { sort: { rangeStart: -1 } }),
        db.collection<UserGoalsDoc>("user_goals")
            .findOne({ userId: auth.userId }),
        db.collection<DailyEntryDoc>("daily_entries")
            .find({ userId: auth.userId })
            .sort({ dateKey: -1 })
            .toArray(),
    ]);

    // Calculate consecutive streak backwards from latest entry
    let streak = 0;
    if (latestEntry && allEntries.length > 0) {
        const sortedDates = allEntries
            .map(e => e.dateKey)
            .sort()
            .reverse();

        // Start from the latest date
        let currentDate = new Date(sortedDates[0] + 'T00:00:00');
        let streakCount = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const nextDate = new Date(sortedDates[i] + 'T00:00:00');
            const diffMs = currentDate.getTime() - nextDate.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            // If the next entry is exactly 1 day before, continue streak
            if (Math.abs(diffDays - 1) < 0.01) {
                streakCount++;
                currentDate = nextDate;
            } else {
                // Streak broken
                break;
            }
        }

        streak = streakCount;
    }

    return NextResponse.json({
        streak,
        latestSummary: lastSummary ? {
            type: lastSummary.periodType,
            text: lastSummary.summaryText.slice(0, 200) + "...",
            rangeEnd: lastSummary.rangeEnd,
        } : null,
        hasGoals: !!goals,
        lastLogDate: latestEntry?.dateKey ?? null,
        welcomeMessage: "Welcome back! Ready to log tonight's progress?",
    });
}
