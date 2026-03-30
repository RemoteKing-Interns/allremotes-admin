"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Trash2 } from "lucide-react";
import { Card, Notice, PageHeader, PageTransition } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { clearAdminSession } from "@/lib/admin/auth";

export default function ClearCachePage() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [clearedCount, setClearedCount] = useState<number | null>(null);

  function clearAllRemotesStorage() {
    if (typeof window === "undefined") {
      return;
    }

    setClearing(true);

    const keys: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith("allremotes")) {
        keys.push(key);
      }
    }

    clearAdminSession();

    for (const key of keys) {
      window.localStorage.removeItem(key);
    }

    setClearedCount(keys.length);

    window.setTimeout(() => {
      router.replace("/login");
    }, 900);
  }

  return (
    <PageTransition>
      <PageHeader
        title="Clear Cache"
        description="Remove local browser state for this admin install and reload into a clean session."
        actions={
          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={clearAllRemotesStorage}
            disabled={clearing}
          >
            <Trash2 className="h-4 w-4" />
            {clearing ? "Clearing…" : "Clear Local Cache"}
          </Button>
        }
      />

      {clearedCount !== null ? (
        <Notice tone="success">
          Cleared {clearedCount} local storage item{clearedCount === 1 ? "" : "s"}. Redirecting to
          the admin login page.
        </Notice>
      ) : null}

      <Card title="What This Clears" description="Use this when local draft state or session data is out of sync.">
        <div className="grid gap-3 text-sm text-neutral-700">
          <p>Admin session tokens stored in the browser.</p>
          <p>Saved local user overrides and previous admin navigation state.</p>
          <p>Legacy `allremotes_*` cache keys from the reference project.</p>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This only clears browser storage for this device. It does not delete live data from the API.
        </div>

        <div className="mt-5">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.refresh()}
            disabled={clearing}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </Card>
    </PageTransition>
  );
}
