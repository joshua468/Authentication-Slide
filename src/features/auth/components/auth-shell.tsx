import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full flex-col bg-slate-50 px-4 py-10 text-slate-900">
      <div className="m-auto flex w-full max-w-[440px] flex-col justify-center">
        {children}
      </div>
    </main>
  );
}
