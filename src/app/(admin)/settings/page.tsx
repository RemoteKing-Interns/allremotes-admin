"use client";

import { useEffect, useState } from "react";
import { Card, LoadingState, Notice, PageHeader, Toggle } from "@/components/admin/ui";
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
    if (!window.confirm("Reset test data via the admin reset endpoint?")) {
      return;
    }

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
    }
  }

  if (loading || !settings) {
    return <LoadingState label="Loading settings…" />;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Settings"
        description="General store configuration, feature toggles, runtime information, and test reset."
        actions={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void onReset()}
              disabled={resetting}
            >
              {resetting ? "Resetting…" : "Reset Test Data"}
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="section-grid">
        <Card title="General" description="Site name, email, pagination, currency, and timezone.">
          <div className="form-grid">
            <label className="field">
              <span>Site Name</span>
              <input
                className="input"
                value={settings.siteName}
                onChange={(event) =>
                  setSettings({ ...settings, siteName: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Site Email</span>
              <input
                className="input"
                type="email"
                value={settings.siteEmail}
                onChange={(event) =>
                  setSettings({ ...settings, siteEmail: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Items Per Page</span>
              <input
                className="input"
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
            </label>
            <label className="field">
              <span>Currency</span>
              <input
                className="input"
                value={settings.currency}
                onChange={(event) =>
                  setSettings({ ...settings, currency: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Timezone</span>
              <input
                className="input"
                value={settings.timezone}
                onChange={(event) =>
                  setSettings({ ...settings, timezone: event.target.value })
                }
              />
            </label>
          </div>
        </Card>

        <Card title="Toggles" description="Operational flags for the storefront.">
          <div className="stack">
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
        <div className="system-grid">
          <div className="detail-item">
            <span>API Base URL</span>
            <strong>{getApiBaseLabel()}</strong>
          </div>
          <div className="detail-item">
            <span>Auth Mode</span>
            <strong>Local browser session</strong>
          </div>
          <div className="detail-item">
            <span>Admin Routes</span>
            <strong>App Router + shared admin layout</strong>
          </div>
          <div className="detail-item">
            <span>Current Browser Timezone</span>
            <strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}
