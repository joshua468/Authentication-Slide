"use client";

import { useState, type FormEvent } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { Button } from "@/components/ui/button";
import { Field, IconMail } from "@/components/ui/field";
import { TextLink } from "@/components/ui/link";
import {
  validateForgotPassword,
  type FieldErrors,
} from "@/features/auth/schemas/validation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForgotPassword(email);
    setErrors(nextErrors);
    if (nextErrors.email) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors({ email: data?.error ?? "Something went wrong. Try again." });
        setPending(false);
        return;
      }
      setSubmitted(true);
      setPending(false);
    } catch {
      setErrors({ email: "Something went wrong. Try again." });
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="We've sent password reset instructions to your email."
        footer={
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span>Remembered your credentials?</span>
            <TextLink href="/signin">Back to sign in</TextLink>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-600 ring-8 ring-emerald-50/80">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 w-full text-left">
            <p className="text-xs text-slate-500">Target Email:</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{email}</p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Click the security link in the email to choose a new password. The link will remain active for 60 minutes.
          </p>

          <Button
            fullWidth
            variant="outline"
            size="lg"
            onClick={() => setSubmitted(false)}
          >
            Re-enter email address
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter your verified email address to receive a secure recovery link."
      footer={
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <span>Remember your password?</span>
          <TextLink href="/signin">Back to sign in</TextLink>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="elena@company.com"
          leadingIcon={<IconMail />}
          value={email}
          error={errors.email}
          disabled={pending}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={pending}
          loadingLabel="Sending link..."
          className="mt-2"
        >
          Send reset instructions
        </Button>
      </form>
    </AuthCard>
  );
}