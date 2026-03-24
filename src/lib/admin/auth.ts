import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/admin/types";

export interface AdminSession {
  email: string;
  name: string;
  role: "admin";
}

const STORAGE_KEY = "allremotes-admin-session";
let cachedRawSession: string | null | undefined;
let cachedSession: AdminSession | null = null;
const sessionListeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function parseAdminSession(raw: string | null) {
  try {
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AdminSession>;

    if (parsed.email && parsed.role === "admin") {
      return {
        email: parsed.email,
        name: parsed.name || "Admin",
        role: "admin" as const,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function getAdminSession() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === cachedRawSession) {
    return cachedSession;
  }

  cachedRawSession = raw;
  cachedSession = parseAdminSession(raw);
  return cachedSession;
}

export function subscribeToAdminSession(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  sessionListeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emitSessionChange() {
  for (const listener of sessionListeners) {
    listener();
  }
}

export function saveAdminSession(session: AdminSession) {
  if (!canUseStorage()) {
    return;
  }

  const raw = JSON.stringify(session);
  cachedRawSession = raw;
  cachedSession = session;
  window.localStorage.setItem(STORAGE_KEY, raw);
  emitSessionChange();
}

export function clearAdminSession() {
  if (!canUseStorage()) {
    return;
  }

  cachedRawSession = null;
  cachedSession = null;
  window.localStorage.removeItem(STORAGE_KEY);
  emitSessionChange();
}

export function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const session = {
      email: ADMIN_EMAIL,
      name: "Admin",
      role: "admin" as const,
    };

    saveAdminSession(session);
    return session;
  }

  return null;
}
