"use client";

/**
 * AdminShell is now a no-op passthrough.
 *
 * The sidebar, auth gate, and layout chrome are handled entirely by
 * src/app/(admin)/layout.tsx. This file is retained so that any
 * existing imports continue to resolve without error.
 */
export default function AdminShell({
  children,
}: Readonly<{ children: React.ReactNode; embedded?: boolean }>) {
  return <>{children}</>;
}
