"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { TextLink } from "@/components/ui/link";
import { validateOtp } from "@/features/auth/schemas/validation";
import { useCountdown } from "@/features/auth/hooks/use-countdown";

const OTP_LABEL_ID = "verification-code-label";

export function VerifyEmailForm({
  email,
  name,
  initialExpiresAt,
}: {
  email: string;
  name?: string;
  initialExpiresAt?: string | null;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const { isCooldown, label, start: startCooldown } = useCountdown(30);
  const [mounted, setMounted] = useState(false);
  const { secondsLeft: expirySeconds, start: startExpiry } = useCountdown(600);

  useEffect(() => {
    const seconds = initialExpiresAt
      ? Math.max(0, Math.ceil((new Date(initialExpiresAt).getTime() - Date.now()) / 1000))
      : 600;
    startExpiry(seconds);
    setMounted(true);
  }, [initialExpiresAt, startExpiry]);

  const expired = expirySeconds <= 0;
  const expiryMinutes = Math.floor(expirySeconds / 60);
  const expiryLabel = `${String(expiryMinutes).padStart(2, "0")}:${String(expirySeconds % 60).padStart(2, "0")}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = validateOtp(code);
    setError(nextError);
    if (nextError) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not verify the code. Try again.");
        setPending(false);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  async function handleResend() {
    startCooldown(30);
    setResendSent(true);
    setError(undefined);
    setCode("");
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.expiresAt) {
          startExpiry(
            Math.max(
              0,
              Math.ceil(
                (new Date(data.expiresAt).getTime() - Date.now()) / 1000
              )
            )
          );
        }
      }
    } catch {
      setResendSent(false);
      setError("Could not resend the code. Try again.");
    }
  }

  return (
    <AuthCard
      title="Verify identity"
      subtitle={
        email ? (
          <>
            We sent a 6-digit verification security code to{" "}
            <span className="font-semibold text-slate-900">{email}</span>.
          </>
        ) : (
          "Enter the 6-digit security code sent to your registered email."
        )
      }
      footer={
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <span>Already confirmed?</span>
          <TextLink href="/signin">Sign in</TextLink>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <p id={OTP_LABEL_ID} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              6-Digit Security Code
            </p>
            {!mounted ? (
              <span className="text-xs text-slate-400">&nbsp;</span>
            ) : expired ? (
              <span className="text-xs font-semibold text-rose-600">Code expired</span>
            ) : (
              <span
                className={
                  expirySeconds <= 60
                    ? "text-xs font-medium text-amber-600"
                    : "text-xs text-slate-400"
                }
              >
                Expires in {expiryLabel}
              </span>
            )}
          </div>

          <OtpInput
            value={code}
            onChange={(value) => {
              setCode(value);
              if (error) setError(undefined);
            }}
            invalid={Boolean(error)}
            disabled={pending}
            labelId={OTP_LABEL_ID}
          />

          {error ? (
            <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-rose-500">
                <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span>{error}</span>
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={pending}
          loadingLabel="Verifying code..."
          disabled={expired}
        >
          Verify & Continue
        </Button>

        <div className="flex flex-col items-center gap-2 pt-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-600">
            <span>Didn't receive the email?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isCooldown || pending}
              className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline disabled:pointer-events-none disabled:text-slate-400"
            >
              {isCooldown ? `Resend code (${label})` : "Resend code"}
            </button>
          </div>

          {resendSent ? (
            <p className="text-xs font-medium text-emerald-600 animate-fade-in">
              ✓ A fresh verification code has been dispatched.
            </p>
          ) : null}
        </div>
      </form>
    </AuthCard>
  );
}