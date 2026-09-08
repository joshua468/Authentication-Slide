import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/security/cookies";
import { findSessionByTokenHash } from "@/features/auth/repositories/session";
import { hashValue } from "@/lib/security/tokens";
import type { SafeUser } from "@/features/auth/types";

export function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
  };
}

export async function getCurrentUserSafe(): Promise<SafeUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  const session = await findSessionByTokenHash(hashValue(token));
  if (!session) return null;
  return toSafeUser({ ...session.user });
}

export async function requireCurrentUser(): Promise<SafeUser> {
  const user = await getCurrentUserSafe();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return jsonError("Not signed in.", 401);
  }
  console.error(error);
  return jsonError("Something went wrong.", 500);
}