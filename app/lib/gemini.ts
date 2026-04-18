import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { IngestResponse, IngestResponseSchema, EnergyEstimateSchema, EnergyEstimateResult } from "./schemas";
import type { StructuredDay } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

// Initialize Gemini SDK
export const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function getGenAI(apiKey?: string) {
    return apiKey ? new GoogleGenerativeAI(apiKey) : genAI;
}

// Define the response schema in the JSON format Gemini expects
const schema = {
    type: SchemaType.OBJECT,
    properties: {
        structured: {
            type: SchemaType.OBJECT,
            properties: {
                food: {
                    type: SchemaType.OBJECT,
                    properties: {
                        description: { type: SchemaType.STRING },
                        macros: {
                            type: SchemaType.OBJECT,
                            properties: {
                                proteinG: { type: SchemaType.NUMBER },
                                carbsG: { type: SchemaType.NUMBER },
                                fatsG: { type: SchemaType.NUMBER },
                                fiberG: { type: SchemaType.NUMBER },
                                vitaminC: { type: SchemaType.STRING },
                                vitaminD: { type: SchemaType.STRING },
                                iron: { type: SchemaType.STRING },
                                calcium: { type: SchemaType.STRING },
                                potassium: { type: SchemaType.STRING },
                                magnesium: { type: SchemaType.STRING }
                            },
                            required: ["proteinG", "carbsG", "fatsG", "fiberG"]
                        },
                        macroSummary: { type: SchemaType.STRING }
                    },
                    required: ["description", "macros", "macroSummary"]
                },
                water: {
                    type: SchemaType.OBJECT,
                    properties: {
                        amountMl: { type: SchemaType.NUMBER },
                        note: { type: SchemaType.STRING }
                    },
                    required: ["amountMl"]
                },
                workout: {
                    type: SchemaType.OBJECT,
                    properties: {
                        didSession: { type: SchemaType.BOOLEAN },
                        sessions: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    label: { type: SchemaType.STRING },
                                    durationMin: { type: SchemaType.NUMBER }
                                },
                                required: ["label", "durationMin"]
                            }
                        }
                    },
                    required: ["didSession"]
                },
                productivityScore: { type: SchemaType.NUMBER },
                reading: {
                    type: SchemaType.OBJECT,
                    properties: {
                        didRead: { type: SchemaType.BOOLEAN },
                        pages: { type: SchemaType.NUMBER },
                        title: { type: SchemaType.STRING },
                        note: { type: SchemaType.STRING }
                    },
                    required: ["didRead"]
                },
                codingBuilding: {
                    type: SchemaType.OBJECT,
                    properties: {
                        summary: { type: SchemaType.STRING }
                    },
                    required: ["summary"]
                },
                sleep: {
                    type: SchemaType.OBJECT,
                    properties: {
                        mainSleepHours: { type: SchemaType.NUMBER },
                        napHours: { type: SchemaType.NUMBER },
                        sleepQuality: { type: SchemaType.NUMBER },
                        notes: { type: SchemaType.STRING }
                    },
                    required: ["mainSleepHours"]
                },
                habitsScore: { type: SchemaType.NUMBER },
                screenTimeMinutes: { type: SchemaType.NUMBER }
            },
            required: ["food", "sleep", "water", "screenTimeMinutes", "productivityScore", "habitsScore"]
        },
        dailySummary: { type: SchemaType.STRING },
        ingestModel: { type: SchemaType.STRING }
    },
    required: ["structured", "dailySummary"]
};

const INGEST_SYSTEM_PROMPT = `
You are a data extraction agent for Arete, a personal AI agent platform. Your job is to transform raw, unstructured daily reflections into a precise, structured data state so Arete can understand patterns and provide meaningful guidance.

### EXTRACTION ARCHITECTURE:
1.  **DAILY SUMMARY (THE KEY INSIGHT):** This is the most important field.
    *   **Format:** A single, grounded sentence in the 2nd person. Be SPECIFIC to what was actually logged. Examples:
        - "You got a 45-minute workout in, ate nutritious meals, and hit your water goal—solid day."
        - "Food intake was lighter than usual, you skipped your workout, but stayed focused on work."
        - "Good balance today: decent food, hit 3L water, skipped the gym but read instead."
    *   **Tone:** Honest, conversational, like a friend reflecting back what they noticed. Not flowery or poetic.
    *   **Content:**
        - Reference ACTUAL logged data: workouts done/not done, food quality, water intake, productivity, reading, screen time
        - Acknowledge wins without over-praising (e.g., "hit your water goal" not "the water gods smiled upon you")
        - If things were missed, be matter-of-fact (e.g., "skipped the gym" not "failed to achieve your athletic pursuits")
        - Connect the dots: if someone had high screen time but low productivity, mention it. If they ate well and worked out, note it.
        - AVOID: buzzwords like "journey," "protocol," "neural," "profound," "forged," "epoch," or flowery adjectives

2.  **EXTRACTION RULES (Be Thorough & Estimate):**
    *   **Sleep (CRITICAL):** ALWAYS EXTRACT AND CALCULATE if ANY sleep times are mentioned. Parse time ranges and calculate hours:
        - Example: "9:45PM to 7:50AM" = 10 hours 5 minutes = 10.08 mainSleepHours
        - Example: "8:30PM to 9:20PM nap" = 50 minutes = 0.83 napHours
        - sleepQuality: 1-10 rating (default 5 if not specified). REQUIRED FIELD.
        - NEVER omit sleep if sleep times are mentioned.
    *   **Food/Water (CRITICAL):** Extract ALL food items. For EACH item, estimate calories AND macros:
        - Description: full list of all items eaten
        - Macros: CALCULATE TOTAL for all foods combined using USDA/typical serving estimates:
          * proteinG: sum of protein from all items (rotis ~3g each, paneer ~20g per serving, soya ~15g, etc.)
          * carbsG: sum of carbs from all items (rotis ~40g each, baaflo ~60g, kheer ~20g, etc.)
          * fatsG: sum of fats from all items (butter toast ~8g, cheese ~7g, ice cream ~12g, etc.)
          * fiberG: sum of fiber from all items (soya ~5g, biscuit ~2g, etc.)
        - macroSummary: ONE sentence analyzing total balance across ALL foods (e.g., "High in carbs (~180g) and protein (~50g) from rotis, paneer, and soya; moderate fat (~40g); good fiber from soya and biscuits")
        - Water: ALWAYS extract amountMl (1.2L → 1200 mL)
    *   **Scores (0-10):** ALWAYS extract if mentioned—productivityScore and habitsScore. Use exact numbers (e.g., "8/10 productivity" → 8).
    *   **Workout (CRITICAL):** ALWAYS extract if ANY exercise is mentioned. Extract ALL sessions with:
        - label: Exercise type (e.g., "Running", "Football", "Cycling", "Weight training")
        - durationMin: CALCULATE duration from time ranges or extract from text:
          * Example: "1.5 hrs football" → 90 durationMin
          * Example: "8:30PM to 9:20PM football" → 50 durationMin
          * Example: "60 min running at 6mph" → 60 durationMin
        - If MULTIPLE exercises listed, create separate session entries for each
        - NEVER omit duration—estimate if time range not explicit (e.g., "quick 10-min walk" → 10, "long gym session" → 60-90 estimated)
        - Set didSession: true if any workout found, false if none mentioned
    *   **Screen Time:** ALWAYS extract if mentioned (e.g., "59 minutes screentime" → 59). Calculate from time ranges (e.g., "8:30PM to 9:20PM" → 50 minutes).
    *   **Boolean Flags:** Extract reading, codingBuilding ONLY if explicitly mentioned. Workout is handled above.

3.  **AUTHORITY:**
    *   The dateKey provided in the system context is absolute.
    *   If the user says "yesterday", adjust only if necessary, but generally map data to the provided epoch.

### OUTPUT PROTOCOL:
Output strictly valid JSON matching the specified schema. No markdown wrappers. No prose before/after.
`;

const ENERGY_SYSTEM_PROMPT = `
You are a nutrition and exercise estimation assistant. Calculate calories consumed and burned based on the structured daily data provided.

CALORIE CALCULATION RULES:
- caloriesInEstimate: Sum ALL food/drink items listed in the food description. Use standard databases (USDA, McDonald's, Chipotle, etc.) to estimate portions. Be realistic:
  * Restaurant burrito: ~900-1200 kcal
  * Small chips bag (1oz): ~150 kcal each
  * Diet soda (250ml): ~0-5 kcal
  * Grilled chicken breast (200g): ~300-350 kcal
  * Rice (standard serving): ~200 kcal
  If portions are vague, assume typical serving sizes. State assumptions in rationale.

- caloriesOutWorkoutEstimate: Calculate from workout sessions using MET (Metabolic Equivalent) tables:
  * Treadmill walking (6 mph, 9% incline, 60 min, ~70kg person): ~450-500 kcal
  * Use formula: MET × body weight (kg) × hours. If weight not specified, assume 70kg.
  * Include ONLY active exercise sessions, NOT resting metabolism.

- If food description is missing/empty, set caloriesInEstimate to null.
- If no workout sessions, set caloriesOutWorkoutEstimate to null.

**CONFIDENCE SCORING:**
The confidence field reflects how much data was available and how many assumptions were needed. It's NOT about nutritional adequacy, it's about ESTIMATION QUALITY.
- confidence: "high" if:
  * Food is specific with portion sizes (e.g., "200g salmon, 1 cup rice, 1 tbsp oil")
  * Workout type, duration, and intensity are clear (e.g., "60 min running at 6mph")
  * All macros can be estimated from concrete descriptions
- confidence: "medium" if:
  * Food is described but portions vague (e.g., "salmon and rice" without amounts)
  * Workout mentioned but duration unclear
  * Some macros based on reasonable assumptions
- confidence: "low" if:
  * Food is very vague or generic (e.g., "ate meals" or "some food")
  * No workout details at all
  * Major macro categories missing
  * Lots of guessing needed
- sources: List specific databases or tables used (e.g., "USDA FoodData Central", "MET table for treadmill exercise").

OUTPUT ONLY valid JSON matching the schema. No markdown, no prose.
`;

const energyEstimateSchema = {
    type: SchemaType.OBJECT,
    properties: {
        caloriesInEstimate: { type: SchemaType.NUMBER, nullable: true },
        caloriesOutWorkoutEstimate: { type: SchemaType.NUMBER, nullable: true },
        confidence: { type: SchemaType.STRING, enum: ["low", "medium", "high"] },
        rationale: { type: SchemaType.STRING },
        sources: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    url: { type: SchemaType.STRING },
                },
                required: ["title"],
            },
        },
    },
    required: ["caloriesInEstimate", "caloriesOutWorkoutEstimate", "confidence", "rationale", "sources"],
};

/**
 * Generate structured content from raw log using Gemini
 */
export async function generateDailyIngest(params: {
    rawMessage: string;
    dateKey: string;
    timezone?: string;
    userGoalsSummary?: string;
    apiKey?: string;
}): Promise<IngestResponse> {
    const key = params.apiKey ?? GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY is not defined in environment");
    }

    const model = getGenAI(params.apiKey).getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: INGEST_SYSTEM_PROMPT,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema as any,
        },
    });

    const prompt = `
DateKey: ${params.dateKey}
User Timezone: ${params.timezone || "UTC"}
User Goals Context: ${params.userGoalsSummary || "None provided"}

User Message:
---
${params.rawMessage}
---
  `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    try {
        const rawJson = JSON.parse(jsonString);
        // Finally validate with Zod to be sure
        return IngestResponseSchema.parse({
            ...rawJson,
            ingestModel: GEMINI_MODEL
        });
    } catch (error) {
        console.error("[gemini] Ingest validation failed:", error);
        throw new Error("Failed to parse and validate Gemini response.");
    }
}

/**
 * Generate energy estimate (calories in/out) from structured day data
 */
export async function generateEnergyEstimate(params: {
    structured: StructuredDay;
    rawMessage: string;
    dateKey: string;
    apiKey?: string;
}): Promise<EnergyEstimateResult & { model: string; updatedAt: string }> {
    const key = params.apiKey ?? GEMINI_API_KEY;
    if (!key) {
        throw new Error("GEMINI_API_KEY is not defined in environment");
    }

    const model = getGenAI(params.apiKey).getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: ENERGY_SYSTEM_PROMPT,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: energyEstimateSchema as any,
        },
    });

    const foodList = params.structured.food?.description || "(No food data)";
    const workoutSessions = params.structured.workout?.sessions?.map(s =>
        `${s.label}${s.durationMin ? ` (${s.durationMin} min)` : ''}`
    ).join(", ") || "(No workout data)";

    const prompt = `
DateKey: ${params.dateKey}

STRUCTURED DATA:
Food logged: ${foodList}
Workout sessions: ${workoutSessions}

RAW USER MESSAGE (for reference):
---
${params.rawMessage}
---

TASK: Estimate total calories consumed (caloriesInEstimate) and total calories burned from exercise (caloriesOutWorkoutEstimate) for this day.
Use realistic portion sizes and MET tables. Provide clear assumptions in rationale.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    try {
        const rawJson = JSON.parse(jsonString);
        // Validate with Zod
        const validated = EnergyEstimateSchema.parse(rawJson);
        return {
            ...validated,
            model: GEMINI_MODEL,
            updatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error("[gemini] Energy estimate validation failed:", error);
        throw new Error("Failed to parse and validate energy estimate response.");
    }
}
