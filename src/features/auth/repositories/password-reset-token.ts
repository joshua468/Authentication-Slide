import { prisma } from "@/lib/db";

export async function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  return prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function findResetTokenByHash(tokenHash: string) {
  return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
}

export async function findLatestResetToken(userId: string) {
  return prisma.passwordResetToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export async function expireResetTokensForUser(userId: string) {
  return prisma.passwordResetToken.updateMany({
    where: { userId },
    data: { usedAt: new Date() },
  });
}