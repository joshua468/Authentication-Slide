import { NextResponse } from "next/server";
import { emailSchema } from "@/features/auth/schemas/validation";
import { findUserByEmail } from "@/features/auth/repositories/user";
import {
  findLatestVerificationCode,
  createVerificationCode,
} from "@/features/auth/repositories/verification-code";
import { createOtpPair } from "@/lib/security/tokens";
import { sendVerificationCodeEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = rateLimit({
    key: `resend-code:${ip}`,
    limit: 3,
    windowMs: 60_000,
  });
  if (!check.allowed) {
    return NextResponse.json(
      { error: "Too many resend attempts. Try again later." },
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

  const emailResult = emailSchema.safeParse(
    body !== null && typeof body === "object" ? (body as { email?: unknown }).email : undefined,
  );
  if (!emailResult.success) {
    return jsonError("Enter a valid email address.", 400, {
      fieldErrors: { email: emailResult.error.issues[0].message },
    });
  }

  const user = await findUserByEmail(emailResult.data);
  if (!user) {
    // Do not reveal whether the email exists.
    return jsonSuccess({ message: "If that email exists, a code has been sent." });
  }

  const latest = await findLatestVerificationCode(user.id);
  if (latest && !latest.usedAt) {
    const elapsed = Date.now() - latest.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return jsonError(
        `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)} seconds before resending.`,
        429,
        { retryInSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) },
      );
    }
  }

  const newCode = createOtpPair(6);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await createVerificationCode(user.id, newCode.hash, expiresAt);
  await sendVerificationCodeEmail(user.email, newCode.plain);

  return jsonSuccess({
    message: "A new verification code has been sent.",
    expiresAt: expiresAt.toISOString(),
  });
}