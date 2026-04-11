import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDb } from "@/lib/db";
import { requireApprovedUser, apiError } from "@/lib/middleware";
import type { CoachConversationDoc, CoachMessageDoc } from "@/lib/types";
import { streamCoachResponse } from "@/lib/coach";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/coach/conversations/:id/messages
//   ?limit=20&cursor=<messageId>
//   Returns newest-first (bottom-of-chat initial load; scroll up fetches older)
//
// POST /api/coach/conversations/:id/messages
//   Body: { content: string }
//   Stub: stores user message only; streaming assistant reply arrives in plan 03
// ---------------------------------------------------------------------------

async function resolveConversation(convId: ObjectId, userId: ObjectId) {
    const db = await getDb();
    const conv = await db
        .collection<CoachConversationDoc>("coach_conversations")
        .findOne({ _id: convId, userId, deletedAt: null });
    return conv ? db : null;
}

export async function GET(req: NextRequest, { params }: Params) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    let convId: ObjectId;
    try { convId = new ObjectId(id); } catch { return apiError("Invalid conversation id", 400); }

    const db = await getDb();
    // IDOR: verify conversation belongs to this user
    const conv = await db
        .collection<CoachConversationDoc>("coach_conversations")
        .findOne({ _id: convId, userId: auth.userId, deletedAt: null });
    if (!conv) return apiError("Conversation not found", 404);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const cursorRaw = searchParams.get("cursor");

    const col = db.collection<CoachMessageDoc>("coach_messages");

    const filter: Record<string, unknown> = { conversationId: convId, userId: auth.userId };
    if (cursorRaw) {
        try {
            // cursor = oldest message id in the current viewport; fetch messages older than it
            filter._id = { $lt: new ObjectId(cursorRaw) };
        } catch {
            return apiError("Invalid cursor", 400);
        }
    }

    const messages = await col
        .find(filter)
        .sort({ timestamp: -1 })   // newest first
        .limit(limit + 1)          // fetch one extra to determine has_more
        .toArray();

    const has_more = messages.length > limit;
    if (has_more) messages.pop();

    const next_cursor = has_more ? messages[messages.length - 1]._id!.toString() : null;

    return NextResponse.json({
        messages: messages.map((m) => ({
            ...m,
            _id: m._id?.toString(),
            conversationId: m.conversationId?.toString(),
            userId: m.userId?.toString(),
        })),
        next_cursor,
        has_more,
        limit,
    });
}

export async function POST(req: NextRequest, { params }: Params) {
    const auth = await requireApprovedUser(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    let convId: ObjectId;
    try { convId = new ObjectId(id); } catch { return apiError("Invalid conversation id", 400); }

    // 1. Verify Ownership / IDOR
    const db = await getDb();
    const conv = await db
        .collection<CoachConversationDoc>("coach_conversations")
        .findOne({ _id: convId, userId: auth.userId, deletedAt: null });
    if (!conv) return apiError("Conversation not found", 404);

    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Invalid JSON body", 400); }

    const { content } = body as Record<string, unknown>;
    if (typeof content !== "string" || !content.trim()) return apiError("content string required", 400);

    const now = new Date();
    const userMessage: CoachMessageDoc = {
        conversationId: convId,
        userId: auth.userId,
        role: "user",
        content: content.trim(),
        timestamp: now,
    };

    const col = db.collection<CoachMessageDoc>("coach_messages");
    await col.insertOne(userMessage);

    // 2. Fetch history for the LLM context
    const history = await col
        .find({ conversationId: convId, userId: auth.userId })
        .sort({ timestamp: 1 }) // Chronological
        .limit(30)
        .toArray();

    // 3. Prepare streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let fullAssistantContent = "";

            try {
                const coachStream = streamCoachResponse({
                    userId: auth.userId,
                    messages: history,
                });

                for await (const chunk of coachStream) {
                    fullAssistantContent += chunk;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                }

                // 4. Persist Assistant message after stream completes
                const assistantMessage: CoachMessageDoc = {
                    conversationId: convId,
                    userId: auth.userId,
                    role: "assistant",
                    content: fullAssistantContent.trim(),
                    timestamp: new Date(),
                };
                await col.insertOne(assistantMessage);

                // Notify UI about completion
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                controller.close();

                // 5. Update conversation metadata
                await db.collection<CoachConversationDoc>("coach_conversations").updateOne(
                    { _id: convId },
                    { $set: { updatedAt: new Date() }, $inc: { messageCount: 2 } }
                );

            } catch (err: any) {
                console.error("[api/coach] Streaming error:", err);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Streaming failed." })}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
