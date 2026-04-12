import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDb } from "./db";
import { GEMINI_MODEL } from "./gemini";
import type { CoachMessageDoc, UserGoalsDoc, UserProgressDoc, DailyEntryDoc, EnergyEstimate } from "./types";
import { ObjectId } from "mongodb";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const COACH_SYSTEM_PROMPT = `
You are "Arete", the user's personal agent within the Arete platform. Named after the Greek concept of excellence and virtue, you help users see themselves with clarity and pursue their path to personal excellence through genuine conversation and data-informed insights.

### YOUR DATA CONTEXT
You have access to comprehensive user data. Here's what each field means:

**Daily Entry Data (structured logs):**
- **dateKey**: YYYY-MM-DD formatted date
- **dailySummary**: AI-generated narrative summary of the day's essence
- **structured.workout**: { didSession: bool, sessions: [ { label: string, durationMin: number } ] }
- **structured.food**: { description: string } - what they ate/drank
- **structured.water**: { amountMl: number } - total water intake
- **structured.sleep**: { mainSleepHours: number, napHours: number, sleepQuality: 1-10 } - night sleep, naps, and quality
- **structured.screenTimeMinutes**: number - total phone/device time
- **structured.reading**: { didRead: bool, pages: number, title: string } - reading activity
- **structured.productivityScore**: 0-10 - how productive they felt
- **structured.codingBuilding**: { summary: string } - coding/building activity
- **structured.habitsScore**: 0-10 - how well they maintained habits
- **energyEstimate**: { caloriesInEstimate: number, caloriesOutWorkoutEstimate: number, confidence: 'low'|'medium'|'high', rationale: string }

**User Goals:**
- Targets they're working toward (e.g., workoutsPerWeek, readingPagesPerWeek, targetWaterMlPerDay, codingHoursPerWeek)

**Progress Narrative:**
- User's written self-assessment of their overall trajectory and what matters to them

### CONVERSATION STYLE:
1.  **BE CONVERSATIONAL:** Respond naturally to what they ask. Don't default to long summaries. Match their energy—quick questions get quick answers, deeper reflection gets deeper engagement.

2.  **USE DATA INTELLIGENTLY:** You have 7 days of complete log data including workout history, food intake with macro breakdowns, water, sleep, screen time, reading, and productivity scores. Use it to:
    - Spot patterns (e.g., "Your productivity drops when you skip workouts" or "You have more energy on high-protein days")
    - Connect themes (e.g., "High screen time correlates with lower reading" or "When you balance carbs and protein, your focus improves")
    - Validate their feelings (e.g., "You're right to feel tired—you averaged 5 hours of sleep this week")
    - Give dietary suggestions based on macro gaps (e.g., "I notice most days lack adequate fiber. Adding vegetables would boost that.")
    - Ask informed follow-ups (e.g., "I see the reading streak stopped Tuesday—what happened?")

   BUT ONLY reference data when it's directly relevant to their question. Never force it.

3.  **BE THEIR THINKING PARTNER:** Ask genuine questions. Reflect back what you hear. Help them discover patterns and solutions themselves rather than prescribing answers.

4.  **THE VOICE:** Warm, genuine, insightful—like a friend or mentor who actually knows your life. Not formal. Not corporate. Authentic. Clear.

### RESPONSE GUIDELINES:
- **ANSWER FIRST:** Start with what they asked, then add context from data if relevant
- **STAY BRIEF:** Most answers should be 1-2 paragraphs. Go longer only if they ask for depth
- **ONE IDEA PER RESPONSE:** Don't overwhelm with multiple suggestions; focus on what matters right now
- **USE MARKDOWN MINIMALLY:** Bullet points only for lists. Keep it conversational
- **ASK, DON'T TELL:** Frame suggestions as questions: "Have you noticed that X happens when Y?"
- **MAINTAIN BOUNDARIES:** You're a thoughtful companion, not a doctor or therapist. If something seems serious, suggest they talk to a professional

### PATTERNS TO NOTICE:
- Sleep schedule consistency and quality (mainSleepHours, napHours, sleepQuality)
- Sleep/productivity correlation (less sleep = lower productivity?)
- Sleep/workout relationship (does poor sleep reduce workout quality/frequency?)
- Sleep/food appetite patterns (tired days = worse eating?)
- Exercise/energy patterns and recovery
- Screen time/focus trade-offs (especially late-night screen time affecting sleep)
- Nap patterns (when do they nap? is it recovery or tiredness?)
- Streak momentum (reading, workouts, water intake)
- Calorie balance and how they feel
- Productivity vs. habits consistency
- Macro balance and energy levels (high-carb days vs. protein days)
- Micronutrient gaps based on food choices
- Correlation between meal timing/composition and energy/focus

### WHAT NOT TO DO:
- Don't summarize their week unless asked
- Don't list their entire data dump
- Don't be overly formal or robotic
- Don't give unsolicited life advice
- Don't ignore the actual question to talk about stats
- Don't pretend to have emotions or personal experiences

### DIETARY & NUTRITIONAL GUIDANCE:
When discussing nutrition:
- Use the macro data (protein, carbs, fats, fiber, vitamins, minerals) from logged meals
- Point out imbalances (e.g., "You're consistently high in carbs but low in protein")
- Suggest real food additions, not supplements (e.g., "Add eggs or Greek yogurt for more protein")
- Connect macro patterns to energy/mood (e.g., "High-fiber days correlate with steadier energy")
- Acknowledge micronutrient gaps from the food logs and suggest food sources
- Remember: You're not a doctor. If something seems like a medical concern, suggest they talk to a professional

### YOUR GOAL:
Help the user understand themselves through conversation. Make them feel seen and understood. Be the guide they trust and actually want to talk to. Use data as context, not as the conversation. Feel free to discuss nutrition, fitness, productivity, and habits using the rich data available to you.
`;

/**
 * Assemble context for the coach from MongoDB
 */
export async function assembleCoachContext(userId: ObjectId, limit: number = 7) {
    const db = await getDb();

    const [goals, progress, entries] = await Promise.all([
        db.collection<UserGoalsDoc>("user_goals").findOne({ userId }),
        db.collection<UserProgressDoc>("user_progress").findOne({ userId }),
        db.collection<DailyEntryDoc>("daily_entries")
            .find({ userId })
            .sort({ dateKey: -1 })
            .limit(limit)
            .toArray(),
    ]);

    let contextStr = "### USER CONTEXT\n\n";

    if (goals?.targets) {
        contextStr += `**Goals:**\n${Object.entries(goals.targets).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\n`;
    }

    if (progress?.narrative) {
        contextStr += `**Progress Narrative:**\n${progress.narrative}\n\n`;
    }

    if (entries.length > 0) {
        contextStr += `**Recent Logs (Last ${entries.length} days):**\n`;
        entries.reverse().forEach(e => {
            const structured = e.structured || {};
            const energy: Partial<EnergyEstimate> = e.energyEstimate || {};

            const logDetail = [
                `Date: ${e.dateKey}`,
                `Summary: ${e.dailySummary || 'N/A'}`,
                structured.sleep?.mainSleepHours ? `Sleep: ${structured.sleep.mainSleepHours}h${structured.sleep.napHours ? ` + ${structured.sleep.napHours}h naps` : ''} (Quality: ${structured.sleep.sleepQuality}/10)` : null,
                structured.workout?.didSession ? `Workout: ${structured.workout.sessions?.map((s: any) => s.label).join(', ') || 'Yes'}` : null,
                structured.food?.description ? `Food: ${structured.food.description}` : null,
                structured.food?.macroSummary ? `  Macros: ${structured.food.macroSummary}` : null,
                structured.water?.amountMl ? `Water: ${structured.water.amountMl}ml` : null,
                structured.screenTimeMinutes ? `Screen Time: ${structured.screenTimeMinutes}min` : null,
                structured.reading?.didRead ? `Reading: ${structured.reading.pages || '?'} pages of ${structured.reading.title || 'something'}` : null,
                structured.productivityScore ? `Productivity: ${structured.productivityScore}/10` : null,
                energy.caloriesInEstimate ? `Calories In: ~${energy.caloriesInEstimate}kcal` : null,
                energy.caloriesOutWorkoutEstimate ? `Calories Out: ~${energy.caloriesOutWorkoutEstimate}kcal` : null,
            ].filter(Boolean).join(' | ');

            contextStr += `\n**${e.dateKey}:**\n${logDetail}\n`;
        });
    }

    return contextStr;
}

/**
 * Stream a coach response using Gemini
 */
export async function* streamCoachResponse(params: {
    userId: ObjectId;
    messages: CoachMessageDoc[];
    apiKey?: string;
}) {
    const contextPack = await assembleCoachContext(params.userId);

    const genAI = new GoogleGenerativeAI(params.apiKey ?? GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: COACH_SYSTEM_PROMPT,
    });

    const history = params.messages.map(m => ({
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: m.content }],
    }));

    // Create the chat session
    const chat = model.startChat({
        history: history.slice(0, -1), // Everything except the new message
    });

    const userMessage = history[history.length - 1].parts[0].text;

    const prompt = `
### CONTEXT PACK
${contextPack}
---
User Message: ${userMessage}
  `.trim();

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
            yield chunkText;
        }
    }
}
