import { z } from "zod";

// ---------------------------------------------------------------------------
// Daily Entry Ingest Schemas
// Matches TRACKER_APP_CONTEXT.md §15.2
// ---------------------------------------------------------------------------

export const MacroSchema = z.object({
    proteinG: z.number().describe("Protein in grams"),
    carbsG: z.number().describe("Carbohydrates in grams"),
    fatsG: z.number().describe("Fats in grams"),
    fiberG: z.number().describe("Fiber in grams"),
    vitaminC: z.string().optional().describe("Vitamin C content"),
    vitaminD: z.string().optional().describe("Vitamin D content"),
    iron: z.string().optional().describe("Iron content"),
    calcium: z.string().optional().describe("Calcium content"),
    potassium: z.string().optional().describe("Potassium content"),
    magnesium: z.string().optional().describe("Magnesium content"),
});

export const FoodSchema = z.object({
    description: z.string().describe("Meal and intake description for the day"),
    macros: MacroSchema.describe("Estimated macro and micronutrient breakdown"),
    macroSummary: z.string().describe("Summary of macro balance and recommendations"),
});

export const WaterSchema = z.object({
    amountMl: z.number().int().describe("Amount of water in milliliters"),
    note: z.string().optional(),
});

export const SleepSchema = z.object({
    mainSleepHours: z.number().describe("Main sleep duration in hours"),
    napHours: z.number().optional().describe("Nap duration in hours"),
    sleepQuality: z.number().min(1).max(10).optional().describe("Sleep quality rating 1-10"),
    notes: z.string().optional().describe("Additional sleep notes"),
});

export const WorkoutSessionSchema = z.object({
    label: z.string().describe("Name/type of workout"),
    durationMin: z.number().int().describe("Duration in minutes"),
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
 * - Food, water, sleep, screen time, scores: ALWAYS extract and estimate if ANY data is mentioned.
 * - Reading, workout, coding: Extract ONLY if explicitly mentioned.
 */
export const IngestStructuredSchema = z.object({
    food: FoodSchema.describe("Food intake with macro estimation").optional(),
    water: WaterSchema.describe("Water intake").optional(),
    workout: WorkoutSchema.optional().default({ didSession: false }),
    sleep: SleepSchema.describe("Sleep duration and quality").optional(),
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
