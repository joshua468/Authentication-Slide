import bcrypt from "bcryptjs";

export const PASSWORD_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(PASSWORD_COST);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
