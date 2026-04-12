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
                            }
                        },
                        macroSummary: { type: SchemaType.STRING }
                    },
                    required: ["description"]
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
                                required: ["label"]
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
                    }
                },
                habitsScore: { type: SchemaType.NUMBER },
                screenTimeMinutes: { type: SchemaType.NUMBER }
            }
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

2.  **STRICT SCHEMA RULES:**
    *   **Sleep:** Extract if mentioned. Include mainSleepHours (night sleep), napHours (daytime naps), and sleepQuality (1-10 subjective rating). If not explicitly mentioned, omit the entire sleep object.
    *   **Food/Water:** Only include if explicitly mentioned. If food is logged, capture the "essence" of the description (e.g., "Salmon and greens" instead of just "Food").
    *   **Food Macros (IF FOOD IS LOGGED):** Extract estimated macronutrients and key micronutrients based on the food description:
        - **Macros (numbers):** proteinG, carbsG, fatsG, fiberG (estimate in grams based on typical portions)
        - **Micros (text descriptions):** vitaminC, vitaminD, iron, calcium, potassium, magnesium (describe presence/amount, e.g., "Good source" or "Moderate amount")
        - **macroSummary:** ONE sentence evaluating macro balance and what's needed. Examples:
          * "High in protein and carbs but lacking healthy fats—consider adding nuts or avocado."
          * "Good macro balance with solid micronutrient profile. Could use more iron-rich foods."
          * "Carb-heavy meal with moderate protein—adding a protein source would improve balance."
    *   **Scores (0-10):** If the user provides a score, use it. If they describe their productivity or habits state (e.g., "I felt super focused" or "I struggled to focus"), infer a score logically.
    *   **Boolean Flags:** Be literal. If they didn't mention reading/coding/workout, assume 'didRead: false', etc., UNLESS the context implies it (e.g., "Finished 20 pages").
    *   **Screen Time:** Extract total screen time in minutes if mentioned (e.g., "2 hours on phone" → 120 minutes). Sum multiple devices if listed separately. Omit field if not mentioned.

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
