"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2, UserPlus } from "lucide-react";
import {
  Card,
  ConfirmDialog,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  PageTransition,
  inputClassName,
  selectClassName,
  statusBadgeClass,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { createUser, getUsers } from "@/lib/admin/api";
import { formatDate } from "@/lib/admin/utils";
import { ADMIN_EMAIL, type AdminUser } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

interface LocalUserState {
  createdUsers: AdminUser[];
  deletedEmails: string[];
  statusByEmail: Record<string, AdminUser["status"]>;
}

const STORAGE_KEY = "allremotes-admin-user-overrides";

interface UserDraft {
  name: string;
  email: string;
  password: string;
  role: "admin" | "customer";
}

const EMPTY_DRAFT: UserDraft = {
  name: "",
  email: "",
  password: "",
  role: "customer",
};

export default function UsersPage() {
  const [apiUsers, setApiUsers] = useState<AdminUser[]>([]);
  const [localState, setLocalState] = useState<LocalUserState>({
    createdUsers: [],
    deletedEmails: [],
    statusByEmail: {},
  });
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingDeleteEmail, setPendingDeleteEmail] = useState<string | null>(null);

  useEffect(() => {
    setLocalState(readLocalState());
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextUsers = await getUsers();
        if (!active) {
          return;
        }

        setApiUsers(nextUsers);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not load users.",
        });
      } finally {
        if (!active) {
          return;
        }

        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const users = useMemo(
    () => mergeUsers(apiUsers, localState),
    [apiUsers, localState],
  );

  const pendingDeleteUser = useMemo(
    () => users.find((user) => normalizeEmail(user.email) === normalizeEmail(pendingDeleteEmail ?? "")) ?? null,
    [pendingDeleteEmail, users],
  );

  async function onCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!draft.name.trim() || !draft.email.trim() || !draft.password.trim()) {
      setNotice({
        tone: "error",
        text: "Name, email, and password are required.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const createdUser = await createUser({
        name: draft.name.trim(),
        email: draft.email.trim(),
        password: draft.password,
        role: draft.role,
      });

      setApiUsers((current) => upsertUser(current, createdUser));
      updateLocalState((current) => ({
        ...current,
        createdUsers: upsertUser(current.createdUsers, createdUser),
      }));
      setDraft(EMPTY_DRAFT);
      setNotice({
        tone: "success",
        text: "User created successfully.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not create user.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function onToggleStatus(user: AdminUser) {
    if (isProtectedUser(user)) {
      return;
    }

    const nextStatus = user.status === "active" ? "inactive" : "active";
    updateLocalState((current) => ({
      ...current,
      statusByEmail: {
        ...current.statusByEmail,
        [normalizeEmail(user.email)]: nextStatus,
      },
    }));
    setNotice({
      tone: "info",
      text: `User ${user.email} marked as ${nextStatus}.`,
    });
  }

  function requestDeleteUser(user: AdminUser) {
    if (isProtectedUser(user)) {
      return;
    }

    setPendingDeleteEmail(user.email);
  }

  function confirmDeleteUser() {
    if (!pendingDeleteEmail) {
      return;
    }

    updateLocalState((current) => ({
      ...current,
      deletedEmails: Array.from(
        new Set([...current.deletedEmails, normalizeEmail(pendingDeleteEmail)]),
      ),
      createdUsers: current.createdUsers.filter(
        (entry) => normalizeEmail(entry.email) !== normalizeEmail(pendingDeleteEmail),
      ),
    }));

    setNotice({
      tone: "info",
      text: `User ${pendingDeleteEmail} removed from this admin session.`,
    });
    setPendingDeleteEmail(null);
  }

  function updateLocalState(updater: (current: LocalUserState) => LocalUserState) {
    setLocalState((current) => {
      const next = updater(current);
      persistLocalState(next);
      return next;
    });
  }

  if (loading) {
    return <LoadingState label="Loading users…" />;
  }

  return (
    <PageTransition>
      <PageHeader
        title="Users"
        description="Create users via the live API and manage local enable/disable or delete overrides."
        actions={
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Add User" description="Create a new admin or customer account.">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreateUser}>
            <Field label="Name">
              <input
                className={inputClassName}
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClassName}
                type="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, email: event.target.value }))
                }
              />
            </Field>
            <Field label="Password">
              <input
                className={inputClassName}
                type="password"
                value={draft.password}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, password: event.target.value }))
                }
              />
            </Field>
            <Field label="Role">
              <select
                className={selectClassName}
                value={draft.role}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    role: event.target.value === "admin" ? "admin" : "customer",
                  }))
                }
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
              >
                <UserPlus className="h-4 w-4" />
                {submitting ? "Creating…" : "Create User"}
              </Button>
            </div>
          </form>
        </Card>

        <Card
          title="User Table"
          description="The built-in admin account cannot be disabled or deleted."
        >
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {users.map((user) => (
                  <tr key={user.email}>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">{user.name || "Unnamed user"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          user.role === "admin"
                            ? "inline-flex rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800"
                            : "inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                        }
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadgeClass(user.status === "active" ? "success" : "danger")}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{user.joined || formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      {isProtectedUser(user) ? (
                        <span className={statusBadgeClass("muted")}>Protected</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => onToggleStatus(user)}
                          >
                            {user.status === "active" ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="md"
                            onClick={() => requestDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteUser)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteEmail(null);
          }
        }}
        title="Delete user"
        description={
          pendingDeleteUser
            ? `Delete ${pendingDeleteUser.email} from this admin list?`
            : "Delete this user from this admin list?"
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDeleteUser}
      />
    </PageTransition>
  );
}

function readLocalState(): LocalUserState {
  if (typeof window === "undefined") {
    return {
      createdUsers: [],
      deletedEmails: [],
      statusByEmail: {},
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        createdUsers: [],
        deletedEmails: [],
        statusByEmail: {},
      };
    }

    const parsed = JSON.parse(raw) as Partial<LocalUserState>;
    return {
      createdUsers: Array.isArray(parsed.createdUsers) ? parsed.createdUsers : [],
      deletedEmails: Array.isArray(parsed.deletedEmails) ? parsed.deletedEmails : [],
      statusByEmail:
        parsed.statusByEmail && typeof parsed.statusByEmail === "object"
          ? parsed.statusByEmail
          : {},
    };
  } catch {
    return {
      createdUsers: [],
      deletedEmails: [],
      statusByEmail: {},
    };
  }
}

function persistLocalState(state: LocalUserState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeUsers(apiUsers: AdminUser[], localState: LocalUserState) {
  const deleted = new Set(localState.deletedEmails.map(normalizeEmail));
  const protectedUser: AdminUser = {
    id: "builtin-admin",
    name: "Admin",
    email: ADMIN_EMAIL,
    role: "admin",
    status: "active",
    joined: "Built-in",
  };

  const merged = new Map<string, AdminUser>();
  merged.set(normalizeEmail(protectedUser.email), protectedUser);

  for (const user of apiUsers) {
    const key = normalizeEmail(user.email);
    if (deleted.has(key) || key === normalizeEmail(ADMIN_EMAIL)) {
      continue;
    }

    merged.set(key, applyUserOverrides(user, localState.statusByEmail));
  }

  for (const user of localState.createdUsers) {
    const key = normalizeEmail(user.email);
    if (deleted.has(key) || key === normalizeEmail(ADMIN_EMAIL)) {
      continue;
    }

    const current = merged.get(key);
    merged.set(
      key,
      applyUserOverrides(
        {
          ...current,
          ...user,
        },
        localState.statusByEmail,
      ),
    );
  }

  return Array.from(merged.values());
}

function applyUserOverrides(
  user: AdminUser,
  statusByEmail: Record<string, AdminUser["status"]>,
) {
  if (normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL)) {
    return {
      ...user,
      status: "active" as const,
      role: "admin" as const,
      joined: "Built-in",
    };
  }

  return {
    ...user,
    status: statusByEmail[normalizeEmail(user.email)] ?? user.status,
    joined: user.joined ?? (user.createdAt ? user.createdAt.slice(0, 10) : undefined),
  };
}

function upsertUser(users: AdminUser[], nextUser: AdminUser) {
  const email = normalizeEmail(nextUser.email);
  const withoutCurrent = users.filter(
    (user) => normalizeEmail(user.email) !== email,
  );
  return [nextUser, ...withoutCurrent];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isProtectedUser(user: AdminUser) {
  return normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL);
}
