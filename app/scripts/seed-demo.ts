import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import type {
  CoachConversationDoc,
  CoachMessageDoc,
  DailyEntryDoc,
  EnergyEstimate,
  UserDoc,
  UserGoalsDoc,
} from "../lib/types";

dotenv.config({ path: ".env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tracker";
const TEST_USER_EMAIL = "demo@example.com";
const TEST_USER_PASSWORD = "demo123456";

const client = new MongoClient(MONGO_URI);

function pickConfidence(): EnergyEstimate["confidence"] {
  const levels: EnergyEstimate["confidence"][] = ["high", "medium", "low"];
  return levels[Math.floor(Math.random() * levels.length)]!;
}

async function seed() {
  try {
    await client.connect();
    const db = client.db("tracker");

    console.log("🌱 Seeding demo data...\n");

    // 1. Create/Get test user
    console.log("👤 Creating test user...");
    const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);
    const usersCol = db.collection<UserDoc>("users");

    const existingUser = await usersCol.findOne({ email: TEST_USER_EMAIL });
    let userId: ObjectId;

    if (existingUser) {
      userId = existingUser._id!;
      console.log(`   ✓ User already exists: ${TEST_USER_EMAIL}`);
    } else {
      const userDoc: UserDoc = {
        email: TEST_USER_EMAIL,
        username: "demo",
        passwordHash,
        status: "approved",
        timezone: "Asia/Kolkata",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const userResult = await usersCol.insertOne(userDoc);
      userId = userResult.insertedId;
      console.log(`   ✓ Created user: ${TEST_USER_EMAIL}`);
    }

    // 2. Create realistic daily entries (last 10 days)
    console.log("\n📝 Creating 10 daily entries...");
    const entriesCol = db.collection<DailyEntryDoc>("daily_entries");

    const workoutOptions = [
      {
        label: "Morning run",
        durationMin: 45,
        intensity: "high",
      },
      {
        label: "Gym session",
        durationMin: 60,
        intensity: "high",
      },
      {
        label: "Yoga",
        durationMin: 30,
        intensity: "low",
      },
      {
        label: "Walking",
        durationMin: 45,
        intensity: "low",
      },
    ];

    const foodOptions = [
      {
        description: "Oatmeal with berries, eggs, toast",
        macros: {
          proteinG: 18,
          carbsG: 65,
          fatsG: 12,
          fiberG: 8,
          vitaminC: "Good (berries)",
          vitaminD: "Moderate (eggs)",
          iron: "Good",
          calcium: "Moderate",
          potassium: "Good",
          magnesium: "Moderate",
        },
        macroSummary:
          "Balanced macros with excellent carbs for energy and decent protein. Good micronutrient profile—fiber-rich. Could add more healthy fats.",
      },
      {
        description: "Salad with grilled chicken, olive oil dressing",
        macros: {
          proteinG: 35,
          carbsG: 12,
          fatsG: 18,
          fiberG: 6,
          vitaminC: "Excellent",
          vitaminD: "Minimal",
          iron: "Good",
          calcium: "Good",
          potassium: "Excellent",
          magnesium: "Good",
        },
        macroSummary:
          "High protein, low carb, healthy fats. Excellent micronutrient profile. Consider adding a carb source for sustained energy.",
      },
      {
        description: "Pasta carbonara, garlic bread, wine",
        macros: {
          proteinG: 22,
          carbsG: 75,
          fatsG: 28,
          fiberG: 4,
          vitaminC: "Minimal",
          vitaminD: "Minimal",
          iron: "Moderate",
          calcium: "Moderate",
          potassium: "Moderate",
          magnesium: "Minimal",
        },
        macroSummary:
          "Heavy in carbs and fats, decent protein. Micronutrient-light meal. Add vegetables next time for more vitamins and fiber.",
      },
      {
        description: "Salmon fillet, quinoa, roasted vegetables",
        macros: {
          proteinG: 40,
          carbsG: 45,
          fatsG: 18,
          fiberG: 8,
          vitaminC: "Good (vegetables)",
          vitaminD: "Excellent (salmon)",
          iron: "Excellent",
          calcium: "Good",
          potassium: "Excellent",
          magnesium: "Good",
        },
        macroSummary:
          "Excellent macro and micronutrient balance. High in omega-3s and iron. This is a nutritionally complete meal.",
      },
      {
        description: "Smoothie bowl with granola and nuts",
        macros: {
          proteinG: 15,
          carbsG: 55,
          fatsG: 16,
          fiberG: 9,
          vitaminC: "Good (fruits)",
          vitaminD: "Minimal",
          iron: "Moderate",
          calcium: "Moderate (yogurt)",
          potassium: "Good",
          magnesium: "Good (nuts)",
        },
        macroSummary:
          "Good carb-to-fiber ratio with balanced fats. Decent vitamins from fruits. Could add protein powder for more sustained satiety.",
      },
      {
        description: "Burrito with rice, beans, guacamole",
        macros: {
          proteinG: 20,
          carbsG: 68,
          fatsG: 22,
          fiberG: 11,
          vitaminC: "Good (salsa, peppers)",
          vitaminD: "Minimal",
          iron: "Good (beans)",
          calcium: "Moderate",
          potassium: "Excellent (beans, avocado)",
          magnesium: "Good",
        },
        macroSummary:
          "Complete protein with excellent fiber. Good micro mix from beans and avocado. Well-balanced and filling meal.",
      },
      {
        description: "Sushi roll, miso soup, edamame",
        macros: {
          proteinG: 25,
          carbsG: 42,
          fatsG: 10,
          fiberG: 5,
          vitaminC: "Minimal",
          vitaminD: "Good (seaweed)",
          iron: "Good (seaweed)",
          calcium: "Moderate (seaweed)",
          potassium: "Good",
          magnesium: "Good (seaweed)",
        },
        macroSummary:
          "Good protein and balanced macros with umami. Rich in iodine from seaweed. Could add more fiber or vegetables.",
      },
    ];

    const summaryOptions = [
      "Tonight, your discipline has forged a path of profound productivity through cognitive focus.",
      "Your effort today reflected a harmonious balance between rest and focused achievement.",
      "The day unfolded with intentional momentum, each moment building toward your vision.",
      "You navigated today's complexities with grace and strategic clarity.",
      "Tonight marks progress—steady, deliberate steps toward your greater purpose.",
    ];

    const sleepOptions = [
      { mainSleepHours: 7.5, napHours: 0, sleepQuality: 8 },
      { mainSleepHours: 8, napHours: 0.5, sleepQuality: 8 },
      { mainSleepHours: 6.5, napHours: 1, sleepQuality: 7 },
      { mainSleepHours: 8.5, napHours: 0, sleepQuality: 9 },
      { mainSleepHours: 7, napHours: 0, sleepQuality: 6 },
      { mainSleepHours: 7.5, napHours: 1.5, sleepQuality: 8 },
      { mainSleepHours: 6, napHours: 0.5, sleepQuality: 5 },
      { mainSleepHours: 8.5, napHours: 1, sleepQuality: 9 },
      { mainSleepHours: 7.5, napHours: 0, sleepQuality: 8 },
      { mainSleepHours: 8, napHours: 0.5, sleepQuality: 8 },
    ];

    const entries: DailyEntryDoc[] = [];
    const today = new Date();

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];

      const didWorkout = Math.random() > 0.3; // 70% chance of workout
      const workout = didWorkout
        ? workoutOptions[Math.floor(Math.random() * workoutOptions.length)]
        : null;

      const caloriesIn = Math.floor(1200 + Math.random() * 1200);
      const caloriesOut = didWorkout && workout ? Math.floor(300 + Math.random() * 400) : 0;

      const rawMessageSuffix = workout
        ? `Had a great ${workout.label} for ${workout.durationMin} minutes. `
        : "";

      const entry: DailyEntryDoc = {
        userId,
        dateKey,
        timezoneAtEntry: "Asia/Kolkata",
        rawMessage: `Today was productive. ${rawMessageSuffix}Ate well, stayed hydrated with 3L of water. Spent about ${Math.floor(
          120 + Math.random() * 300
        )} minutes on screen.`,
        structured: {
          food: foodOptions[Math.floor(Math.random() * foodOptions.length)],
          water: {
            amountMl: 3000,
            note: "3L of water consumed.",
          },
          workout: didWorkout && workout
            ? {
                didSession: true,
                sessions: [{ label: workout.label, durationMin: workout.durationMin }],
              }
            : {
                didSession: false,
              },
          sleep: sleepOptions[i],
          reading: {
            didRead: Math.random() > 0.6,
            pages: Math.random() > 0.6 ? Math.floor(10 + Math.random() * 40) : undefined,
          },
          productivityScore: Math.floor(5 + Math.random() * 6),
          habitsScore: Math.floor(6 + Math.random() * 5),
          screenTimeMinutes: Math.floor(120 + Math.random() * 300),
        },
        dailySummary:
          summaryOptions[Math.floor(Math.random() * summaryOptions.length)],
        ingestModel: "gemini-2.5-flash-lite",
        energyEstimate: {
          caloriesInEstimate: caloriesIn,
          caloriesOutWorkoutEstimate: didWorkout && workout ? caloriesOut : null,
          confidence: pickConfidence(),
          rationale: `Estimated based on logged foods and ${
            didWorkout && workout ? `${workout.durationMin} minute ${workout.label}` : "rest day"
          }.`,
          sources: [
            { title: "USDA FoodData Central" },
            { title: "MET tables for exercise" },
          ],
          model: "gemini-2.5-flash-lite",
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date(date),
        updatedAt: new Date(date),
      };

      entries.push(entry);
    }

    // Upsert all entries
    for (const entry of entries) {
      await entriesCol.updateOne(
        { userId, dateKey: entry.dateKey },
        { $set: entry },
        { upsert: true }
      );
    }
    console.log(`   ✓ Created ${entries.length} daily entries`);

    // 3. Create goals
    console.log("\n🎯 Creating goals...");
    const goalsCol = db.collection<UserGoalsDoc>("user_goals");
    await goalsCol.updateOne(
      { userId },
      {
        $set: {
          userId,
          targets: {
            workoutsPerWeek: 5,
            readingPagesPerWeek: 50,
            targetWaterMlPerDay: 3000,
            codingHoursPerWeek: 20,
          },
          notes: "Aiming for a balanced lifestyle with focus on health and learning.",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log("   ✓ Created goals");

    // 4. Create coach conversations and messages
    console.log("\n🤖 Creating coach conversations and messages...");
    const convsCol = db.collection<CoachConversationDoc>("coach_conversations");
    const msgsCol = db.collection<CoachMessageDoc>("coach_messages");

    const conversationTitles = [
      "Weekly Productivity Review",
      "Fitness Progress Discussion",
      "Hydration & Wellness Habits",
      "Screen Time Management",
      "Goal Setting for Next Week",
    ];

    const userMessages = [
      "How can I improve my workout consistency?",
      "I've been struggling with screen time. Any tips?",
      "What's a realistic goal for next week?",
      "How are my habits looking overall?",
      "Can you help me track my progress better?",
    ];

    const botResponses = [
      "Based on your recent entries, I notice you're averaging 4.5 workouts per week—close to your goal of 5! Keep up the momentum. Consider adding one more session mid-week to hit your target consistently.",
      "Your screen time averages around 220 minutes daily. To reduce this, try the Pomodoro technique: 25 minutes focused work, then a 5-minute break away from screens. You've shown you can do this.",
      "Looking at your trends, your productivity scores hover around 6.5/10. Small wins compound—focus on one area this week (e.g., morning routine or evening wind-down) and track the impact.",
      "Your water intake is solid at 3L daily! That's excellent. Your energy balance shows good awareness of consumption vs. expenditure. Keep logging consistently.",
      "I recommend setting one SMART goal this week: Specific, Measurable, Achievable, Relevant, Time-bound. For example: 'Complete 5 workouts by Sunday, each 45+ minutes.'",
    ];

    for (const title of conversationTitles) {
      const convResult = await convsCol.insertOne({
        userId,
        title,
        titleAutoGenerated: true,
        messageCount: 2,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });

      const convId = convResult.insertedId;

      // Add user message
      await msgsCol.insertOne({
        conversationId: convId,
        userId,
        role: "user",
        content: userMessages[Math.floor(Math.random() * userMessages.length)],
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      // Add bot response
      await msgsCol.insertOne({
        conversationId: convId,
        userId,
        role: "assistant",
        content: botResponses[Math.floor(Math.random() * botResponses.length)],
        timestamp: new Date(),
      });
    }
    console.log(`   ✓ Created ${conversationTitles.length} conversations with messages`);

    console.log("\n✅ Demo data seeded successfully!");
    console.log(`\n🔐 Login credentials:`);
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: ${TEST_USER_PASSWORD}`);
    console.log(`\n📊 Data created:`);
    console.log(`   • 1 user (demo)`);
    console.log(`   • 10 daily entries (last 10 days)`);
    console.log(`   • 1 goals document`);
    console.log(`   • 5 coach conversations with messages`);
    console.log(`\n`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
