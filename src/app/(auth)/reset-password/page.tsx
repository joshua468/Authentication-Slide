import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { TextLink } from "@/components/ui/link";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        subtitle="This password reset link is invalid or has already been used."
        footer={<TextLink href="/forgot-password">Request a new link</TextLink>}
      >
        <div className="flex justify-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-error-container text-on-error-container">
            <svg
              aria-hidden
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </span>
        </div>
      </AuthCard>
    );
  }

  return <ResetPasswordForm token={token} />;
}