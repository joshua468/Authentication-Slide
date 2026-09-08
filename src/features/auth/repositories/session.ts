import { prisma } from "@/lib/db";

export async function createSessionRecord(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  return prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function findSessionByTokenHash(
  tokenHash: string,
  now: Date = new Date(),
) {
  return prisma.session.findFirst({
    where: { tokenHash, expiresAt: { gt: now } },
    include: { user: true },
  });
}

export async function destroySessionByTokenHash(tokenHash: string) {
  return prisma.session.deleteMany({ where: { tokenHash } });
}

export async function destroyAllSessionsForUser(userId: string) {
  return prisma.session.deleteMany({ where: { userId } });
}