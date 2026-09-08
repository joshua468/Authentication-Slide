"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { Button } from "@/components/ui/button";
import { Field, PasswordField, IconMail, IconUser } from "@/components/ui/field";
import { TextLink } from "@/components/ui/link";
import { PasswordStrength } from "@/components/ui/password-strength";
import {
  validateSignUp,
  type FieldErrors,
} from "@/features/auth/schemas/validation";

export function SignUpForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSignUp(values);

    if (!acceptTerms) {
      nextErrors.confirmPassword =
        nextErrors.confirmPassword || "You must accept the security terms.";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors({ form: data?.error ?? "Something went wrong. Try again." });
        setPending(false);
        return;
      }
      const query = new URLSearchParams({
        email: values.email,
        name: values.name.trim(),
      });
      router.push(`/verify-email?${query.toString()}`);
    } catch {
      setErrors({ form: "Something went wrong. Try again." });
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Join us to discover bikes, gear, and everything for your ride."
      footer={
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <span>Already have an account?</span>
          <TextLink href="/signin">Sign in</TextLink>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Elena Rostova"
          leadingIcon={<IconUser />}
          value={values.name}
          error={errors.name}
          disabled={pending}
          onChange={(event) =>
            setValues((value) => ({ ...value, name: event.target.value }))
          }
        />

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

        <div>
          <PasswordField
            label="Password"
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
          label="Confirm password"
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

        {/* Terms agreement */}
        <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none text-xs text-slate-600 leading-normal">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
          />
          <span>
            I agree to the{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-semibold text-emerald-600 hover:underline"
            >
              Enterprise Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-semibold text-emerald-600 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>

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
          loadingLabel="Creating account..."
          className="mt-2"
        >
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}