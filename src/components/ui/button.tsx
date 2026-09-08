import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "social";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow-glow focus-visible:ring-emerald-500 border border-emerald-500/20",
  secondary:
    "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-sm focus-visible:ring-slate-900 border border-slate-800",
  outline:
    "border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 active:bg-slate-100 focus-visible:ring-emerald-500 bg-white",
  ghost:
    "text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 focus-visible:ring-emerald-500",
  social:
    "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 shadow-subtle focus-visible:ring-emerald-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm font-medium",
  md: "h-11 gap-2.5 rounded-xl px-4 text-sm font-semibold",
  lg: "h-12 gap-2.5 rounded-xl px-6 text-base font-semibold",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  fullWidth,
  leftIcon,
  rightIcon,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex select-none items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg
            aria-hidden
            className="h-4 w-4 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"
            />
          </svg>
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}