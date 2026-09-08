import type { ReactNode } from "react";
import { AuthBrand } from "./auth-brand";

export interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, footer, badge, children }: AuthCardProps) {
  return (
    <div className="w-full">
      {/* Mobile-only brand badge */}
      <div className="mb-6 flex justify-center lg:hidden">
        <AuthBrand />
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-card border border-slate-200/80 transition-all duration-200">
        {/* Top ambient green accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        <div className="text-left">
          {badge && <div className="mb-3">{badge}</div>}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mt-6">{children}</div>

        {footer && (
          <>
            <div className="mt-6 border-t border-slate-200/80" />
            <div className="mt-5 flex flex-col items-center justify-center gap-1 text-center text-sm text-slate-600">
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}