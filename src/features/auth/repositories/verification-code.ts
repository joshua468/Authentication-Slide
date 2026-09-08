import { prisma } from "@/lib/db";

export async function createVerificationCode(
  userId: string,
  codeHash: string,
  expiresAt: Date,
) {
  return prisma.verificationCode.create({
    data: { userId, codeHash, expiresAt },
  });
}

export async function findLatestVerificationCode(userId: string) {
  return prisma.verificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markVerificationCodeUsed(id: string) {
  return prisma.verificationCode.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}