import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | Authentication",
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}