import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function TextLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "font-semibold text-emerald-600 transition-colors duration-150 underline-offset-4 hover:text-emerald-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}