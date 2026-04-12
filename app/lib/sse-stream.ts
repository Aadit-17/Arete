/**
 * Parse Server-Sent Events frames separated by blank lines (\n\n).
 * Each frame may contain one or more `data: ...` lines (JSON payloads).
 */

export type CoachSsePayload = { text?: string; done?: boolean; error?: string };

/** Feed raw bytes into buffer; invoke onPayload for each complete SSE JSON payload. Returns unused trailing buffer. */
export function feedCoachSseBuffer(
    buffer: string,
    chunk: string,
    onPayload: (data: CoachSsePayload) => void
): string {
    let buf = buffer + chunk;
    while (true) {
        const sep = buf.indexOf('\n\n');
        if (sep === -1) break;
        const frame = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        for (const rawLine of frame.split('\n')) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const jsonPart = line.slice(5).trimStart();
            if (!jsonPart) continue;
            try {
                onPayload(JSON.parse(jsonPart) as CoachSsePayload);
            } catch {
                /* partial or non-JSON */
            }
        }
    }
    return buf;
}

/** Read entire coach POST /messages stream until the reader closes; returns assistant text. */
export async function readCoachSseResponseToCompletion(res: Response): Promise<{ text: string; error?: string }> {
    const reader = res.body?.getReader();
    if (!reader) return { text: '', error: 'No response body' };

    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let err: string | undefined;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer = feedCoachSseBuffer(buffer, decoder.decode(value, { stream: true }), (data) => {
            if (data.text) text += data.text;
            if (data.error) err = data.error;
        });
    }

    if (buffer.trim()) {
        for (const rawLine of buffer.split('\n')) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const jsonPart = line.slice(5).trimStart();
            if (!jsonPart) continue;
            try {
                const data = JSON.parse(jsonPart) as CoachSsePayload;
                if (data.text) text += data.text;
                if (data.error) err = data.error;
            } catch {
                /* tail incomplete */
            }
        }
    }

    return { text: text.trim(), error: err };
}
