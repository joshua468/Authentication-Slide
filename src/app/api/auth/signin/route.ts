import { NextResponse } from "next/server";
import { signInSchema } from "@/features/auth/schemas/validation";
import { findUserByEmail } from "@/features/auth/repositories/user";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/features/auth/services/session";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = rateLimit({ key: `signin:${ip}`, limit: 5, windowMs: 60_000 });
  if (!check.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(check.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed.", 400, {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) return jsonError("Incorrect email or password.", 401);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return jsonError("Incorrect email or password.", 401);

  await createSession(user.id);

  return jsonSuccess({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    },
  });
}