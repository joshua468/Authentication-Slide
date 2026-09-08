"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  labelId?: string;
}

export function OtpInput({
  value,
  onChange,
  invalid,
  disabled,
  labelId,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function setCharacter(index: number, character: string) {
    const next = value.split("");
    next[index] = character;
    const combined = next.join("").slice(0, OTP_LENGTH);
    onChange(combined);
    if (character && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleChange(index: number, character: string) {
    const digit = character.replace(/\D/g, "").slice(-1);
    if (digit) setCharacter(index, digit);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = value.split("");
      if (next[index]) {
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        next[index - 1] = "";
        onChange(next.join(""));
        inputs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!digits) return;
    event.preventDefault();
    onChange(digits);
    const focusTarget = Math.min(digits.length, OTP_LENGTH - 1);
    inputs.current[focusTarget]?.focus();
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn("flex justify-between gap-2 sm:gap-2.5", disabled && "opacity-60")}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        const char = value[index] ?? "";
        const isFilled = Boolean(char);

        return (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            value={char}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            aria-invalid={invalid || undefined}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            autoFocus={index === 0}
            maxLength={1}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              "h-13 sm:h-14 w-full rounded-xl border text-center text-xl font-bold font-mono tracking-widest outline-none transition-all duration-150 shadow-subtle",
              invalid
                ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10"
                : isFilled
                ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-extrabold focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
            )}
          />
        );
      })}
    </div>
  );
}