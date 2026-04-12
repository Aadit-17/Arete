import { NextRequest, NextResponse } from "next/server";
import { requireApprovedUser, apiError } from "@/lib/middleware";
import { getDb } from "@/lib/db";
import { publicEnergyEstimate } from "@/lib/serialize-public";
import { generateDailyIngest, generateEnergyEstimate } from "@/lib/gemini";
import type { DailyEntryDoc, UserGoalsDoc } from "@/lib/types";
import { IngestResponseSchema } from "@/lib/schemas";

// ---------------------------------------------------------------------------
// POST /api/ingest
// Accepts: { dateKey, rawMessage, timezoneAtEntry?, edit?: boolean }
// Returns: The saved structured daily entry
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return apiError("Invalid JSON body", 400);
    }

    const { dateKey, rawMessage, timezoneAtEntry } = body as Record<string, unknown>;

    if (!dateKey || typeof dateKey !== "string") {
        return apiError("dateKey (YYYY-MM-DD) is required", 400);
    }

    if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
        return apiError("rawMessage string is required", 400);
    }

    const db = await getDb();

    // (Optional) Fetch user goals to provide as context to Gemini
    const goalsDoc = await db
        .collection<UserGoalsDoc>("user_goals")
        .findOne({ userId: auth.userId });

    let userGoalsSummary = "";
    if (goalsDoc?.targets) {
        userGoalsSummary = Object.entries(goalsDoc.targets)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
    }

    const geminiKey = auth.isDemo
        ? (process.env.GEMINI_DEMO_KEY ?? process.env.GEMINI_API_KEY!)
        : process.env.GEMINI_API_KEY!;

    try {
        // 1. Call Gemini to parse the unstructured message
        const ingestResult = await generateDailyIngest({
            rawMessage,
            dateKey,
            timezone: (timezoneAtEntry as string) || "UTC",
            userGoalsSummary,
            apiKey: geminiKey,
        });

        // 2. Prepare the document for persistence
        const now = new Date();
        const doc: DailyEntryDoc = {
            userId: auth.userId,
            dateKey,
            timezoneAtEntry: (timezoneAtEntry as string) || "UTC",
            rawMessage,
            structured: ingestResult.structured,
            dailySummary: ingestResult.dailySummary,
            ingestModel: ingestResult.ingestModel,
            createdAt: now,
            updatedAt: now,
        };

        // 2b. Generate energy estimate (always enabled)
        try {
            const energyEstimate = await generateEnergyEstimate({
                structured: ingestResult.structured,
                rawMessage,
                dateKey,
                apiKey: geminiKey,
            });
            doc.energyEstimate = energyEstimate;
        } catch (energyError) {
            // Log but don't fail the entire ingest on energy estimate failure
            console.error("[api/ingest] Energy estimate generation failed (non-fatal):", energyError);
        }

        // 3. Upsert (replaceOne) the daily entry for this (userId, dateKey)
        await db.collection<DailyEntryDoc>("daily_entries").replaceOne(
            { userId: auth.userId, dateKey },
            doc,
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            entry: {
                dateKey: doc.dateKey,
                dailySummary: doc.dailySummary,
                structured: doc.structured,
                energyEstimate: publicEnergyEstimate(doc.energyEstimate),
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error("[api/ingest] Error during ingestion:", error);

        const is429 = error?.status === 429 ||
            error?.message?.includes("429") ||
            error?.message?.toLowerCase().includes("resource_exhausted") ||
            error?.message?.toLowerCase().includes("too many requests");

        if (is429) {
            return apiError(
                auth.isDemo
                    ? "The demo account has hit its AI quota for now. This is a shared demo key with limited capacity — try again in a minute, or create your own account to get full access."
                    : "AI quota exceeded. Please try again shortly.",
                429,
                "RATE_LIMITED"
            );
        }

        // In case of Zod or business validation error from GEMINI wrapper
        return apiError(
            error.message || "An error occurred during ingestion.",
            error.name === "ZodError" ? 422 : 500,
            "INGEST_ERROR"
        );
    }
}
