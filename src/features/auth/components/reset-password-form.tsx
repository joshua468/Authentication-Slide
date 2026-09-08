"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/field";
import { PasswordStrength } from "@/components/ui/password-strength";
import {
  validateResetPassword,
  type FieldErrors,
} from "@/features/auth/schemas/validation";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateResetPassword(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...values }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors({ form: data?.error ?? "Something went wrong. Try again." });
        setPending(false);
        return;
      }
      setDone(true);
      setPending(false);
    } catch {
      setErrors({ form: "Something went wrong. Try again." });
      setPending(false);
    }
  }

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        subtitle="Your new credentials have been securely stored in AuraShield."
      >
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-600 ring-8 ring-emerald-50/80">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            All active legacy sessions have been invalidated for security. You can now authenticate with your new password.
          </p>

          <Button
            fullWidth
            size="lg"
            className="mt-2"
            onClick={() => router.replace("/signin")}
          >
            Sign in with new password
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create new password"
      subtitle="Ensure your new password meets your enterprise security standards."
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Recovery Token Verified
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={values.password}
            error={errors.password}
            disabled={pending}
            onChange={(event) =>
              setValues((value) => ({ ...value, password: event.target.value }))
            }
          />
          <PasswordStrength password={values.password} />
        </div>

        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          disabled={pending}
          onChange={(event) =>
            setValues((value) => ({
              ...value,
              confirmPassword: event.target.value,
            }))
          }
        />

        {errors.form ? (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-fade-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-rose-500">
              <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <span>{errors.form}</span>
          </p>
        ) : null}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={pending}
          loadingLabel="Updating password..."
          className="mt-2"
        >
          Update password & secure account
        </Button>
      </form>
    </AuthCard>
  );
}