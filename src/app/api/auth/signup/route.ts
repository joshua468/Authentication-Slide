import { NextResponse } from "next/server";
import { z } from "zod";
import { signUpSchema } from "@/features/auth/schemas/validation";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { findUserByEmail, createUser } from "@/features/auth/repositories/user";
import { createOtpPair } from "@/lib/security/tokens";
import { createVerificationCode } from "@/features/auth/repositories/verification-code";
import { sendVerificationCodeEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";
import { jsonSuccess, jsonError } from "@/lib/auth/api";

const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const check = rateLimit({ key: `signup:${ip}`, limit: 5, windowMs: 60_000 });
  if (!check.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again later." },
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

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "Validation failed.",
      400,
      { fieldErrors: parsed.error.flatten().fieldErrors },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return jsonError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await createUser({ name, email, passwordHash });
    userId = user.id;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      return jsonError("An account with this email already exists.", 409);
    }
    throw error;
  }

  const { plain: code, hash: codeHash } = createOtpPair(6);
  await createVerificationCode(
    userId,
    codeHash,
    new Date(Date.now() + CODE_TTL_MS),
  );
  await sendVerificationCodeEmail(email, code);

  return jsonSuccess({ message: "Check your email for a verification code." }, 201);
}