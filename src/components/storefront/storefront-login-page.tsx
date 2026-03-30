"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  authenticateAdmin,
  getAdminSession,
  subscribeToAdminSession,
} from "@/lib/admin/auth";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/admin/types";

export default function StorefrontLoginPage({
  nextPath,
}: {
  nextPath?: string;
}) {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSession,
    () => null,
  );
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const redirectPath = nextPath && nextPath.startsWith("/") ? nextPath : "/";

  useEffect(() => {
    if (session) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router, session]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextSession = authenticateAdmin(email, password);

    if (!nextSession) {
      setError("Invalid admin credentials.");
      return;
    }

    setError("");
    router.replace(redirectPath);
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <span className="eyebrow">ALLREMOTES ADMIN</span>
        <h1>Sign in to edit the storefront</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 10, lineHeight: 1.7 }}>
          Use the admin credentials to unlock the live section editor and publish
          content changes to the site APIs.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, marginTop: 28 }}>
          <label className="inline-editor-field inline-editor-field--full">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@allremotes.com"
            />
          </label>

          <label className="inline-editor-field inline-editor-field--full">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin123!"
            />
          </label>

          {error ? (
            <div className="inline-save-banner inline-save-banner--error" style={{ position: "static" }}>
              {error}
            </div>
          ) : null}

          <button type="submit" className="inline-toolbar-button inline-toolbar-button--primary">
            Sign In
          </button>
        </form>

        <p className="inline-auth-hint" style={{ marginTop: 20 }}>
          Admin login: <strong>{ADMIN_EMAIL}</strong> / <strong>{ADMIN_PASSWORD}</strong>
        </p>

        <p style={{ marginTop: 16 }}>
          <Link href="/" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Return to storefront preview
          </Link>
        </p>
      </div>
    </div>
  );
}
