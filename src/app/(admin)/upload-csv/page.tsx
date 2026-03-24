"use client";

import { useState } from "react";
import { Card, Notice, PageHeader } from "@/components/admin/ui";
import {
  downloadUploadTemplate,
  uploadProductsCsv,
} from "@/lib/admin/api";
import { downloadBlob } from "@/lib/admin/utils";
import type { UploadCsvResult } from "@/lib/admin/types";

type FlashState =
  | {
      tone: "success" | "error" | "info";
      text: string;
    }
  | null;

export default function UploadCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<UploadCsvResult | null>(null);
  const [notice, setNotice] = useState<FlashState>(null);

  async function onDownloadTemplate() {
    setDownloading(true);
    setNotice(null);

    try {
      const blob = await downloadUploadTemplate();
      downloadBlob(blob, "allremotes-products-template.csv");
      setNotice({
        tone: "success",
        text: "Template downloaded successfully.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not download template.",
      });
    } finally {
      setDownloading(false);
    }
  }

  async function onUpload() {
    if (!file) {
      setNotice({
        tone: "error",
        text: "Choose a CSV file before uploading.",
      });
      return;
    }

    setUploading(true);
    setNotice(null);

    try {
      const nextResult = await uploadProductsCsv(file);
      setResult(nextResult);
      setNotice({
        tone: "success",
        text: "CSV upload completed.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not upload CSV.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Upload CSV"
        description="Import products in bulk using the admin upload endpoint."
        actions={
          <>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => void onDownloadTemplate()}
              disabled={downloading}
            >
              {downloading ? "Downloading…" : "Download Template"}
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => void onUpload()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload CSV"}
            </button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="section-grid">
        <Card title="CSV Picker" description="Choose a product CSV file to upload.">
          <div className="file-picker">
            <input
              className="input"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <div className="helper-copy">
              Selected file: {file ? `${file.name} (${file.size} bytes)` : "None"}
            </div>
          </div>
        </Card>

        <Card title="Results Summary" description="Rows processed and upload outcome counts.">
          {result ? (
            <div className="results-grid">
              <div className="detail-item">
                <span>Rows processed</span>
                <strong>{result.rowsProcessed}</strong>
              </div>
              <div className="detail-item">
                <span>Created</span>
                <strong>{result.created}</strong>
              </div>
              <div className="detail-item">
                <span>Updated</span>
                <strong>{result.updated}</strong>
              </div>
              <div className="detail-item">
                <span>Failed</span>
                <strong>{result.failed}</strong>
              </div>
            </div>
          ) : (
            <div className="helper-copy">
              Upload a CSV file to see processing results here.
            </div>
          )}
        </Card>
      </div>

      {result ? (
        <Card title="Result Details" description="Per-row outcome with SKU, status, and error details.">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {result.details.map((detail) => (
                  <tr key={`${detail.row}_${detail.sku ?? detail.name ?? "row"}`}>
                    <td>{detail.row}</td>
                    <td>{detail.sku ?? "-"}</td>
                    <td>{detail.name ?? "-"}</td>
                    <td>
                      <span
                        className={
                          detail.status === "failed"
                            ? "status-pill status-pill--danger"
                            : detail.status === "created"
                              ? "status-pill status-pill--success"
                              : "status-pill status-pill--warning"
                        }
                      >
                        {detail.status}
                      </span>
                    </td>
                    <td>{detail.error ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
