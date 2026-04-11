import { MongoClient, Db } from "mongodb";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const MONGO_URI =
    process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/tracker";

const DB_NAME = "tracker";

// Serverless-friendly: cache across warm invocations
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
    if (cachedClient) return cachedClient;

    const client = new MongoClient(MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    cachedClient = await client.connect();
    return cachedClient;
}

export async function getDb(): Promise<Db> {
    if (cachedDb) return cachedDb;
    const client = await getMongoClient();
    cachedDb = client.db(DB_NAME);
    return cachedDb;
}

// ---------------------------------------------------------------------------
// Index bootstrap (call on app start / first request in dev)
// ---------------------------------------------------------------------------

let indexesEnsured = false;

export async function ensureIndexes(): Promise<void> {
    if (indexesEnsured) return;
    indexesEnsured = true;

    const db = await getDb();

    // users
    await db.collection("users").createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { username: 1 }, unique: true },
    ]);

    // daily_entries — unique per (user, dateKey); also fast recent feed
    await db.collection("daily_entries").createIndexes([
        { key: { userId: 1, dateKey: 1 }, unique: true },
        { key: { userId: 1, dateKey: -1 } },
    ]);

    // user_goals — one doc per user
    await db.collection("user_goals").createIndexes([
        { key: { userId: 1 }, unique: true },
    ]);

    // period_summaries
    await db.collection("period_summaries").createIndexes([
        { key: { userId: 1, periodType: 1, rangeStart: -1 } },
        { key: { userId: 1, periodType: 1, rangeStart: 1, rangeEnd: 1 }, unique: true },
    ]);

    // user_progress — one doc per user
    await db.collection("user_progress").createIndexes([
        { key: { userId: 1 }, unique: true },
    ]);

    // coach_conversations
    await db.collection("coach_conversations").createIndexes([
        { key: { userId: 1, updatedAt: -1 } },
    ]);

    // coach_messages
    await db.collection("coach_messages").createIndexes([
        { key: { conversationId: 1, timestamp: -1 } },
        { key: { userId: 1, timestamp: -1 } },
    ]);

    // refresh_tokens
    await db.collection("refresh_tokens").createIndexes([
        { key: { userId: 1, createdAt: -1 } },
        // Optional auto-cleanup: { key: { expiresAt: 1 }, expireAfterSeconds: 0 }
    ]);

    console.log("[db] Indexes ensured");
}
