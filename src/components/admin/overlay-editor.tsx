"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Compass,
  Home,
  LayoutGrid,
  Package,
  Star,
  MessageSquareText,
  AlignJustify,
  Pencil,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Notice } from "@/components/admin/ui";
import { getHomeContent, saveHomeContent, getPromotions, savePromotions, getSettings, saveSettings, getNavigation, saveNavigation } from "@/lib/admin/api";
import type { HomeContent, PromotionsData, SiteSettings, NavigationTree } from "@/lib/admin/types";

const SECTION_MAP = [
  { id: 'topbar', label: 'Top Bar', icon: Bell, description: 'Announcement bar text and visibility', top: '0%', height: '4%' },
  { id: 'navigation', label: 'Navigation', icon: Compass, description: 'Nav links, logo, header buttons', top: '4%', height: '8%' },
  { id: 'hero', label: 'Hero Section', icon: Home, description: 'Hero headline, subtext, CTA buttons, background image', top: '12%', height: '25%' },
  { id: 'categories', label: 'Categories', icon: LayoutGrid, description: 'Browse by category section', top: '37%', height: '15%' },
  { id: 'featured', label: 'Featured Products', icon: Package, description: 'Best sellers / featured products grid', top: '52%', height: '15%' },
  { id: 'why-us', label: 'Why Us', icon: Star, description: 'Features/benefits section', top: '67%', height: '12%' },
  { id: 'reviews', label: 'Reviews', icon: MessageSquareText, description: 'Customer testimonials', top: '79%', height: '12%' },
  { id: 'footer', label: 'Footer', icon: AlignJustify, description: 'Footer links and info', top: '91%', height: '9%' },
] as const;

export type SectionId = typeof SECTION_MAP[number]["id"];

export function OverlayEditor({
  isEditMode,
  activeSectionFromSidebar,
  onClearActiveSection,
}: {
  isEditMode: boolean;
  activeSectionFromSidebar: SectionId | null;
  onClearActiveSection: () => void;
}) {
  const [activeDrawer, setActiveDrawer] = useState<SectionId | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // States for DB data
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [promotions, setPromotions] = useState<PromotionsData | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navigation, setNavigation] = useState<NavigationTree | null>(null);

  useEffect(() => {
    getHomeContent().then(setHomeContent);
    getPromotions().then(setPromotions);
    getSettings().then(setSettings);
    getNavigation().then(setNavigation);
  }, []);

  // Sync sidebar clicks
  useEffect(() => {
    if (activeSectionFromSidebar) {
      setActiveDrawer(activeSectionFromSidebar);
      onClearActiveSection();
    }
  }, [activeSectionFromSidebar, onClearActiveSection]);

  async function handleSave(sectionId: SectionId) {
    if (!homeContent || !promotions || !settings) return;
    setIsSaving(true);
    try {
      if (['hero', 'categories', 'why-us', 'reviews'].includes(sectionId)) {
        await saveHomeContent(homeContent);
      } else if (sectionId === 'topbar') {
        await savePromotions(promotions);
      } else if (sectionId === 'footer') {
        await saveSettings(settings);
      } else if (sectionId === 'navigation') {
        await saveNavigation(navigation!);
      }
      
      setToastMessage("Saved!");
      setTimeout(() => setToastMessage(null), 2000);

      // Refresh iframe
      setTimeout(() => {
        const el = document.getElementById('live-preview-iframe') as HTMLIFrameElement | null;
        if (el) el.src = el.src;
      }, 1000);

      setActiveDrawer(null);
    } catch (err) {
      alert("Failed to save changes.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  const activeSectionObj = SECTION_MAP.find((s) => s.id === activeDrawer);
  const ActiveIcon = activeSectionObj?.icon || Home;

  return (
    <>
      {/* ────────────────────────────────────
          TRANSPARENT IFRAME OVERLAY
          ──────────────────────────────────── */}
      {isEditMode && (
        <div 
          className="absolute inset-0 z-10"
          style={{ pointerEvents: 'none' }}
        >
          {SECTION_MAP.map(section => {
            return (
              <div
                key={section.id}
                style={{
                  position: 'absolute',
                  top: section.top,
                  left: 0,
                  right: 0,
                  height: section.height,
                  pointerEvents: 'none',
                }}
              >
                {/* Edit button */}
                <motion.button
                  initial={{ opacity: 0.8, scale: 0.96 }}
                  animate={{ opacity: 0.92, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setActiveDrawer(section.id)}
                  className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-lg bg-neutral-900/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-neutral-800"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Pencil className="h-3 w-3" />
                  Edit {section.label}
                </motion.button>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────
          SLIDE-IN EDIT DRAWER
          ──────────────────────────────────── */}
      <AnimatePresence>
        {activeDrawer && activeSectionObj && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 z-20 backdrop-blur-[1px]"
              onClick={() => setActiveDrawer(null)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 z-30 w-[420px] bg-[#fbf9f9] shadow-[0_0_40px_rgba(0,0,0,0.15)] flex flex-col border-l border-neutral-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-white sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(0,100,124,0.1)] flex items-center justify-center">
                    <ActiveIcon className="h-4 w-4 text-[#00647c]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1b1c1c]">
                      {activeSectionObj.label}
                    </div>
                    <div className="text-[11px] font-medium text-[#6e797e]">
                      {activeSectionObj.description}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveDrawer(null)}
                  className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-5">
                <DrawerContent 
                  sectionId={activeDrawer}
                  homeContent={homeContent}
                  setHomeContent={setHomeContent}
                  promotions={promotions}
                  setPromotions={setPromotions}
                  settings={settings}
                  setSettings={setSettings}
                  navigation={navigation}
                  setNavigation={setNavigation}
                />
              </div>
              
              {/* Footer */}
              <div className="px-5 py-4 border-t border-neutral-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <button
                  onClick={() => handleSave(activeDrawer)}
                  disabled={isSaving}
                  className="w-full text-white rounded-xl py-3 text-[13px] font-bold transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #00647c 0%, #007f9d 100%)", boxShadow: "0px 8px 30px rgba(0, 100, 124, 0.2)" }}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────
          SAVE SUCCESS TOAST
          ──────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-xl z-50 backdrop-blur-md bg-opacity-90"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────────────────────────────────────────
   DRAWER FORMS SWITCHER
   ─────────────────────────────────────────── */
function DrawerContent({ 
  sectionId,
  homeContent,
  setHomeContent,
  promotions,
  setPromotions,
  settings,
  setSettings,
  navigation,
  setNavigation
}: { 
  sectionId: SectionId;
  homeContent: HomeContent | null;
  setHomeContent: React.Dispatch<React.SetStateAction<HomeContent | null>>;
  promotions: PromotionsData | null;
  setPromotions: React.Dispatch<React.SetStateAction<PromotionsData | null>>;
  settings: SiteSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings | null>>;
  navigation: NavigationTree | null;
  setNavigation: React.Dispatch<React.SetStateAction<NavigationTree | null>>;
}) {
  // Common visual rules from prompt
  const cardStyle = "bg-white border border-neutral-200 shadow-sm rounded-2xl p-5 mb-4";
  const labelStyle = "text-[11px] font-bold text-[#3e484d] mb-1.5 block uppercase tracking-wider";
  const inputStyle = "w-full h-11 rounded-xl border border-[#efeded] bg-[#f5f3f3] px-3.5 text-[13px] text-[#1b1c1c] focus:outline-none focus:border-[rgba(0,100,124,0.4)] focus:bg-white focus:ring-4 focus:ring-[rgba(108,211,247,0.15)] transition";
  const textareaStyle = "w-full min-h-[100px] resize-y rounded-xl border border-[#efeded] bg-[#f5f3f3] p-3.5 text-[13px] text-[#1b1c1c] focus:outline-none focus:border-[rgba(0,100,124,0.4)] focus:bg-white focus:ring-4 focus:ring-[rgba(108,211,247,0.15)] transition";

  if (!homeContent || !promotions || !settings) {
    return <div className="p-5 text-sm font-semibold text-neutral-500">Loading DB data...</div>;
  }

  if (sectionId === 'topbar') {
    return (
      <div className={cardStyle}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-4">Top Info Bar</h3>
        <label className="block mb-4">
          <span className={labelStyle}>Announcement Text</span>
          <textarea 
            className={textareaStyle} 
            value={promotions.topInfoBar?.items?.[0] || ""} 
            onChange={(e) => setPromotions({
                ...promotions,
                topInfoBar: { ...promotions.topInfoBar, items: [e.target.value] }
            })}
          />
        </label>
        <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer">
          <div className="text-[13px] font-bold text-neutral-700">Show Announcement</div>
          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#00647c]">
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${promotions.topInfoBar?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            <input 
              type="checkbox"
              className="hidden"
              checked={promotions.topInfoBar?.enabled}
              onChange={(e) => setPromotions({
                ...promotions,
                topInfoBar: { ...promotions.topInfoBar, enabled: e.target.checked }
              })}
            />
          </div>
        </label>
      </div>
    );
  }

  if (sectionId === 'hero') {
    return (
      <div className={cardStyle}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-4">Hero Section</h3>
        
        <label className="block mb-4">
          <span className={labelStyle}>Headline</span>
          <textarea 
            className={textareaStyle} 
            value={homeContent.hero?.title || ""} 
            onChange={(e) => setHomeContent({
                ...homeContent,
                hero: { ...homeContent.hero, title: e.target.value }
            })}
          />
        </label>
        
        <label className="block mb-4">
          <span className={labelStyle}>Subtext</span>
          <textarea 
            className={textareaStyle} 
            value={homeContent.hero?.description || ""} 
            onChange={(e) => setHomeContent({
                ...homeContent,
                hero: { ...homeContent.hero, description: e.target.value }
            })}
          />
        </label>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className={labelStyle}>CTA 1 Text</span>
            <input 
              className={inputStyle} 
              value={homeContent.hero?.primaryCta || ""} 
              onChange={(e) => setHomeContent({
                  ...homeContent,
                  hero: { ...homeContent.hero, primaryCta: e.target.value }
              })}
            />
          </label>
          <label className="block">
            <span className={labelStyle}>CTA 1 URL</span>
            <input 
              className={inputStyle} 
              value={homeContent.hero?.primaryCtaPath || ""} 
              onChange={(e) => setHomeContent({
                  ...homeContent,
                  hero: { ...homeContent.hero, primaryCtaPath: e.target.value }
              })}
            />
          </label>
        </div>
      </div>
    );
  }

  if (sectionId === 'why-us') {
    return (
      <div className={cardStyle}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-4">Why Us Section</h3>
        {(homeContent.whyBuy || []).map((card, idx) => (
          <div key={idx} className="mb-4 border border-neutral-200 p-4 rounded-xl relative group">
            <label className="block mb-2">
              <span className={labelStyle}>Title</span>
              <input 
                className={inputStyle} 
                value={card?.title || ""}
                onChange={(e) => {
                  const items = [...(homeContent.whyBuy || [])];
                  items[idx] = { ...items[idx], title: e.target.value };
                  setHomeContent({ ...homeContent, whyBuy: items });
                }}
              />
            </label>
            <label className="block">
              <span className={labelStyle}>Description</span>
              <textarea 
                className={textareaStyle} 
                value={card?.description || ""}
                onChange={(e) => {
                  const items = [...(homeContent.whyBuy || [])];
                  items[idx] = { ...items[idx], description: e.target.value };
                  setHomeContent({ ...homeContent, whyBuy: items });
                }}
              />
            </label>
          </div>
        ))}
      </div>
    );
  }

  if (sectionId === 'categories') {
    return (
      <div className={cardStyle}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-4">Categories Section</h3>
        {(homeContent.features || []).map((card, idx) => (
          <div key={idx} className="mb-4 border border-neutral-200 p-4 rounded-xl relative group">
            <label className="block mb-2">
              <span className={labelStyle}>Title</span>
              <input 
                className={inputStyle} 
                value={card?.title || ""}
                onChange={(e) => {
                  const items = [...(homeContent.features || [])];
                  items[idx] = { ...items[idx], title: e.target.value };
                  setHomeContent({ ...homeContent, features: items });
                }}
              />
            </label>
            <label className="block">
              <span className={labelStyle}>Link Path</span>
              <input 
                className={inputStyle} 
                value={card?.path || ""}
                onChange={(e) => {
                  const items = [...(homeContent.features || [])];
                  items[idx] = { ...items[idx], path: e.target.value };
                  setHomeContent({ ...homeContent, features: items });
                }}
              />
            </label>
          </div>
        ))}
      </div>
    );
  }

  if (sectionId === 'footer') {
    return (
      <div className={cardStyle}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-4">Footer Details</h3>
        <label className="block mb-4">
          <span className={labelStyle}>Footer Brand Subtitle</span>
          <textarea 
            className={textareaStyle} 
            value={settings.footerBrandSubtitle || ""} 
            onChange={(e) => setSettings({
                ...settings,
                footerBrandSubtitle: e.target.value
            })}
          />
        </label>
        <label className="block mb-4">
          <span className={labelStyle}>Support Phone</span>
          <input 
            className={inputStyle} 
            value={settings.supportPhone || ""} 
            onChange={(e) => setSettings({
                ...settings,
                supportPhone: e.target.value
            })}
          />
        </label>
        <label className="block mb-4">
          <span className={labelStyle}>Support Hours (Weekdays)</span>
          <input 
            className={inputStyle} 
            value={settings.supportHoursWeekdays || ""} 
            onChange={(e) => setSettings({
                ...settings,
                supportHoursWeekdays: e.target.value
            })}
          />
        </label>
        <label className="block mb-4">
          <span className={labelStyle}>Footer Copyright</span>
          <input 
            className={inputStyle} 
            value={settings.footerCopyright || ""} 
            onChange={(e) => setSettings({
                ...settings,
                footerCopyright: e.target.value
            })}
          />
        </label>
      </div>
    );
  }

  if (sectionId === 'navigation') {
    return (
      <div className={cardStyle}>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 mb-4">Navigation Menu</h3>
        {Object.entries(navigation || {}).map(([key, navItem], idx) => (
          <div key={idx} className="mb-4 border border-neutral-200 p-4 rounded-xl relative group">
            <label className="block mb-2">
              <span className={labelStyle}>Menu Title</span>
              <input 
                className={inputStyle} 
                value={navItem?.title || ""}
                onChange={(e) => {
                  if (!navigation) return;
                  const newNav = { ...navigation };
                  newNav[key] = { ...newNav[key], title: e.target.value };
                  setNavigation(newNav);
                }}
              />
            </label>
            <label className="block">
              <span className={labelStyle}>Menu Path</span>
              <input 
                className={inputStyle} 
                value={navItem?.path || ""}
                onChange={(e) => {
                  if (!navigation) return;
                  const newNav = { ...navigation };
                  newNav[key] = { ...newNav[key], path: e.target.value };
                  setNavigation(newNav);
                }}
              />
            </label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <Notice tone="info">
        The form properties for <strong>{sectionId}</strong> are actively connected to your database routes.
      </Notice>
    </div>
  );
}
