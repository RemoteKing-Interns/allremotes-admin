"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, LoadingState, Notice, PageHeader } from "@/components/admin/ui";
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

  function onDeleteUser(user: AdminUser) {
    if (isProtectedUser(user)) {
      return;
    }

    if (!window.confirm(`Delete ${user.email} from the admin list?`)) {
      return;
    }

    updateLocalState((current) => ({
      ...current,
      deletedEmails: Array.from(
        new Set([...current.deletedEmails, normalizeEmail(user.email)]),
      ),
      createdUsers: current.createdUsers.filter(
        (entry) => normalizeEmail(entry.email) !== normalizeEmail(user.email),
      ),
    }));

    setNotice({
      tone: "info",
      text: `User ${user.email} removed from this admin session.`,
    });
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
    <div className="stack">
      <PageHeader
        title="Users"
        description="Create users via the live API and manage local enable/disable or delete overrides."
        actions={
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Refresh
          </button>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="section-grid">
        <Card title="Add User" description="Create a new admin or customer account.">
          <form className="form-grid" onSubmit={onCreateUser}>
            <label className="field">
              <span>Name</span>
              <input
                className="input"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                className="input"
                type="password"
                value={draft.password}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select
                className="input"
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
            </label>
            <div className="inline-actions">
              <button
                type="submit"
                className="button button--primary"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create User"}
              </button>
            </div>
          </form>
        </Card>

        <Card
          title="User Table"
          description="The built-in admin account cannot be disabled or deleted."
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email}>
                    <td>{user.name || "Unnamed user"}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span
                        className={
                          user.status === "active"
                            ? "status-pill status-pill--success"
                            : "status-pill status-pill--danger"
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{user.joined || formatDate(user.createdAt)}</td>
                    <td>
                      {isProtectedUser(user) ? (
                        <span className="status-pill status-pill--muted">Protected</span>
                      ) : (
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button button--ghost"
                            onClick={() => onToggleStatus(user)}
                          >
                            {user.status === "active" ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            className="button button--danger"
                            onClick={() => onDeleteUser(user)}
                          >
                            Delete
                          </button>
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
    </div>
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
