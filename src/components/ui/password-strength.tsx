"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
  className?: string;
}

export function PasswordStrength({
  password = "",
  className,
}: PasswordStrengthProps) {
  const criteria = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const score = [hasMinLength, hasUppercase, hasNumber, hasSymbol].filter(
      Boolean
    ).length;

    let label = "Weak";
    let colorClass = "bg-rose-500";
    let textClass = "text-rose-600";

    if (score === 0) {
      label = "Enter password";
      colorClass = "bg-slate-200";
      textClass = "text-slate-400";
    } else if (score === 1) {
      label = "Weak";
      colorClass = "bg-rose-500";
      textClass = "text-rose-600";
    } else if (score === 2) {
      label = "Fair";
      colorClass = "bg-amber-500";
      textClass = "text-amber-600";
    } else if (score === 3) {
      label = "Good";
      colorClass = "bg-emerald-500";
      textClass = "text-emerald-600";
    } else if (score === 4) {
      label = "Strong";
      colorClass = "bg-emerald-600";
      textClass = "text-emerald-700";
    }

    return {
      score,
      label,
      colorClass,
      textClass,
      hasMinLength,
      hasUppercase,
      hasNumber,
      hasSymbol,
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2.5 pt-1 text-left animate-fade-in", className)}>
      {/* Strength Segments Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">Security strength:</span>
          <span className={cn("font-semibold uppercase tracking-wider", criteria.textClass)}>
            {criteria.label}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "rounded-full transition-all duration-300",
                criteria.score >= step ? criteria.colorClass : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria Badges */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <CheckItem valid={criteria.hasMinLength} label="8+ characters" />
        <CheckItem valid={criteria.hasUppercase} label="Uppercase letter" />
        <CheckItem valid={criteria.hasNumber} label="Number (0-9)" />
        <CheckItem valid={criteria.hasSymbol} label="Special character" />
      </div>
    </div>
  );
}

function CheckItem({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 transition-colors duration-200",
        valid ? "text-emerald-700 font-medium" : "text-slate-400"
      )}
    >
      <svg
        aria-hidden
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={valid ? "3" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "shrink-0 transition-transform duration-200",
          valid ? "scale-110 text-emerald-600" : "text-slate-300"
        )}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
