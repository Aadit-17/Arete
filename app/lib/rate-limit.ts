/**
 * Simple in-memory sliding window rate limiter.
 * No Redis — resets on cold start / deploy. Fine for v1.
 *
 * Usage:
 *   if (!rateLimiter.allow("login", ip, 5, 60_000)) return apiError("Rate limit exceeded", 429);
 */

interface Window {
    count: number;
    start: number;
}

const store = new Map<string, Window>();

export const rateLimiter = {
    /**
     * @param namespace  e.g. "login", "register"
     * @param key        typically the IP address
     * @param maxRequests max hits in the window
     * @param windowMs   window size in milliseconds
     */
    allow(namespace: string, key: string, maxRequests: number, windowMs: number): boolean {
        const storeKey = `${namespace}:${key}`;
        const now = Date.now();
        const entry = store.get(storeKey);

        if (!entry || now - entry.start > windowMs) {
            store.set(storeKey, { count: 1, start: now });
            return true;
        }

        if (entry.count >= maxRequests) return false;

        entry.count++;
        return true;
    },
};
