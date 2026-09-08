"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.status === 401) {
          if (!cancelled) router.replace("/signin");
          return;
        }
        const data = await res.json();
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) router.replace("/signin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      router.replace("/signin");
    }
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900">
      <h1 className="text-2xl font-bold">You are signed in, {user.name}.</h1>
      <Button
        variant="outline"
        size="sm"
        loading={signingOut}
        loadingLabel="Signing out..."
        onClick={handleSignOut}
        className="mt-6"
      >
        Sign out
      </Button>
    </div>
  );
}