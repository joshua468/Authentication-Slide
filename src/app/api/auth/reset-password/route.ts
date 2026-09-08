import { z } from "zod";
import { resetPasswordSchema } from "@/features/auth/schemas/validation";
import {
  findResetTokenByHash,
  markResetTokenUsed,
} from "@/features/auth/repositories/password-reset-token";
import { setUserPasswordHash } from "@/features/auth/repositories/user";
import { hashPassword } from "@/lib/auth/password";
import { hashValue } from "@/lib/security/tokens";
import { destroyAllSessionsForUser } from "@/features/auth/repositories/session";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

const tokenSchema = z.string().min(1, "Missing reset token.");

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const obj = body as { token?: unknown; password?: unknown; confirmPassword?: unknown };

  const tokenResult = tokenSchema.safeParse(obj.token);
  if (!tokenResult.success) {
    return jsonError("Missing reset token.", 400);
  }

  const passwordResult = resetPasswordSchema.safeParse({
    password: obj.password,
    confirmPassword: obj.confirmPassword,
  });
  if (!passwordResult.success) {
    return jsonError("Validation failed.", 400, {
      fieldErrors: passwordResult.error.flatten().fieldErrors,
    });
  }

  const tokenHash = hashValue(tokenResult.data);
  const resetToken = await findResetTokenByHash(tokenHash);
  if (!resetToken) {
    return jsonError("This reset link is invalid.", 400);
  }
  if (resetToken.usedAt) {
    return jsonError("This reset link has already been used.", 410);
  }
  if (resetToken.expiresAt.getTime() < Date.now()) {
    return jsonError("This reset link has expired.", 410);
  }

  const passwordHash = await hashPassword(passwordResult.data.password);
  await setUserPasswordHash(resetToken.userId, passwordHash);
  await markResetTokenUsed(resetToken.id);
  await destroyAllSessionsForUser(resetToken.userId);

  return jsonSuccess({ message: "Password reset successfully." });
}