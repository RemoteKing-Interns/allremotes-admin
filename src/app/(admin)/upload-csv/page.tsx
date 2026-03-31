"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import {
  Card,
  Notice,
  PageHeader,
  PageTransition,
  inputClassName,
  statusBadgeClass,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
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

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;
const REQUIRED_HEADERS = ["sku", "name", "price"];

function csvHeaders(input: string) {
  const firstLine = input
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0)
    ?.trim();

  if (!firstLine) {
    return [];
  }

  return firstLine
    .split(",")
    .map((header) => header.trim().toLowerCase().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

async function validateCsvFile(file: File) {
  const errors: string[] = [];
  const lowercaseName = file.name.toLowerCase();
  const isCsvType = file.type === "text/csv" || file.type === "application/vnd.ms-excel";

  if (!lowercaseName.endsWith(".csv") && !isCsvType) {
    errors.push("File must be a CSV (.csv) file.");
  }

  if (file.size > MAX_CSV_SIZE_BYTES) {
    errors.push("File size exceeds 5MB. Split the file and upload in smaller batches.");
  }

  if (file.size === 0) {
    errors.push("CSV file is empty.");
  }

  try {
    const preview = await file.slice(0, 4096).text();
    const headers = csvHeaders(preview);

    if (!headers.length) {
      errors.push("CSV header row is missing.");
    } else {
      const missing = REQUIRED_HEADERS.filter((required) => !headers.includes(required));
      if (missing.length) {
        errors.push(`Missing required headers: ${missing.join(", ")}.`);
      }
    }
  } catch {
    errors.push("Could not read the CSV file. Try selecting the file again.");
  }

  return errors;
}

export default function UploadCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

    if (validationErrors.length) {
      setNotice({
        tone: "error",
        text: "Fix CSV validation errors before uploading.",
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

  async function onFileChange(nextFile: File | null) {
    setFile(nextFile);
    setResult(null);
    setNotice(null);

    if (!nextFile) {
      setValidationErrors([]);
      return;
    }

    const errors = await validateCsvFile(nextFile);
    setValidationErrors(errors);
  }

  return (
    <PageTransition>
      <PageHeader
        title="Upload CSV"
        description="Import products in bulk using the admin upload endpoint."
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => void onDownloadTemplate()}
              disabled={downloading}
            >
              <Download className="h-4 w-4" />
              {downloading ? "Downloading…" : "Download Template"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => void onUpload()}
              disabled={uploading || !file || validationErrors.length > 0}
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload CSV"}
            </Button>
          </>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="CSV Picker" description="Choose a product CSV file to upload.">
          <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-800">
              <FileSpreadsheet className="h-4 w-4 text-neutral-600" />
              <span>CSV File</span>
            </div>
            <input
              className={inputClassName}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                void onFileChange(event.target.files?.[0] ?? null);
              }}
            />
            <p className="text-sm text-neutral-600">
              Selected file: {file ? `${file.name} (${file.size} bytes)` : "None"}
            </p>
            {validationErrors.length ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">CSV validation errors</p>
                <ul className="mt-2 list-disc pl-5">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : file ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                CSV file passed client-side validation.
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Results Summary" description="Rows processed and upload outcome counts.">
          {result ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Rows processed" value={String(result.rowsProcessed)} />
              <MetricCard label="Created" value={String(result.created)} />
              <MetricCard label="Updated" value={String(result.updated)} />
              <MetricCard label="Failed" value={String(result.failed)} />
            </div>
          ) : (
            <p className="text-sm text-neutral-600">
              Upload a CSV file to see processing results here.
            </p>
          )}
        </Card>
      </div>

      {result ? (
        <Card title="Result Details" description="Per-row outcome with SKU, status, and error details.">
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Row</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {result.details.map((detail) => (
                  <tr key={`${detail.row}_${detail.sku ?? detail.name ?? "row"}`}>
                    <td className="px-4 py-3 text-sm text-neutral-800">{detail.row}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{detail.sku ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{detail.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={statusBadgeClass(
                          detail.status === "failed"
                            ? "danger"
                            : detail.status === "created"
                              ? "success"
                              : "warning",
                        )}
                      >
                        {detail.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{detail.error ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </PageTransition>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}
