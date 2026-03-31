"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminSession,
  subscribeToAdminSession,
  type AdminSession,
} from "@/lib/admin/auth";

export function useAdminSessionGuard(): AdminSession | null {
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

  return session;
}
