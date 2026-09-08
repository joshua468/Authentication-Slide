import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/features/auth/schemas/validation";
import { findUserByEmail } from "@/features/auth/repositories/user";
import { createPasswordResetToken } from "@/features/auth/repositories/password-reset-token";
import { createTokenPair } from "@/lib/security/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

const RESET_TTL_MS = 15 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = rateLimit({
    key: `forgot-password:${ip}`,
    limit: 3,
    windowMs: 60_000,
  });
  if (!check.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Try again later." },
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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter a valid email address.", 400, {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const { email } = parsed.data;

  // The 60-second cooldown is keyed by email (not by a matching user row) so
  // that unknown addresses answer the exact same 429 as registered ones: the
  // response alone never reveals whether the address has an account.
  const cooldown = rateLimit({
    key: `forgot-password:cooldown:${email.toLowerCase()}`,
    limit: 1,
    windowMs: RESET_COOLDOWN_MS,
  });
  if (!cooldown.allowed) {
    return NextResponse.json(
      {
        error: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting another reset link.`,
        retryInSeconds: cooldown.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(cooldown.retryAfterSeconds) },
      },
    );
  }

  // Verify against the database before anything is created or sent. Unknown
  // emails stop here: no token row, no email, no session.
  const user = await findUserByEmail(email);
  if (!user) {
    return jsonSuccess({ message: "If that email exists, a reset link has been sent." });
  }

  const { plain, hash } = createTokenPair(32);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await createPasswordResetToken(user.id, hash, expiresAt);

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
  const resetUrl = `${baseUrl}/reset-password?token=${plain}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return jsonSuccess({ message: "If that email exists, a reset link has been sent." });
}