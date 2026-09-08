import { createHash, randomBytes, randomInt } from "node:crypto";

export function generateOtp(length = 6): string {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += randomInt(0, 10).toString();
  }
  return otp;
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createOtpPair(length = 6): {
  plain: string;
  hash: string;
} {
  const plain = generateOtp(length);
  return { plain, hash: hashValue(plain) };
}

export function createTokenPair(bytes = 32): {
  plain: string;
  hash: string;
} {
  const plain = generateToken(bytes);
  return { plain, hash: hashValue(plain) };
}
