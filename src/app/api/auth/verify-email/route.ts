import { NextResponse } from "next/server";
import { otpSchema } from "@/features/auth/schemas/validation";
import { emailSchema } from "@/features/auth/schemas/validation";
import { findUserByEmail } from "@/features/auth/repositories/user";
import { markEmailVerified } from "@/features/auth/repositories/user";
import {
  findLatestVerificationCode,
  markVerificationCodeUsed,
} from "@/features/auth/repositories/verification-code";
import { hashValue } from "@/lib/security/tokens";
import { createSession } from "@/features/auth/services/session";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const emailResult = emailSchema.safeParse(body !== null && typeof body === "object" ? (body as { email?: unknown }).email : undefined);
  const codeResult = otpSchema.safeParse(body !== null && typeof body === "object" ? (body as { code?: unknown }).code : undefined);

  if (!emailResult.success) {
    return jsonError("Enter a valid email address.", 400, {
      fieldErrors: { email: emailResult.error.issues[0].message },
    });
  }
  if (!codeResult.success) {
    return jsonError("The code must be exactly 6 digits.", 400, {
      fieldErrors: { code: codeResult.error.issues[0].message },
    });
  }

  const user = await findUserByEmail(emailResult.data);
  if (!user) return jsonError("No account found for this email.", 404);

  const latest = await findLatestVerificationCode(user.id);
  if (!latest) return jsonError("No verification code found. Request a new one.", 404);
  if (latest.usedAt) return jsonError("This code has already been used.", 410);
  if (latest.expiresAt.getTime() < Date.now()) {
    return jsonError("This code has expired. Request a new one.", 410);
  }

  const hash = hashValue(codeResult.data);
  if (hash !== latest.codeHash) {
    return jsonError("Incorrect code.", 400);
  }

  await markVerificationCodeUsed(latest.id);
  if (!user.isEmailVerified) {
    await markEmailVerified(user.id);
  }

  await createSession(user.id);

  return jsonSuccess({ user: { id: user.id, name: user.name, email: user.email } });
}