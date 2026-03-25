"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import {
  Card,
  ConfirmDialog,
  Field,
  LoadingState,
  Notice,
  PageHeader,
  PageTransition,
  Toggle,
  inputClassName,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getApiBaseLabel, getSettings, resetAdminData, saveSettings } from "@/lib/admin/api";
import type { SiteSettings } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [notice, setNotice] = useState<FlashState>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextSettings = await getSettings();
        if (!active) {
          return;
        }

        setSettings(nextSettings);
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice({
          tone: "error",
          text:
            error instanceof Error ? error.message : "Could not load settings.",
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

  async function onSave() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      await saveSettings(settings);
      setNotice({
        tone: "success",
        text: "Settings saved successfully.",
      });
      window.setTimeout(() => {
        const iframe = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
        if (iframe) iframe.src = iframe.src;
      }, 1500);
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not save settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onReset() {
    setResetting(true);
    setNotice(null);

    try {
      await resetAdminData();
      setNotice({
        tone: "success",
        text: "Test data reset successfully.",
      });
      setReloadKey((value) => value + 1);
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not reset test data.",
      });
    } finally {
      setResetting(false);
      setShowResetDialog(false);
    }
  }

  if (loading || !settings) {
    return <LoadingState label="Loading settings…" />;
  }

  return (
    <PageTransition>
      <PageHeader
        title="Settings"
        description="General store configuration, feature toggles, runtime information, and test reset."
        actions={
          <>
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={() => setShowResetDialog(true)}
              disabled={resetting}
            >
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Resetting…" : "Reset Test Data"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => void onSave()}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="General" description="Site name, email, pagination, currency, and timezone.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Site Name">
              <input
                className={inputClassName}
                value={settings.siteName}
                onChange={(event) =>
                  setSettings({ ...settings, siteName: event.target.value })
                }
              />
            </Field>
            <Field label="Site Email">
              <input
                className={inputClassName}
                type="email"
                value={settings.siteEmail}
                onChange={(event) =>
                  setSettings({ ...settings, siteEmail: event.target.value })
                }
              />
            </Field>
            <Field label="Items Per Page">
              <input
                className={inputClassName}
                type="number"
                min="1"
                value={settings.itemsPerPage}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    itemsPerPage: Number(event.target.value || 1),
                  })
                }
              />
            </Field>
            <Field label="Currency">
              <input
                className={inputClassName}
                value={settings.currency}
                onChange={(event) =>
                  setSettings({ ...settings, currency: event.target.value })
                }
              />
            </Field>
            <Field label="Timezone">
              <input
                className={inputClassName}
                value={settings.timezone}
                onChange={(event) =>
                  setSettings({ ...settings, timezone: event.target.value })
                }
              />
            </Field>
          </div>
        </Card>

        <Card title="Toggles" description="Operational flags for the storefront.">
          <div className="space-y-3">
            <Toggle
              checked={settings.maintenanceMode}
              onChange={(checked) =>
                setSettings({ ...settings, maintenanceMode: checked })
              }
              label="Maintenance Mode"
            />
            <Toggle
              checked={settings.enableRegistration}
              onChange={(checked) =>
                setSettings({ ...settings, enableRegistration: checked })
              }
              label="Enable Registration"
            />
            <Toggle
              checked={settings.enableReviews}
              onChange={(checked) =>
                setSettings({ ...settings, enableReviews: checked })
              }
              label="Enable Reviews"
            />
          </div>
        </Card>
      </div>

      <Card title="System Info" description="Read-only runtime and integration notes.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="API Base URL" value={getApiBaseLabel()} />
          <InfoItem label="Auth Mode" value="Local browser session" />
          <InfoItem label="Admin Routes" value="App Router + shared admin layout" />
          <InfoItem
            label="Current Browser Timezone"
            value={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />
        </div>
      </Card>

      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset test data"
        description="This calls the admin reset endpoint and reloads settings. Continue?"
        confirmLabel="Reset"
        tone="danger"
        onConfirm={() => {
          void onReset();
        }}
      />
    </PageTransition>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}
