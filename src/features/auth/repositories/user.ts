import { prisma } from "@/lib/db";

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    },
  });
}

export async function markEmailVerified(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
  });
}

export async function setUserPasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}