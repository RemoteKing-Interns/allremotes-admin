"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClassName, Notice } from "@/components/admin/ui";
import {
  authenticateAdmin,
  getAdminSession,
  subscribeToAdminSession,
} from "@/lib/admin/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/admin/types";

export default function LoginPage() {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSession,
    () => null,
  );
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const nextSession = authenticateAdmin(email, password);

    if (!nextSession) {
      setError("Invalid credentials. Please check the admin email/password.");
      setSubmitting(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            ALLREMOTES Internal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Admin Login</h1>
          <p className="text-sm text-neutral-600">
            Sign in to access the dashboard and edit live site content.
          </p>
        </div>

        {error ? <Notice tone="error">{error}</Notice> : null}

        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Email
            </span>
            <input
              className={inputClassName}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Password
            </span>
            <input
              className={inputClassName}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
            <LogIn className="h-4 w-4" />
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
