import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "auth_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE_NAME)?.value;
  return value;
}

export async function setSessionCookie(
  value: string,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function deleteSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
