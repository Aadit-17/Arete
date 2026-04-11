import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
    // This runs at module load in the server; fail loudly in production
    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT secrets must be set in environment variables");
    }
    console.warn("[auth] JWT secrets not set — using insecure defaults (dev only)");
}

const ACCESS_TTL = "15m";
const REFRESH_TTL_DAYS = 30;

// ---------------------------------------------------------------------------
// Access JWT
// ---------------------------------------------------------------------------

export interface AccessTokenPayload {
    sub: string;   // userId as string
    exp?: number;
}

export function signAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, ACCESS_SECRET ?? "dev-access-secret", {
        expiresIn: ACCESS_TTL,
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_SECRET ?? "dev-access-secret") as AccessTokenPayload;
}

// ---------------------------------------------------------------------------
// Refresh token helpers
// ---------------------------------------------------------------------------

export function getRefreshExpiryDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() + REFRESH_TTL_DAYS);
    return d;
}

// Generate a cryptographically random refresh token value
import crypto from "crypto";

export function generateRefreshTokenValue(): string {
    return crypto.randomBytes(64).toString("hex");
}

// Hash the refresh token for safe storage (no salt needed — already random)
export function hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}
