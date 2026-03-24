"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import {
  clearAdminSession,
  getAdminSession,
  subscribeToAdminSession,
} from "@/lib/admin/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/users", label: "Users" },
  { href: "/home-content", label: "Home Content" },
  { href: "/promotions", label: "Promotions" },
  { href: "/navigation", label: "Navigation" },
  { href: "/reviews", label: "Reviews" },
  { href: "/settings", label: "Settings" },
  { href: "/upload-csv", label: "Upload CSV" },
];

export default function AdminShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSession,
    () => null,
  );

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [router, session]);

  if (!session) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <span>Checking admin session…</span>
      </div>
    );
  }

  return (
    <div className="admin-frame">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>ALLREMOTES</span>
          <strong>Admin</strong>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="admin-content">
        <header className="topbar">
          <div className="topbar-title">allremotes.com.au admin</div>
          <div className="topbar-actions">
            <span className="admin-email">{session.email}</span>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                clearAdminSession();
                router.replace("/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <div className="page-shell">{children}</div>
      </div>
    </div>
  );
}
