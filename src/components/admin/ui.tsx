"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Inbox,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

/* 
  Stitch Cyan Horizon Admin Tokens 
  Replacing standard borders and backgrounds with precise tokens 
*/
export const inputClassName =
  "h-11 w-full rounded-xl border border-[#efeded] bg-[#f5f3f3] px-4 text-[13px] font-medium text-[#1b1c1c] placeholder:text-[#6e797e] outline-none transition focus:border-[rgba(0,100,124,0.4)] focus:bg-[#ffffff] focus:ring-4 focus:ring-[rgba(108,211,247,0.15)]";

export const selectClassName = joinClasses(inputClassName, "appearance-none pr-10");

export const textareaClassName =
  "min-h-[120px] w-full rounded-xl border border-[#efeded] bg-[#f5f3f3] px-4 py-3 text-[13px] font-medium text-[#1b1c1c] placeholder:text-[#6e797e] outline-none transition focus:border-[rgba(0,100,124,0.4)] focus:bg-[#ffffff] focus:ring-4 focus:ring-[rgba(108,211,247,0.15)]";

export function statusBadgeClass(
  tone: "success" | "danger" | "warning" | "muted" | "info" = "muted",
) {
  const toneClass = {
    success: "bg-[rgba(16,185,129,0.12)] text-[#10b981]",
    danger: "bg-[rgba(244,63,94,0.12)] text-[#f43f5e]",
    warning: "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]",
    muted: "bg-[#efeded] text-[#6e797e]",
    info: "bg-[rgba(14,165,233,0.12)] text-[#0ea5e9]",
  }[tone];

  return joinClasses(
    "inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
    toneClass,
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader(props: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div 
      className="flex flex-col gap-4 rounded-xl px-6 py-5 lg:flex-row lg:items-end lg:justify-between"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
        border: "1px solid rgba(189, 200, 206, 0.15)",
      }}
    >
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6e797e]">
          Admin Section
        </p>
        <h1 className="text-[22px] font-bold tracking-tight text-[#1b1c1c]">
          {props.title}
        </h1>
        {props.description ? <p className="text-[13px] font-medium text-[#3e484d]">{props.description}</p> : null}
      </div>
      {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
    </div>
  );
}

export function Card(props: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section 
      className="rounded-xl p-5 sm:p-6"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: "0px 4px 20px rgba(27, 28, 28, 0.03)",
        border: "1px solid rgba(189, 200, 206, 0.15)",
      }}
    >
      {props.title || props.description || props.actions ? (
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {props.title ? (
              <h2 className="text-[15px] font-bold tracking-tight text-[#1b1c1c]">
                {props.title}
              </h2>
            ) : null}
            {props.description ? <p className="text-[13px] font-medium text-[#6e797e]">{props.description}</p> : null}
          </div>
          {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
        </div>
      ) : null}
      {props.children}
    </section>
  );
}

export function Field(props: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={joinClasses("grid gap-1.5", props.full && "md:col-span-2")}>
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#3e484d]">
        {props.label}
      </span>
      {props.children}
    </label>
  );
}

export function Notice(props: {
  tone?: "success" | "error" | "info";
  children: ReactNode;
}) {
  const tone = props.tone ?? "info";

  const toneMeta = {
    success: {
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      className: "border-[#10b981]/20 bg-[rgba(16,185,129,0.06)] text-[#10b981]",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
      className: "border-[#f43f5e]/20 bg-[rgba(244,63,94,0.06)] text-[#e11d48]",
    },
    info: {
      icon: <Info className="h-4 w-4" aria-hidden="true" />,
      className: "border-[#0ea5e9]/20 bg-[rgba(14,165,233,0.06)] text-[#0284c7]",
    },
  }[tone];

  return (
    <div
      className={joinClasses(
        "flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-[13px] font-medium shadow-[0_2px_10px_rgba(27,28,28,0.02)]",
        toneMeta.className,
      )}
    >
      <div className="flex-shrink-0">{toneMeta.icon}</div>
      <span>{props.children}</span>
    </div>
  );
}

export function EmptyState(props: {
  title: string;
  description: string;
}) {
  return (
    <div 
      className="flex flex-col items-center justify-center gap-2 rounded-xl px-6 py-12 text-center"
      style={{
        backgroundColor: "#fbf9f9",
        border: "1px dashed rgba(189, 200, 206, 0.4)",
      }}
    >
      <div 
        className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: "#efeded", color: "#6e797e" }}
      >
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <strong className="text-[15px] font-bold tracking-tight text-[#1b1c1c]">{props.title}</strong>
      <p className="max-w-md text-[13px] font-medium text-[#6e797e]">{props.description}</p>
    </div>
  );
}

export function Toggle(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      className="inline-flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:opacity-90"
      style={{
        background: props.checked ? "rgba(0,100,124,0.04)" : "#f5f3f3",
        border: "1px solid rgba(189, 200, 206, 0.15)",
      }}
      onClick={() => props.onChange(!props.checked)}
    >
      <span className="text-[13px] font-bold text-[#1b1c1c]">{props.label}</span>
      <span
        className={joinClasses(
          "relative h-6 w-11 rounded-full transition-all duration-300",
          props.checked ? "bg-[#00647c]" : "bg-[#bdc8ce]"
        )}
      >
        <span
          className={joinClasses(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300",
            props.checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl bg-[#ffffff]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#00647c]" aria-hidden="true" />
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#6e797e]">{label}</span>
      </div>
    </div>
  );
}

export function ConfirmDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="rounded-xl border-0 shadow-[0_12px_40px_rgba(27,28,28,0.12)] sm:max-w-[400px]">
        <DialogHeader className="pt-2">
          <div 
            className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ 
              background: props.tone === "danger" ? "rgba(244,63,94,0.12)" : "rgba(0,100,124,0.12)",
              color: props.tone === "danger" ? "#f43f5e" : "#00647c" 
            }}
          >
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl font-bold text-[#1b1c1c]">{props.title}</DialogTitle>
          <DialogDescription className="text-[13px] font-medium text-[#6e797e]">
            {props.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="ghost"
            className="rounded-xl text-[13px] font-bold text-[#3e484d] hover:bg-[#f5f3f3]"
            onClick={() => props.onOpenChange(false)}
          >
            {props.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant={props.tone === "danger" ? "danger" : "primary"}
            className="rounded-xl px-5 text-[13px] font-bold"
            style={
              props.tone !== "danger"
                ? { background: "linear-gradient(135deg, #00647c 0%, #007f9d 100%)", color: "white" }
                : undefined
            }
            onClick={props.onConfirm}
          >
            {props.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
