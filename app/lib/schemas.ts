import { z } from "zod";

// ---------------------------------------------------------------------------
// Daily Entry Ingest Schemas
// Matches TRACKER_APP_CONTEXT.md §15.2
// ---------------------------------------------------------------------------

export const FoodSchema = z.object({
    description: z.string().describe("Meal and intake description for the day"),
});

export const WaterSchema = z.object({
    amountMl: z.number().int().describe("Amount of water in milliliters"),
    note: z.string().optional(),
});

export const WorkoutSessionSchema = z.object({
    label: z.string().describe("Name/type of workout"),
    durationMin: z.number().int().optional().describe("Duration in minutes"),
});

export const WorkoutSchema = z.object({
    didSession: z.boolean().describe("Whether any workout happened"),
    sessions: z.array(WorkoutSessionSchema).optional(),
});

export const ReadingSchema = z.object({
    didRead: z.boolean().describe("Whether any reading happened"),
    pages: z.number().int().optional().describe("Number of pages read"),
    title: z.string().optional().describe("Title or subject of the reading"),
    note: z.string().optional(),
});

export const CodingSchema = z.object({
    summary: z.string().describe("Summary of what was coded or built"),
});

/**
 * The structured payload representing the dimensions being tracked.
 * 
 * Rules (§4.1):
 * - Food & water: Omit fields if not mentioned (don't use nulls).
 * - Others: If absent from message, treat as false/empty (did not do).
 */
export const IngestStructuredSchema = z.object({
    food: FoodSchema.optional(),
    water: WaterSchema.optional(),
    workout: WorkoutSchema.optional().default({ didSession: false }),
    productivityScore: z.number().min(0).max(10).describe("Self-assigned 0–10 productivity score").optional(),
    reading: ReadingSchema.optional().default({ didRead: false }),
    codingBuilding: CodingSchema.or(z.string()).optional().describe("Summary of coding/building"),
    habitsScore: z.number().min(0).max(10).describe("Self-assigned 0–10 habits score").optional(),
    screenTimeMinutes: z.number().int().min(0).describe("Total screen time in minutes").optional(),
});

/**
 * The full response expected from Gemini for ingestion.
 */
export const IngestResponseSchema = z.object({
    structured: IngestStructuredSchema,
    dailySummary: z.string().describe("A concise narrative summary of the day"),
    ingestModel: z.string().optional().describe("The name of the model that performed the ingestion"),
});

export type IngestStructured = z.infer<typeof IngestStructuredSchema>;
export type IngestResponse = z.infer<typeof IngestResponseSchema>;

// ---------------------------------------------------------------------------
// Energy Estimation Schemas
// ---------------------------------------------------------------------------

export const EnergyEstimateSourceSchema = z.object({
    title: z.string().describe("Title or citation of the reference source"),
    url: z.string().optional().describe("URL to the source if available"),
});

export const EnergyEstimateSchema = z.object({
    caloriesInEstimate: z.number().nullable().describe("Estimated calories consumed from food/drink"),
    caloriesOutWorkoutEstimate: z.number().nullable().describe("Estimated calories burned from exercise sessions"),
    confidence: z.enum(["low", "medium", "high"]).describe("Confidence level of the estimate"),
    rationale: z.string().describe("Explanation of how estimates were calculated"),
    sources: z.array(EnergyEstimateSourceSchema).describe("References used for estimation"),
});

export type EnergyEstimateResult = z.infer<typeof EnergyEstimateSchema>;
