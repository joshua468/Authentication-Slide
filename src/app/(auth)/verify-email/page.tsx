import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { findUserByEmail } from "@/features/auth/repositories/user";
import { findLatestVerificationCode } from "@/features/auth/repositories/verification-code";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; name?: string }>;
}) {
  const { email = "", name } = await searchParams;

  let expiresAt: string | null = null;
  if (email) {
    const user = await findUserByEmail(email);
    if (user) {
      const latest = await findLatestVerificationCode(user.id);
      if (latest && !latest.usedAt) {
        expiresAt = latest.expiresAt.toISOString();
      }
    }
  }

  return (
    <VerifyEmailForm
      email={email}
      name={name}
      initialExpiresAt={expiresAt}
    />
  );
}