"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  Save,
  Check,
  AlertCircle,
  Palette,
  Sliders,
  ExternalLink,
  Layers,
  Copy,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RestaurantThemeRecord, ThemePresetDefinition } from "@/types/theme-engine";
import type { Restaurant } from "@/types/restaurant";
import { sanitizeThemeForCss } from "@/lib/themes/sanitizer";
import { DynamicControlsEngine } from "@/components/theme-editor/DynamicControlsEngine";
import { useThemePackage } from "@/hooks/useThemePackage";
import type { ThemePackage } from "@/types/theme-contract";

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  const allKeys = new Set([...keysA, ...keysB]);
  for (const key of allKeys) {
    const valA = objA[key];
    const valB = objB[key];

    if (valA === undefined && valB === undefined) continue;
    if (!isDeepEqual(valA, valB)) return false;
  }

  return true;
}

function normalizeSettings(raw: unknown, pkg: ThemePackage | null): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  if (pkg?.validateSettings) {
    try {
      return pkg.validateSettings(raw) as Record<string, unknown>;
    } catch {
      return raw as Record<string, unknown>;
    }
  }
  return raw as Record<string, unknown>;
}

function setNestedPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(obj));
  const parts = path.split(".");
  let curr = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  curr[parts[parts.length - 1]] = value;
  return clone;
}

interface ThemeEditorClientProps {
  theme: RestaurantThemeRecord & { isLive: boolean };
  restaurant: Restaurant;
  definition: ThemePresetDefinition;
}

type DeviceMode = "desktop" | "mobile";
type ActiveTab = "settings" | "sections";

export default function ThemeEditorClient({
  theme: initialTheme,
  restaurant,
}: ThemeEditorClientProps) {
  // Theme Package Hook (React Rules of Hooks: Unconditional top-level call)
  const { themePackage } = useThemePackage(initialTheme.presetId);

  // Theme state
  const [themeName, setThemeName] = useState(initialTheme.name);
  const [settings, setSettings] = useState<Record<string, unknown>>(() =>
    JSON.parse(JSON.stringify(initialTheme.settings))
  );

  // History for Undo / Redo
  const [history, setHistory] = useState<Record<string, unknown>[]>([
    JSON.parse(JSON.stringify(initialTheme.settings)),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // UI state
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("settings");

  // Saved baseline state for reactive dirty detection
  const [lastSavedSettings, setLastSavedSettings] = useState<Record<string, unknown>>(() =>
    JSON.parse(JSON.stringify(initialTheme.settings))
  );
  const [lastSavedName, setLastSavedName] = useState(initialTheme.name);

  // Exact reactive dirty detection: true ONLY when normalized current state differs from normalized baseline
  const hasUnsavedChanges = useMemo(() => {
    const isNameChanged = themeName.trim() !== lastSavedName.trim();
    const currentNormalized = normalizeSettings(settings, themePackage);
    const baselineNormalized = normalizeSettings(lastSavedSettings, themePackage);
    const isSettingsChanged = !isDeepEqual(currentNormalized, baselineNormalized);
    return isNameChanged || isSettingsChanged;
  }, [themeName, settings, lastSavedName, lastSavedSettings, themePackage]);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const fallbackImages = useMemo<Record<string, string | null>>(() => ({
    logo: restaurant.logoUrl ?? null,
    cover: restaurant.coverUrl ?? null,
    hero_cover: restaurant.coverUrl ?? null,
    info_ambience: restaurant.coverUrl ?? null,
    splash_background: restaurant.coverUrl ?? null,
  }), [restaurant.logoUrl, restaurant.coverUrl]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toast state
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Live preview URL pointing to authorized preview mode
  const previewUrl = useMemo(() => {
    return `/preview/menu/${restaurant.slug}?preview_theme=${initialTheme.id}`;
  }, [restaurant.slug, initialTheme.id]);

  // Synchronize live preview iframe via postMessage
  const pushLiveUpdate = useCallback((newSettings: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      const cssVariables = sanitizeThemeForCss(newSettings);
      iframeRef.current.contentWindow.postMessage(
        {
          type: "DZMENU_THEME_PREVIEW_UPDATE",
          settings: newSettings,
          cssVariables,
        },
        window.location.origin
      );
    }
  }, []);

  // Update settings with history snapshot
  const updateSettings = useCallback(
    (newSettings: Record<string, unknown>) => {
      setSettings(newSettings);
      pushLiveUpdate(newSettings);

      // Record undo history (cap at 30 states)
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, JSON.parse(JSON.stringify(newSettings))].slice(-30);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [historyIndex, pushLiveUpdate]
  );

  const handleDynamicSettingChange = useCallback(
    (field: string, value: unknown) => {
      const updated = setNestedPath(settings, field, value);
      updateSettings(updated);
    },
    [settings, updateSettings]
  );

  // Staged File Uploads map: slotId -> { file: File, previewUrl: string }
  const stagedFilesRef = useRef<Record<string, { file: File; previewUrl: string }>>({});
  // Staged deletions map: array of URLs that were in DB and should be deleted from storage on save
  const stagedDeletionsRef = useRef<Set<string>>(new Set());

  // Clean up any un-saved staged blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const key of Object.keys(stagedFilesRef.current)) {
        const item = stagedFilesRef.current[key];
        if (item?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  const handleDynamicImageSlotChange = useCallback(
    (slotId: string, url: string | null, file?: File | null, framing?: any) => {
      if (file && url) {
        // If there was an old blob URL for this slot, revoke it
        if (stagedFilesRef.current[slotId]?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(stagedFilesRef.current[slotId].previewUrl);
        }
        stagedFilesRef.current[slotId] = { file, previewUrl: url };
      } else if (url === null) {
        // Reset/Remove
        if (stagedFilesRef.current[slotId]?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(stagedFilesRef.current[slotId].previewUrl);
        }
        delete stagedFilesRef.current[slotId];
        // If the original saved theme had a permanent storage image, queue it for deletion on save
        const initialVal = (lastSavedSettings.image_slots as Record<string, string | null> | undefined)?.[slotId];
        if (initialVal && initialVal.includes("supabase.co")) {
          stagedDeletionsRef.current.add(initialVal);
        }
      }

      let updated = setNestedPath(
        settings,
        `image_slots.${slotId}`,
        url
      );
      if (framing !== undefined) {
        updated = setNestedPath(
          updated,
          `image_framing.${slotId}`,
          framing
        );
      }
      updateSettings(updated);
    },
    [settings, lastSavedSettings, updateSettings]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetSettings = history[targetIndex];
      setHistoryIndex(targetIndex);
      setSettings(JSON.parse(JSON.stringify(targetSettings)));
      pushLiveUpdate(targetSettings);
    }
  }, [history, historyIndex, pushLiveUpdate]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetSettings = history[targetIndex];
      setHistoryIndex(targetIndex);
      setSettings(JSON.parse(JSON.stringify(targetSettings)));
      pushLiveUpdate(targetSettings);
    }
  }, [history, historyIndex, pushLiveUpdate]);

  // Save changes to database (with deferred upload execution)
  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges || saving) return;
    try {
      setSaving(true);

      let finalSettings = JSON.parse(JSON.stringify(settings));

      // 1. Process any pending staged file uploads
      const pendingSlotIds = Object.keys(stagedFilesRef.current);
      if (pendingSlotIds.length > 0) {
        for (const slotId of pendingSlotIds) {
          const staged = stagedFilesRef.current[slotId];
          if (!staged) continue;

          const formData = new FormData();
          formData.append("file", staged.file);
          formData.append("slotId", slotId);
          formData.append("themeId", initialTheme.id);

          // If there was an existing permanent image from last saved settings, pass it to delete
          const previousPermanentUrl = (lastSavedSettings.image_slots as Record<string, string | null> | undefined)?.[slotId];
          if (previousPermanentUrl && previousPermanentUrl.includes("supabase.co")) {
            formData.append("previousUrl", previousPermanentUrl);
          }

          const res = await fetch("/api/restaurant/themes/upload", {
            method: "POST",
            body: formData,
          });

          const json = await res.json();
          if (!res.ok || !json.data?.url) {
            throw new Error(json.error || `Failed to upload image for slot ${slotId}`);
          }

          // Replace blob URL with permanent Supabase HTTPS URL
          finalSettings = setNestedPath(finalSettings, `image_slots.${slotId}`, json.data.url);

          // Clean up local blob object URL
          if (staged.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(staged.previewUrl);
          }
        }

        // Clear staged uploads map
        stagedFilesRef.current = {};
      }

      // 2. Process any queued storage deletions
      if (stagedDeletionsRef.current.size > 0) {
        for (const urlToDelete of stagedDeletionsRef.current) {
          try {
            await fetch("/api/restaurant/themes/upload", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: urlToDelete }),
            });
          } catch (delErr) {
            console.warn("[ThemeEditor] Storage deletion cleanup warning:", delErr);
          }
        }
        stagedDeletionsRef.current.clear();
      }

      // 3. Save final clean settings to database
      const res = await fetch(`/api/restaurant/themes/${initialTheme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: themeName,
          settings: finalSettings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save theme settings");

      const savedSettings = data.theme?.settings || finalSettings;
      const savedName = data.theme?.name || themeName;

      setSettings(savedSettings);
      setLastSavedSettings(JSON.parse(JSON.stringify(savedSettings)));
      setLastSavedName(savedName);
      pushLiveUpdate(savedSettings);
      showToast("Theme saved successfully!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }, [initialTheme.id, themeName, settings, lastSavedSettings, hasUnsavedChanges, saving, pushLiveUpdate]);

  // Hotkey support: Ctrl+S to save, Ctrl+Z to undo, Ctrl+Y to redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Push current settings when iframe finishes loading or announces ready
  const handleIframeLoad = () => {
    pushLiveUpdate(settingsRef.current);
    setTimeout(() => pushLiveUpdate(settingsRef.current), 150);
    setTimeout(() => pushLiveUpdate(settingsRef.current), 500);
  };

  // Handshake listener: when the preview iframe hydrates and requests live settings
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // 1. Origin validation: Only accept messages from same origin
      if (e.origin !== window.location.origin) return;

      // 2. Source validation: Only accept messages from the preview iframe window
      if (iframeRef.current?.contentWindow && e.source !== iframeRef.current.contentWindow) return;

      if (e.data?.type === "DZMENU_PREVIEW_READY") {
        pushLiveUpdate(settingsRef.current);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pushLiveUpdate]);

  // Browser-level beforeunload confirmation for page reloads / tab closures
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Client-side navigation exit confirmation for the back link
  const handleExitToLibrary = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved theme changes. If you leave now, your changes will be lost. Do you want to proceed?"
      );
      if (!confirmLeave) {
        e.preventDefault();
      }
    }
  };

  // Close more options dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-more-menu]")) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#18191B] text-[#E3E3E3] flex flex-col font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR (SHOPIFY CUSTOMIZER NAVIGATION)                          */}
      {/* ========================================================================= */}
      <header className="h-12 bg-[#1A1A1A] border-b border-[#2C2C2C] px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none">
        
        {/* Left: Back & Theme Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/themes"
            onClick={handleExitToLibrary}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            title="Exit to Themes library"
            aria-label="Exit to Themes library"
          >
            <ArrowLeft size={16} />
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none cursor-pointer"
            title={sidebarOpen ? "Hide controls panel" : "Show controls panel"}
            aria-label={sidebarOpen ? "Hide controls panel" : "Show controls panel"}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>

          <div className="h-4 w-px bg-[#333333] hidden sm:block" />

          {/* Theme Name & Status Pill */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className="bg-transparent hover:bg-[#242424] focus:bg-[#242424] text-xs sm:text-sm font-semibold text-white px-2 py-1 rounded border border-transparent hover:border-[#383838] focus:border-[#4B4B4B] focus:outline-none max-w-[140px] sm:max-w-[220px] transition"
              title="Click to rename theme"
            />

            {initialTheme.isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#008060]/20 text-[#29CC7A] border border-[#008060]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#29CC7A] animate-pulse" />
                <span>Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2A2A2A] text-gray-400 border border-[#3A3A3A]">
                Draft
              </span>
            )}
          </div>
        </div>

        {/* Center: Device Viewport Switcher (Desktop vs Mobile) */}
        <div className="flex items-center bg-[#242424] p-0.5 rounded-lg border border-[#333333]">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              device === "desktop"
                ? "bg-[#383838] text-white shadow-xs"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Desktop View (عرض شاشة الكمبيوتر)"
          >
            <Monitor size={14} />
            <span className="hidden md:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
              device === "mobile"
                ? "bg-[#383838] text-white shadow-xs"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Mobile View (عرض شاشة الجوال)"
          >
            <Smartphone size={14} />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Undo, Redo, More & Save Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A2A2A] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>

          <button
            type="button"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A2A2A] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={15} />
          </button>

          {/* More options dropdown */}
          <div className="relative" data-more-menu>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2A2A2A] transition cursor-pointer"
              title="More options"
            >
              <MoreHorizontal size={16} />
            </button>

            <AnimatePresence>
              {moreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 mt-1.5 w-48 bg-[#242424] border border-[#383838] rounded-xl shadow-2xl p-1 z-50 text-xs text-gray-300"
                >
                  <a
                    href={
                      typeof window !== "undefined" &&
                      (window.location.hostname === "localhost" ||
                        window.location.hostname.endsWith(".localhost"))
                        ? `http://${restaurant.slug}.localhost:3000`
                        : `https://${restaurant.slug}.dzmenu.com`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white transition"
                  >
                    <ExternalLink size={13} className="text-gray-400" />
                    <span>View live menu</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                      showToast("Theme JSON copied to clipboard");
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#333333] hover:text-white text-left transition"
                  >
                    <Copy size={13} className="text-gray-400" />
                    <span>Copy configuration</span>
                  </button>

                  <div className="h-px bg-[#333333] my-1" />

                  <div className="px-3 py-1.5 text-[11px] text-gray-500">
                    Preset: <span className="capitalize text-gray-300">{initialTheme.presetId}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Prominent Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              hasUnsavedChanges
                ? "bg-[#008060] hover:bg-[#006E52] active:bg-[#005B43] text-white ring-1 ring-[#29CC7A]/40 shadow-emerald-950/20 cursor-pointer"
                : "bg-[#25272A] text-gray-500 border border-[#33353A] cursor-not-allowed opacity-60"
            }`}
            title={hasUnsavedChanges ? "Save changes (Ctrl+S)" : "No changes to save"}
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={14} className={hasUnsavedChanges ? "text-white" : "text-gray-500"} />
            )}
            <span>{saving ? "Saving..." : "Save"}</span>
            {hasUnsavedChanges && !saving && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE (SIDEBAR + LIVE PREVIEW CANVAS)                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ======================================================================= */}
        {/* LEFT PANEL: SHOPIFY-STYLE CUSTOMIZATION SETTINGS                       */}
        {/* ======================================================================= */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full bg-[#1F2022] border-r border-[#2C2C2C] flex flex-col shrink-0 z-20 overflow-hidden"
            >
              {/* Sidebar Tabs */}
              <div className="h-10 bg-[#1A1A1A] border-b border-[#2C2C2C] px-2 flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    activeTab === "settings"
                      ? "bg-[#282828] text-white shadow-2xs"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Sliders size={13} />
                  <span>Theme settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sections")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    activeTab === "sections"
                      ? "bg-[#282828] text-white shadow-2xs"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Layers size={13} />
                  <span>Sections</span>
                </button>
              </div>

              {/* Sidebar Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-gray-300 select-text">
                {activeTab === "settings" ? (
                  themePackage?.editorControls ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#2D2E30]">
                        <div className="flex items-center gap-2 text-white font-bold tracking-tight">
                          <Palette size={14} className="text-[#29CC7A]" />
                          <span>{themePackage.manifest.name} Customizer (V2)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          V2 Engine
                        </span>
                      </div>

                      <DynamicControlsEngine
                        groups={themePackage.editorControls}
                        settings={settings as unknown as Record<string, unknown>}
                        imageSlots={
                          ((settings as unknown as Record<string, unknown>)
                            .image_slots as Record<string, string | null>) || {}
                        }
                        fallbackImages={fallbackImages}
                        onSettingChange={handleDynamicSettingChange}
                        onImageSlotChange={handleDynamicImageSlotChange}
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-white/40 text-xs">
                      <span className="w-5 h-5 border-2 border-white/20 border-t-amber-500 rounded-full animate-spin inline-block mb-3" />
                      <p>Loading theme customizer controls...</p>
                    </div>
                  )
                ) : (
                  /* ----------------------------------------------------------- */
                  /* SECTIONS & ARCHITECTURE TAB (V2)                            */
                  /* ----------------------------------------------------------- */
                  <div className="space-y-4">
                    <div>
                      <div className="text-white font-bold tracking-tight">
                        {themePackage?.manifest.name || "Theme"} Architecture
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                        Modular presentation templates and capabilities configured for this theme.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      {[
                        {
                          id: "splash",
                          name: "Splash / Loading Screen",
                          subtitle: "Brand intro & artisan atmosphere",
                          mode: themePackage?.manifest.capabilities.splash?.defaultMode || "fullscreen_page",
                          supported: themePackage?.manifest.capabilities.splash?.supported ?? false,
                        },
                        {
                          id: "main",
                          name: "Main Menu Presentation",
                          subtitle: "Categories, dishes & hero sections",
                          mode: themePackage?.manifest.capabilities.main?.defaultMode || "inlined",
                          supported: true,
                        },
                        {
                          id: "item",
                          name: "Dish Detail Modal / Sheet",
                          subtitle: "Ingredients, allergens & full dish artwork",
                          mode: themePackage?.manifest.capabilities.item?.defaultMode || "bottom_sheet",
                          supported: themePackage?.manifest.capabilities.item?.supported ?? true,
                        },
                      ].map((s) => (
                        <div
                          key={s.id}
                          className="bg-[#18191B] p-3 rounded-xl border border-[#2D2E30] flex items-center justify-between hover:border-[#3D3E42] transition"
                        >
                          <div>
                            <div className="font-semibold text-white">{s.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {s.subtitle} • <span className="font-mono text-amber-400/80">{s.mode}</span>
                            </div>
                          </div>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              s.supported ? "bg-emerald-400 shadow-xs shadow-emerald-400/50" : "bg-gray-600"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ======================================================================= */}
        {/* CENTER / RIGHT AREA: LIVE PREVIEW CANVAS (DESKTOP & MOBILE VIEWS)      */}
        {/* ======================================================================= */}
        <main className="flex-1 bg-[#121315] flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden relative">
          
          {/* Subtle Studio Grid Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(#26282B_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Device Mockup Frame (Single Persistent Iframe across Desktop & Mobile) */}
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className={`relative flex flex-col transition-all duration-300 ${
                device === "desktop"
                  ? "w-full max-w-[1180px] h-full max-h-[880px] bg-[#1E1F22] rounded-xl border border-[#333538] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
                  : "w-[390px] h-[94vh] max-h-[844px] bg-[#1E1F22] rounded-[52px] p-3 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08),0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#3D4046]"
              }`}
            >
              {/* Desktop Browser Window Header (visible in Desktop mode) */}
              {device === "desktop" && (
                <div className="h-9 bg-[#1E1F22] border-b border-[#2D2E30] px-3.5 flex items-center justify-between shrink-0 select-none">
                  {/* Traffic Dots */}
                  <div className="flex items-center gap-1.5 w-16">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ED6A5E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F5BF4F]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#62C554]" />
                  </div>

                  {/* Browser Address Bar Pill */}
                  <div className="flex-1 max-w-sm mx-auto">
                    <div className="bg-[#141517] border border-[#2D2E30] rounded-md px-3 py-1 text-[11px] text-gray-400 font-mono text-center truncate flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span suppressHydrationWarning>
                        {isMounted &&
                        typeof window !== "undefined" &&
                        (window.location.hostname === "localhost" ||
                          window.location.hostname.endsWith(".localhost"))
                          ? `${restaurant.slug}.localhost:3000`
                          : `${restaurant.slug}.dzmenu.com`}
                      </span>
                    </div>
                  </div>

                  <div className="w-16 flex justify-end">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-gray-400 hover:text-white transition"
                      title="Open preview in new tab"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}

              {/* Mobile Dynamic Island (visible in Mobile mode) */}
              {device === "mobile" && (
                <div className="absolute top-5 inset-x-0 mx-auto w-24 h-6 bg-black rounded-full z-30 flex items-center justify-end px-2.5 shadow-md pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222]" />
                </div>
              )}

              {/* Persistent Screen Container & Iframe (Never unmounts on device switch) */}
              <div
                className={`flex-1 w-full h-full relative overflow-hidden ${
                  device === "desktop"
                    ? "bg-black/40"
                    : "rounded-[42px] bg-black border border-white/5"
                }`}
              >
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  onLoad={handleIframeLoad}
                  className="w-full h-full border-0 bg-transparent"
                  title="Live Menu Preview"
                />
              </div>

              {/* Mobile Home Indicator Line (visible in Mobile mode) */}
              {device === "mobile" && (
                <div className="absolute bottom-4 inset-x-0 mx-auto w-32 h-1 bg-white/25 rounded-full pointer-events-none" />
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-14 right-6 z-50 flex items-center gap-2 px-4 py-2.5 text-white text-xs font-semibold rounded-lg shadow-xl ${
              toast.type === "error" ? "bg-red-600" : "bg-[#008060]"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle size={15} />
            ) : (
              <Check size={15} className="text-white" />
            )}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
