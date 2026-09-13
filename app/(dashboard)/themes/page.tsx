"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  ChevronDown,
  Lock,
  Check,
  Search,
  ShoppingBag,
  Store,
  X,
  Sparkles,
  Copy,
  Trash2,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RestaurantThemeRecord, ThemePresetId, ThemeSettingsV1 } from "@/types/theme-engine";
import { getTenantMenuUrl, getTenantDisplayDomain } from "@/lib/utils/domain";

interface PresetItem {
  presetId: ThemePresetId;
  name: string;
  tagline: string;
  description: string;
  author: string;
  previewImage: string;
}

function formatRelativeTime(dateInput: Date | string | undefined): string {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ThemesPage() {
  const [loading, setLoading] = useState(true);
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string>("");
  const [themes, setThemes] = useState<Array<RestaurantThemeRecord & { isLive: boolean }>>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  
  // Dropdown menu state for draft actions
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Dynamic scale state for pixel-perfect centering of live preview mockups
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [desktopScale, setDesktopScale] = useState(0.45);
  const [mobileScale, setMobileScale] = useState(0.42);

  useEffect(() => {
    const updateScales = () => {
      if (desktopContainerRef.current) {
        const { clientWidth, clientHeight } = desktopContainerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          const sX = clientWidth / 1160;
          const sY = clientHeight / 720;
          setDesktopScale(Math.min(sX, sY));
        }
      }
      if (mobileContainerRef.current) {
        const { clientWidth, clientHeight } = mobileContainerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          const sX = clientWidth / 390;
          const sY = clientHeight / 780;
          setMobileScale(Math.min(sX, sY));
        }
      }
    };

    updateScales();
    const observer = new ResizeObserver(updateScales);
    if (desktopContainerRef.current) observer.observe(desktopContainerRef.current);
    if (mobileContainerRef.current) observer.observe(mobileContainerRef.current);
    window.addEventListener("resize", updateScales);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScales);
    };
  }, []);

  // Toast state
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/restaurant/themes");
      if (!res.ok) throw new Error("Failed to load themes");
      const data = await res.json();
      setActiveThemeId(data.activeThemeId);
      setRestaurantSlug(data.restaurantSlug || "");
      setThemes(data.themes || []);
      setPresets(data.presets || []);
    } catch (err: any) {
      console.error("Error fetching themes:", err);
      showToast("Failed to load themes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Click outside to close draft action menus
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-theme-dropdown]")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const activeTheme = themes.find((t) => t.id === activeThemeId) || themes[0] || null;
  const draftThemes = themes.filter((t) => t.id !== activeThemeId);

  // Publish theme (Single Source of Truth)
  const handlePublish = async (themeId: string) => {
    try {
      const res = await fetch(`/api/restaurant/themes/${themeId}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish theme");

      setActiveThemeId(themeId);
      setThemes((prev) =>
        prev.map((t) => ({
          ...t,
          status: t.id === themeId ? "published" : "draft",
          isLive: t.id === themeId,
        }))
      );
      showToast(data.message || "Theme published successfully!");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Duplicate theme into draft copy
  const handleDuplicate = async (themeId: string) => {
    try {
      const res = await fetch(`/api/restaurant/themes/${themeId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate theme");

      await fetchThemes();
      showToast(data.message || "Theme duplicated!");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Delete draft theme (Protected against active theme deletion)
  const handleDelete = async (themeId: string) => {
    if (themeId === activeThemeId) {
      showToast("Cannot delete the active live theme. Please publish another theme first.", "error");
      return;
    }
    if (!confirm("Are you sure you want to remove this theme from your library?")) return;

    try {
      const res = await fetch(`/api/restaurant/themes/${themeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete theme");

      setThemes((prev) => prev.filter((t) => t.id !== themeId));
      showToast("Theme removed from library");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Install preset into library
  const handleAddPreset = async (presetId: ThemePresetId) => {
    try {
      const res = await fetch("/api/restaurant/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add theme");

      await fetchThemes();
      showToast(data.message || "Theme added to your library!");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="min-h-full bg-[#F6F6F7] p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-sans text-left text-[#202223]">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 text-white text-xs font-semibold rounded-lg shadow-xl ${
              toast.type === "error" ? "bg-red-600" : "bg-[#202223]"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle size={15} className="text-white" />
            ) : (
              <Check size={15} className="text-emerald-400" />
            )}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center text-[#008060]">
            <Store size={22} strokeWidth={2.2} />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#202223] tracking-tight">
            Online Store • Themes
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getTenantMenuUrl(restaurantSlug)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-white hover:bg-[#F1F1F1] border border-[#D2D5D8] rounded-lg text-xs font-semibold text-[#202223] transition shadow-2xs flex items-center gap-1.5"
          >
            <span>View store</span>
            <ExternalLink size={12} className="text-gray-400" />
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CURRENT THEME CONTAINER CARD (ACTIVE LIVE THEME PREVIEW)              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#E1E3E5] shadow-2xs overflow-hidden">
        
        {/* Preview Canvas */}
        <div className="bg-[#EBEBEB] p-6 sm:p-10 flex items-center justify-center relative overflow-hidden border-b border-[#E1E3E5]">
          <div className="flex items-center justify-center gap-4 sm:gap-6 max-w-4xl w-full">
            
            {/* Desktop Mockup (Live Scaled Storefront - Perfectly Centered) */}
            <div className="flex-1 bg-white rounded-lg shadow-md border border-[#D2D5D8] overflow-hidden flex flex-col h-[300px] sm:h-[340px] relative group">
              {/* Browser Window Bar */}
              <div className="h-7 bg-[#F6F6F7] border-b border-[#E1E3E5] px-3 relative flex items-center justify-between shrink-0 z-10 select-none">
                {/* Left: Window Dots */}
                <div className="flex items-center gap-1.5 w-16">
                  <div className="w-2 h-2 rounded-full bg-[#ED6A5E]" />
                  <div className="w-2 h-2 rounded-full bg-[#F5BF4F]" />
                  <div className="w-2 h-2 rounded-full bg-[#62C554]" />
                </div>

                {/* Center: Exactly Centered Address Pill with Real Dev/Prod URL */}
                <div className="absolute inset-x-0 mx-auto w-fit max-w-[260px] flex items-center justify-center pointer-events-none">
                  <a
                    href={getTenantMenuUrl(restaurantSlug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto bg-white hover:bg-gray-50 border border-[#E1E3E5] rounded-md px-2.5 py-0.5 text-[9px] text-gray-700 font-mono truncate flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    title="Open live store in new tab"
                  >
                    <Lock size={8} className="text-emerald-600 shrink-0" />
                    <span className="truncate font-semibold">
                      {getTenantDisplayDomain(restaurantSlug)}
                    </span>
                    <ExternalLink size={8} className="text-gray-400 shrink-0 ml-0.5" />
                  </a>
                </div>

                {/* Right: Symmetry Spacer */}
                <div className="w-16" />
              </div>

              {/* Scaled Desktop Live View (Dead-Center Aligned) */}
              <div
                ref={desktopContainerRef}
                className="flex-1 relative overflow-hidden bg-[#0e1013] flex items-center justify-center"
              >
                {restaurantSlug && activeTheme ? (
                  <iframe
                    src={`/preview/menu/${restaurantSlug}?preview_theme=${activeTheme.id}`}
                    title="Live Store Desktop Preview"
                    className="pointer-events-none select-none border-0 shrink-0"
                    style={{
                      width: "1160px",
                      height: "720px",
                      transform: `scale(${desktopScale})`,
                      transformOrigin: "center center",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Loading preview...
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Phone Mockup (Live Scaled Storefront - Perfectly Centered) */}
            <div className="w-[140px] sm:w-[170px] bg-white rounded-2xl shadow-md border-2 border-[#D2D5D8] overflow-hidden flex flex-col h-[300px] sm:h-[340px] shrink-0 relative group">
              {/* Dynamic Island Notch */}
              <div className="h-3.5 bg-transparent absolute top-1 inset-x-0 z-20 flex justify-center pointer-events-none">
                <div className="w-12 h-2.5 bg-black rounded-full" />
              </div>

              {/* Scaled Mobile Live View (Dead-Center Aligned) */}
              <div
                ref={mobileContainerRef}
                className="flex-1 relative overflow-hidden bg-white flex items-center justify-center"
              >
                {restaurantSlug && activeTheme ? (
                  <iframe
                    src={`/preview/menu/${restaurantSlug}?preview_theme=${activeTheme.id}`}
                    title="Live Store Mobile Preview"
                    className="pointer-events-none select-none border-0 shrink-0"
                    style={{
                      width: "390px",
                      height: "780px",
                      transform: `scale(${mobileScale})`,
                      transformOrigin: "center center",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Loading...
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Live Banner */}
        <div className="bg-[#EDF8F2] border-b border-[#D0F0E0] px-4 py-2 flex items-center justify-between text-xs text-[#108043]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#108043]" />
            <span className="font-semibold">Current Live Theme:</span>
            <span className="text-gray-700">Customers see this theme when scanning your QR menu</span>
          </div>
          <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-[#D0F0E0] text-gray-500">
            ID: {activeThemeId ? `${activeThemeId.slice(0, 8)}...` : "None"}
          </span>
        </div>

        {/* Theme Actions Bar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#202223]">
                {activeTheme?.name || "No Active Theme"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4F8ED] text-[#108043]">
                Published
              </span>
            </div>
            <p className="text-xs text-[#6D7175]">
              Preset: <span className="font-semibold capitalize">{activeTheme?.presetId}</span> • 
              Status: <span className="font-semibold text-[#108043]">Live on QR Menu</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeTheme && (
              <>
                <button
                  type="button"
                  onClick={() => handleDuplicate(activeTheme.id)}
                  className="p-2 bg-white hover:bg-[#F1F1F1] border border-[#D2D5D8] rounded-lg text-[#5C5F62] transition shadow-2xs cursor-pointer"
                  title="Duplicate to Draft"
                >
                  <Copy size={16} />
                </button>
                <Link
                  href={`/themes/${activeTheme.id}/editor`}
                  className="px-4 py-2 bg-[#202223] hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sliders size={14} />
                  <span>Customize</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DRAFT THEMES (SHOPIFY-GRADE DRAFT INTERFACE)                            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-[#202223]">
            Draft themes
          </h2>
          <button
            type="button"
            onClick={() => showToast("Theme import available in upcoming release.", "success")}
            className="px-3 py-1.5 bg-[#F1F2F3] hover:bg-[#E4E5E7] border border-[#D2D5D8] rounded-lg text-xs font-semibold text-[#202223] flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <span>Import</span>
            <ChevronDown size={12} className="text-gray-500" />
          </button>
        </div>

        {draftThemes.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E1E3E5] p-8 text-center shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-2.5">
              <Sliders size={18} />
            </div>
            <h3 className="text-sm font-semibold text-[#202223]">No draft themes</h3>
            <p className="text-xs text-[#6D7175] mt-1 max-w-sm mx-auto">
              Duplicate your live theme or add presets below to create a draft theme for your store.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E1E3E5] divide-y divide-gray-100 shadow-2xs">
            {draftThemes.map((t) => (
              <div
                key={t.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition"
              >
                {/* Left: Thumbnail & Theme Meta */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Shopify-style miniature desktop & mobile mockup frame */}
                  <div className="relative w-20 sm:w-24 h-14 sm:h-16 bg-[#F4F5F6] rounded-lg border border-[#E1E3E5] p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <div className="w-full h-full rounded bg-white shadow-xs border border-gray-200 overflow-hidden relative">
                      <img
                        src={`/images/themes/${t.presetId}.svg`}
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Mobile mockup badge overlapping */}
                    <div className="absolute -bottom-1 -right-1 w-6 sm:w-7 h-9 sm:h-10 bg-white rounded-sm border-2 border-white shadow-md overflow-hidden">
                      <img
                        src={`/images/themes/${t.presetId}.svg`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-bold text-[#202223] truncate">
                      {t.name}
                    </h3>
                    <p className="text-xs text-[#6D7175]">
                      Added: {formatRelativeTime(t.createdAt)}
                    </p>
                    <button
                      type="button"
                      className="text-xs text-[#6D7175] flex items-center gap-1 hover:text-[#202223] transition cursor-pointer pt-0.5"
                    >
                      <span>Version 1.0.0</span>
                      <ChevronDown size={11} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Right: Action Buttons Group */}
                <div
                  className="flex items-center gap-2 shrink-0 self-end sm:self-auto relative"
                  data-theme-dropdown
                >
                  {/* More actions button (···) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === t.id ? null : t.id);
                      }}
                      className="w-8 h-8 rounded-lg border border-[#D2D5D8] bg-white hover:bg-[#F6F6F7] text-[#5C5F62] flex items-center justify-center transition shadow-2xs cursor-pointer"
                      title="More actions"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {/* Popover Dropdown Menu */}
                    {openMenuId === t.id && (
                      <div
                        className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-30 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDuplicate(t.id);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition"
                          >
                            <Copy size={13} className="text-gray-500" />
                            <span>Duplicate</span>
                          </button>
                          <Link
                            href={`/themes/${t.id}/editor`}
                            onClick={() => setOpenMenuId(null)}
                            className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition"
                          >
                            <Sliders size={13} className="text-gray-500" />
                            <span>Customize</span>
                          </Link>
                        </div>
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDelete(t.id);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition font-medium"
                          >
                            <Trash2 size={13} className="text-red-500" />
                            <span>Delete theme</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publish ∨ Button */}
                  <button
                    type="button"
                    onClick={() => handlePublish(t.id)}
                    className="px-3.5 py-1.5 bg-white hover:bg-[#F6F6F7] border border-[#D2D5D8] text-[#202223] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <span>Publish</span>
                    <ChevronDown size={12} className="text-gray-500" />
                  </button>

                  {/* Edit theme Button */}
                  <Link
                    href={`/themes/${t.id}/editor`}
                    className="px-3.5 py-1.5 bg-white hover:bg-[#F6F6F7] border border-[#D2D5D8] text-[#202223] rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer inline-flex items-center"
                  >
                    Edit theme
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. DISCOVER THEMES (OFFICIAL FLAGSHIP PRESETS)                            */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#202223]">
              Discover themes
            </h2>
            <p className="text-xs text-[#6D7175] mt-0.5">
              Explore curated default themes by DZMenu. Add them to your library to customize.
            </p>
          </div>
        </div>

        {/* 3-Column Grid (Flagship Curated SVG Image Preview Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map((p) => (
            <div
              key={p.presetId}
              className="bg-white rounded-xl border border-[#E1E3E5] overflow-hidden shadow-2xs flex flex-col justify-between group"
            >
              {/* Standalone Vector Image Mockup */}
              <div className="h-[280px] bg-[#FAF9F5] border-b border-[#E1E3E5] overflow-hidden relative">
                <img
                  src={p.previewImage}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition duration-300"
                />
              </div>

              {/* Bottom Card Bar */}
              <div className="p-3.5 flex items-center justify-between bg-white">
                <div>
                  <h4 className="text-xs font-semibold text-[#005BD3]">
                    {p.name}
                  </h4>
                  <span className="text-[11px] text-[#6D7175]">
                    {p.author}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddPreset(p.presetId)}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#F1F1F1] border border-[#D2D5D8] rounded-lg text-xs font-medium text-[#202223] transition shadow-2xs cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER LINK */}
      <div className="text-center pt-4 pb-10">
        <span className="text-xs text-[#6D7175]">
          DZMenu Multi-Tenant Theme Engine • Version 2.0
        </span>
      </div>

    </div>
  );
}
