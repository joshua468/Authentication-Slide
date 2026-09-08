"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  id?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
}

export function Field({
  label,
  id,
  hint,
  error,
  leadingIcon,
  trailing,
  className,
  disabled,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? `field-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
        </label>
      </div>

      <div className="relative group">
        {leadingIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
            {leadingIcon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-xl border bg-white text-sm text-slate-900 transition-all duration-150 outline-none placeholder:text-slate-400 focus:bg-white",
            leadingIcon ? "pl-10" : "pl-3.5",
            trailing ? "pr-11" : "pr-3.5",
            error
              ? "border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : "border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 shadow-subtle",
            disabled && "cursor-not-allowed bg-slate-50 text-slate-400 opacity-70",
            className
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-fade-in"
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-rose-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface PasswordFieldProps extends Omit<FieldProps, "type" | "trailing"> {
  autoComplete?: string;
}

export function PasswordField({
  autoComplete = "current-password",
  leadingIcon = <IconLock />,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      {...props}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      leadingIcon={leadingIcon}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      }
    />
  );
}

export function IconMail() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function IconUser() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconLock() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg
      aria-hidden
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.42 10.42 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.42 10.42 0 0 1-19.88 0Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      aria-hidden
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m2 2 20 20" />
    </svg>
  );
}