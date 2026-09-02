import "server-only";
import { redis } from "@/lib/config/redis";

const VERIFIED_PREFIX = "admin-2fa:verified:";
const CHALLENGE_PREFIX = "admin-2fa:challenge:";

const SESSION_VERIFIED_TTL = 60 * 60 * 24 * 7; // match session.expiresIn
const CHALLENGE_TTL = 60 * 5; // 5 min

export const ADMIN_2FA_RESEND_COOLDOWN_MS = 30_000;
export const ADMIN_2FA_MAX_ATTEMPTS = 5;

type ChallengeRecord = { code: string; attempts: number; createdAt: number };

export async function isSessionTwoFactorVerified(sessionToken: string): Promise<boolean> {
  const v = await redis.get<string | number>(`${VERIFIED_PREFIX}${sessionToken}`);
  // Upstash auto-parses "1" → 1 (number), so compare as string
  return String(v) === "1";
}

export async function markSessionTwoFactorVerified(sessionToken: string): Promise<void> {
  await redis.set(`${VERIFIED_PREFIX}${sessionToken}`, "1", { ex: SESSION_VERIFIED_TTL });
}

export async function getChallenge(sessionToken: string): Promise<ChallengeRecord | null> {
  const raw = await redis.get<ChallengeRecord | string>(`${CHALLENGE_PREFIX}${sessionToken}`);
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ChallengeRecord;
    } catch {
      return null;
    }
  }
  return raw as ChallengeRecord;
}

export async function setChallenge(sessionToken: string, record: ChallengeRecord): Promise<void> {
  await redis.set(`${CHALLENGE_PREFIX}${sessionToken}`, JSON.stringify(record), { ex: CHALLENGE_TTL });
}

export async function clearChallenge(sessionToken: string): Promise<void> {
  await redis.del(`${CHALLENGE_PREFIX}${sessionToken}`);
}