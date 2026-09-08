import { createTokenPair, hashValue } from "@/lib/security/tokens";
import {
  createSessionRecord,
  destroySessionByTokenHash,
} from "@/features/auth/repositories/session";
import {
  setSessionCookie,
  deleteSessionCookie,
  getSessionCookie,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/security/cookies";

export async function createSession(userId: string): Promise<void> {
  const { plain, hash } = createTokenPair(32);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await createSessionRecord(userId, hash, expiresAt);
  await setSessionCookie(plain, SESSION_MAX_AGE_SECONDS);
}

export async function destroySession(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    await destroySessionByTokenHash(hashValue(token));
  }
  await deleteSessionCookie();
}