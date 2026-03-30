"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignJustify,
  Bell,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  FileSpreadsheet,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareText,
  Monitor,
  Package,
  RotateCw,
  Settings2,
  ShoppingCart,
  Smartphone,
  Star,
  Tablet,
  Trash2,
  Users,
  PencilRuler
} from "lucide-react";
import {
  clearAdminSession,
  getAdminSession,
  subscribeToAdminSession,
} from "@/lib/admin/auth";
import { OverlayEditor, type SectionId } from "@/components/admin/overlay-editor";

const PREVIEW_ROOT = (process.env.NEXT_PUBLIC_PREVIEW_ORIGIN ?? "")
  .trim()
  .replace(/\/+$/, "");
const DEFAULT_PREVIEW_URL = PREVIEW_ROOT || "/";

type DeviceMode = "desktop" | "tablet" | "mobile";

const SECTIONS = [
  { id: 'topbar',     label: 'Top Bar',          icon: Bell },
  { id: 'navigation', label: 'Navigation',       icon: Compass },
  { id: 'hero',       label: 'Hero Section',     icon: Home },
  { id: 'categories', label: 'Categories',       icon: LayoutGrid },
  { id: 'featured',   label: 'Featured Products', icon: Package },
  { id: 'why-us',     label: 'Why Us',           icon: Star },
  { id: 'reviews',    label: 'Reviews',          icon: MessageSquareText },
  { id: 'footer',     label: 'Footer',           icon: AlignJustify },
] as const;

const UTILITIES = [
  { href: "/products",        label: "Products",      icon: ShoppingCart },
  { href: "/orders",          label: "Orders",        icon: Package },
  { href: "/users",           label: "Users",         icon: Users },
  { href: "/upload-csv",      label: "Upload CSV",    icon: FileSpreadsheet },
  { href: "/settings",        label: "Settings",      icon: Settings2 },
  { href: "/clear-cache",     label: "Clear Cache",   icon: Trash2 },
] as const;

function normalizePreviewUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_PREVIEW_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (PREVIEW_ROOT) {
    if (trimmed.startsWith("/")) return `${PREVIEW_ROOT}${trimmed}`;
    return `${PREVIEW_ROOT}/${trimmed.replace(/^\/+/, "")}`;
  }

  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("#")) return `/${trimmed}`;

  return `/${trimmed.replace(/^\/+/, "")}`;
}

export const refreshIframe = () => {
  setTimeout(() => {
    const el = document.getElementById("live-preview-iframe") as HTMLIFrameElement | null;
    if (el) el.src = el.src;
  }, 1500);
};

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const session = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSession,
    () => null,
  );

  useEffect(() => {
    if (!session) router.replace("/login");
  }, [router, session]);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [activeSectionFromSidebar, setActiveSectionFromSidebar] = useState<SectionId | null>(null);

  /* Iframe state */
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_PREVIEW_URL);
  const [previewInput, setPreviewInput] = useState(DEFAULT_PREVIEW_URL);
  const [previewHistory, setPreviewHistory] = useState([DEFAULT_PREVIEW_URL]);
  const [previewHistoryIndex, setPreviewHistoryIndex] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const liveSyncTarget = (process.env.NEXT_PUBLIC_API_BASE_URL || "same-origin /api").trim();
  const liveSyncEnabled = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

  const historyRef = useRef<string[]>([DEFAULT_PREVIEW_URL]);
  const historyIndexRef = useRef(0);

  function syncHistory(next: string[], idx: number) {
    historyRef.current = next;
    historyIndexRef.current = idx;
    setPreviewHistory(next);
    setPreviewHistoryIndex(idx);
  }

  const navigatePreview = useCallback((value: string, pushToHistory = true) => {
    const normalized = normalizePreviewUrl(value);
    if (pushToHistory) {
      const base = historyRef.current.slice(0, historyIndexRef.current + 1);
      if (base[base.length - 1] !== normalized) {
        const next = [...base, normalized];
        syncHistory(next, next.length - 1);
      }
    }
    setPreviewUrl(normalized);
    setPreviewInput(normalized);
  }, []);

  function onPreviewSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigatePreview(previewInput, true);
  }

  const isDashboardRoute = pathname === "/dashboard" || pathname === "/";

  function handleSectionClick(sectionId: string) {
    if (!isDashboardRoute) {
      router.push("/dashboard");
    }
    // Set edit mode to true
    setIsEditMode(true);
    // Trigger scroll by changing iframe URL hash
    navigatePreview(`/#${sectionId}`, false);
    // Tell overlay editor to open drawer
    setActiveSectionFromSidebar(sectionId as SectionId);
    setMobileDrawerOpen(false);
  }

  function signOut() {
    clearAdminSession();
    router.replace("/login");
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #00647c 0%, #007f9d 100%)" }}>
        <div className="flex items-center gap-3 rounded-2xl px-6 py-4 text-sm text-white" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>Checking admin session…</span>
        </div>
      </div>
    );
  }

  const emailInitial = (session.email || "A")[0].toUpperCase();
  const iframeInnerClass = deviceMode === "desktop" ? "w-full h-full" : deviceMode === "tablet" ? "w-[768px] h-full rounded-lg overflow-hidden shadow-xl border border-neutral-300 my-4" : "w-[390px] h-full rounded-[2rem] overflow-hidden shadow-2xl border-4 border-neutral-800 my-8";

  /* ═══════════════════════════════════════════
     SIDEBAR
     ═══════════════════════════════════════════ */
  const sidebarContent = (
    <div className="flex h-full flex-col" style={{ width: 260, background: "#ffffff", boxShadow: "1px 0 0 #efeded" }}>
      <div className="flex flex-col justify-center px-5" style={{ height: 64, flexShrink: 0, borderBottom: "1px solid #efeded" }}>
        <img src="/images/mainlogo.png" alt="ALLREMOTES" className="h-7 w-auto" style={{ filter: "brightness(0)" }} />
        <span className="mt-1 font-bold uppercase" style={{ fontSize: 9, letterSpacing: "0.2em", color: "#6e797e" }}>Admin Editor</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-3 font-bold uppercase tracking-[0.08em] text-[10px] text-[#6e797e]">Edit Sections</div>
        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSectionClick(item.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#3e484d] transition-colors hover:bg-[#f5f3f3]"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mx-3 my-4 border-t border-[#efeded]" />

        <div className="mb-3 px-3 font-bold uppercase tracking-[0.08em] text-[10px] text-[#6e797e]">Utilities</div>
        <nav className="flex flex-col gap-0.5">
          {UTILITIES.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileDrawerOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors"
                style={
                  isActive
                    ? { background: "rgba(0, 100, 124, 0.1)", color: "#00647c", fontWeight: 700 }
                    : { color: "#3e484d" }
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ flexShrink: 0, borderTop: "1px solid #efeded", background: "#f5f3f3", padding: "14px 16px" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "linear-gradient(135deg, #00647c, #007f9d)", color: "#ffffff" }}>
            {emailInitial}
          </div>
          <span className="min-w-0 flex-1 truncate text-xs text-[#3e484d]">{session.email}</span>
          <button type="button" onClick={signOut} className="rounded-lg p-1.5 transition hover:bg-white text-[#6e797e]">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbf9f9]">
      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 z-[60] h-full lg:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex shrink-0 h-screen">{sidebarContent}</aside>

      {/* ────────────────────────────────────
          MAIN CONTENT AREA
          ──────────────────────────────────── */}
      {isDashboardRoute ? (
        <section className="flex-1 flex flex-col relative w-full overflow-hidden">
          {/* Iframe Topbar */}
          <div className="flex flex-shrink-0 items-center gap-3 px-4 shadow-sm z-10" style={{ height: 60, background: "#ffffff", borderBottom: "1px solid #efeded" }}>
            <div className="lg:hidden flex mr-2">
              <button 
                onClick={() => setMobileDrawerOpen(true)}
                className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            
            {/* Edit Mode Toggle using Framer Motion logic or just button */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all mr-2"
              style={{
                background: isEditMode ? "linear-gradient(135deg, #0cebeb, #20e3b2)" : "#f5f3f3",
                color: isEditMode ? "#1b1c1c" : "#6e797e",
                borderColor: isEditMode ? "transparent" : "#efeded",
                boxShadow: isEditMode ? "0 4px 15px rgba(32, 227, 178, 0.3)" : "none"
              }}
            >
              <PencilRuler className="h-3.5 w-3.5" />
              {isEditMode ? "Edit Mode ON" : "Edit Mode OFF"}
            </button>

            <div
              className="hidden xl:flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                borderColor: liveSyncEnabled ? "rgba(46, 107, 111, 0.35)" : "#efeded",
                color: liveSyncEnabled ? "#2e6b6f" : "#6e797e",
                background: liveSyncEnabled ? "rgba(46, 107, 111, 0.08)" : "#f5f3f3",
              }}
              title={`Admin API target: ${liveSyncTarget}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: liveSyncEnabled ? "#2e6b6f" : "#9ca3af" }} />
              {liveSyncEnabled ? "Live Sync" : "Local Sync"}
            </div>

            {/* URL Navigation */}
            <div className="flex gap-1 ml-auto shrink-0">
              <button onClick={() => navigatePreview(previewHistory[previewHistoryIndex - 1] || DEFAULT_PREVIEW_URL, false)} disabled={previewHistoryIndex <= 0} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => navigatePreview(previewHistory[previewHistoryIndex + 1] || previewUrl, false)} disabled={previewHistoryIndex >= previewHistory.length - 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={refreshIframe} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 mr-2">
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <form className="max-w-md w-full shrink hidden md:block" onSubmit={onPreviewSubmit}>
              <div className="relative">
                <Compass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  className="h-9 w-full rounded-full bg-[#f5f3f3] border border-[#efeded] pl-9 pr-4 text-[12px] font-medium text-neutral-700 outline-none transition focus:border-[#bdc8ce] focus:bg-white"
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  onBlur={() => navigatePreview(previewInput, true)}
                />
              </div>
            </form>

            <div className="flex gap-1 ml-4 rounded-xl p-1 bg-[#f5f3f3]">
              {([{ m: "desktop", i: Monitor }, { m: "tablet", i: Tablet }, { m: "mobile", i: Smartphone }] as const).map(d => (
                <button
                  key={d.m}
                  onClick={() => setDeviceMode(d.m as DeviceMode)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${deviceMode === d.m ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
                >
                  <d.i className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            
            <a href={previewUrl} target="_blank" rel="noreferrer" className="w-8 h-8 hidden lg:flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 border border-neutral-200 ml-2">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Iframe & Overlay Area */}
          <div className="relative flex-1 flex items-center justify-center bg-[#efeded] overflow-hidden">
            <div className={`relative ${iframeInnerClass} transition-all duration-300`}>
              <OverlayEditor 
                isEditMode={isEditMode}
                activeSectionFromSidebar={activeSectionFromSidebar}
                onClearActiveSection={() => setActiveSectionFromSidebar(null)}
              />
              <iframe
                id="live-preview-iframe"
                src={previewUrl}
                className="w-full h-full border-0 bg-white"
                allow="same-origin"
              />
            </div>
          </div>
        </section>
      ) : (
        /* UTILITIES MODE (E.g. Products, Orders pages) */
        <section className="flex-1 flex flex-col h-full w-full overflow-hidden bg-[#fbf9f9]">
          <div className="lg:hidden flex items-center px-4 py-3 bg-white border-b border-neutral-200 shadow-sm">
            <button 
              onClick={() => setMobileDrawerOpen(true)}
              className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 mr-3"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-neutral-900">Admin Section</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-12 w-full max-w-6xl mx-auto">
            {children}
          </div>
        </section>
      )}
    </div>
  );
}
