"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { Button } from "@/components/ui/button";
import { Field, PasswordField, IconMail } from "@/components/ui/field";
import { TextLink } from "@/components/ui/link";
import {
  validateSignIn,
  type FieldErrors,
} from "@/features/auth/schemas/validation";

export function SignInForm() {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSignIn(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors({ form: data?.error ?? "Incorrect email or password." });
        setPending(false);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setErrors({ form: "Something went wrong. Try again." });
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to explore bikes, manage orders, and keep riding."
      footer={
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <span>Don't have an account?</span>
          <TextLink href="/signup">Create account</TextLink>
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
          value={values.email}
          error={errors.email}
          disabled={pending}
          onChange={(event) =>
            setValues((value) => ({ ...value, email: event.target.value }))
          }
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={values.password}
          error={errors.password}
          disabled={pending}
          onChange={(event) =>
            setValues((value) => ({ ...value, password: event.target.value }))
          }
        />

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600 hover:text-slate-900">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span>Remember for 30 days</span>
          </label>

          <TextLink href="/forgot-password" className="text-xs font-semibold">
            Forgot password?
          </TextLink>
        </div>

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
          loadingLabel="Authenticating..."
          className="mt-2"
        >
          Sign in to account
        </Button>
      </form>
    </AuthCard>
  );
}