"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  QrCode,
  Download,
  Printer,
  Sparkles,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Eye,
  Sliders,
  Store,
  Layers,
  Palette,
  Image as ImageIcon,
  Type,
  TrendingUp,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import type { QrStudioSettings } from "@/types/qr-studio";
import { DEFAULT_QR_SETTINGS } from "@/types/qr-studio";
import type { QrAnalyticsSummary } from "@/types/analytics";
import { generateQrSvg, generateQrPngDataUrl, downloadFile } from "@/lib/qr/generator";
import { buildTrackedMenuUrl } from "@/lib/analytics/urls";
import { PrintableStandModal } from "@/components/qr-studio/PrintableStandModal";

// Brand Color Palette Presets
const COLOR_PRESETS = [
  { id: "black", label: "Obsidian Black", hex: "#18181B", bg: "#FFFFFF" },
  { id: "amber", label: "Amber Gold", hex: "#D97706", bg: "#FFFBEB" },
  { id: "emerald", label: "Emerald Green", hex: "#059669", bg: "#ECFDF5" },
  { id: "indigo", label: "Royal Indigo", hex: "#4F46E5", bg: "#EEF2FF" },
  { id: "rose", label: "Velvet Rose", hex: "#E11D48", bg: "#FFF1F2" },
];

const CTA_PRESETS = [
  "امسح لعرض القائمة • Scan for Menu",
  "امسح واطلب من طاولتك • Scan to Order",
  "قائمة الطعام الرقمية • Digital Menu",
  "Scan Me for Specials 🍽️",
];

export default function QrStudioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Restaurant & Settings State
  const [restaurant, setRestaurant] = useState<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    wifiSsid?: string;
    wifiPassword?: string;
  }>({
    id: "",
    name: "My Restaurant",
    slug: "salem",
    logoUrl: null,
  });

  const [settings, setSettings] = useState<QrStudioSettings>(DEFAULT_QR_SETTINGS);
  const [analytics, setAnalytics] = useState<QrAnalyticsSummary | null>(null);

  // QR Preview Generation State
  const [qrSvgString, setQrSvgString] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"style" | "table" | "stand">("style");
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Base URL calculation (Subdomain vs Localhost)
  const subdomainBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:3000";
    const host = window.location.host;
    const protocol = window.location.protocol;

    if (host.includes("localhost")) {
      return `${protocol}//${restaurant.slug}.localhost:3000`;
    }
    // Production custom domain or subdomain
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "dzmenu.com";
    return `${protocol}//${restaurant.slug}.${rootDomain}`;
  }, [restaurant.slug]);

  // Universal QR Code URL (Instant 302 Bridge to clean /)
  const currentQrTrackedUrl = useMemo(() => {
    return `${subdomainBaseUrl}/qr`;
  }, [subdomainBaseUrl]);

  // Share link (with ?src=share attribution)
  const shareTrackedUrl = useMemo(() => {
    return buildTrackedMenuUrl({
      baseUrl: subdomainBaseUrl,
      source: "share",
    });
  }, [subdomainBaseUrl]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, analyticsRes] = await Promise.all([
        fetch("/api/restaurant/qr/settings"),
        fetch("/api/restaurant/analytics/qr"),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.restaurant) {
          setRestaurant(sData.restaurant);
          
          // Check if local cache has draft customizations
          const cacheKey = `dz_qr_studio_draft_${sData.restaurant.id}`;
          const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setSettings((prev) => ({ ...prev, ...parsed }));
            } catch {
              if (sData.settings) setSettings(sData.settings);
            }
          } else if (sData.settings) {
            setSettings(sData.settings);
          }
        }
      }

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        if (aData.analytics) setAnalytics(aData.analytics);
      }
    } catch (err) {
      console.error("Error loading QR studio data:", err);
      showToast("Failed to load QR Studio data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync settings to client-side localStorage cache on every change
  useEffect(() => {
    if (!restaurant.id || loading) return;
    try {
      localStorage.setItem(`dz_qr_studio_draft_${restaurant.id}`, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, restaurant.id, loading]);

  // Regenerate live SVG preview when settings or URL changes
  useEffect(() => {
    let isMounted = true;
    async function updateSvg() {
      if (!currentQrTrackedUrl) return;
      try {
        const svg = await generateQrSvg(currentQrTrackedUrl, settings, restaurant.logoUrl);
        if (isMounted) setQrSvgString(svg);
      } catch (e) {
        console.warn("Could not generate QR preview:", e);
      }
    }
    updateSvg();
    return () => {
      isMounted = false;
    };
  }, [currentQrTrackedUrl, settings, restaurant.logoUrl]);

  // Save QR Settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/restaurant/qr/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      showToast("QR Studio settings saved!");
    } catch (err: any) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Download High-Res PNG
  const handleDownloadPng = async () => {
    try {
      const dataUrl = await generateQrPngDataUrl(
        currentQrTrackedUrl,
        settings,
        restaurant.logoUrl,
        2048
      );
      const filename = `${restaurant.slug}-qr-code${
        settings.tableMode === "table" ? `-table-${settings.tableNumber}` : ""
      }.png`;
      downloadFile(dataUrl, filename);
      showToast("High-resolution PNG downloaded!");
    } catch (e) {
      showToast("Failed to download PNG", "error");
    }
  };

  // Download Scalable Vector SVG
  const handleDownloadSvg = async () => {
    try {
      const svg = await generateQrSvg(currentQrTrackedUrl, settings, restaurant.logoUrl);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const filename = `${restaurant.slug}-qr-code.svg`;
      downloadFile(url, filename);
      URL.revokeObjectURL(url);
      showToast("Vector SVG downloaded!");
    } catch (e) {
      showToast("Failed to download SVG", "error");
    }
  };

  // Copy share link
  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareTrackedUrl);
      setCopiedLink(true);
      showToast("Share link copied with attribution tracking (?src=share)");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const totalVisits = analytics?.totalVisits || 0;
  const qrPct = totalVisits > 0 ? Math.round(((analytics?.qrVisits || 0) / totalVisits) * 100) : 0;
  const sharePct = totalVisits > 0 ? Math.round(((analytics?.shareVisits || 0) / totalVisits) * 100) : 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === "error" ? "bg-red-600" : "bg-zinc-900"
          }`}
        >
          <span>{toast.text}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          1. HEADER BAR
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
            <QrCode size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                QR Code Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                Print &amp; Share
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Customize dynamic table QR codes, logo embedding, and printable stand templates
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>PNG (2048px)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Vector SVG</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Stands</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. ANALYTICS ATTRIBUTION SUMMARY (QR Scans vs Share Links)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Visits */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Menu Visits</span>
            <Eye size={16} className="text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {analytics?.totalVisits || 0}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              +{analytics?.todayTotalVisits || 0} today
            </span>
          </div>
        </div>

        {/* QR Attributed Scans */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 bg-amber-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-bold uppercase tracking-wider">Table QR Scans</span>
            <QrCode size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
              {analytics?.qrVisits || 0}
            </span>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {qrPct}% of traffic
            </span>
          </div>
        </div>

        {/* Share Link Visits */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 bg-blue-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-xs font-bold uppercase tracking-wider">Share Link Visits</span>
            <Share2 size={16} className="text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
              {analytics?.shareVisits || 0}
            </span>
            <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              {sharePct}% of traffic
            </span>
          </div>
        </div>

        {/* Direct Visits */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Direct / Organic</span>
            <TrendingUp size={16} className="text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {analytics?.directVisits || 0}
            </span>
            <span className="text-xs font-bold text-gray-400">
              bookmarks &amp; typed
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. STUDIO WORKSPACE (Split Grid: Left Customizer / Right Live Preview)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls Tab Switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("style")}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "style"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Palette size={14} />
              <span>Style &amp; Brand Colors</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("table")}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "table"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Layers size={14} />
              <span>Table Range Generator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stand")}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "stand"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Type size={14} />
              <span>Stand Card &amp; Wi-Fi</span>
            </button>
          </div>

          {/* TAB 1: STYLE & COLORS */}
          {activeTab === "style" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-6 shadow-2xs">
              {/* Color Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Color Presets (Brand Palette)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          foregroundColor: p.hex,
                          backgroundColor: p.bg,
                        }))
                      }
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        settings.foregroundColor.toLowerCase() === p.hex.toLowerCase()
                          ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="text-xs font-bold text-gray-800 truncate">{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={settings.foregroundColor}
                      onChange={(e) => setSettings((s) => ({ ...s, foregroundColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0 bg-transparent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-700">QR Code Color</span>
                      <span className="text-[10px] text-gray-400 uppercase">{settings.foregroundColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings((s) => ({ ...s, backgroundColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0 bg-transparent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-700">Background Color</span>
                      <span className="text-[10px] text-gray-400 uppercase">{settings.backgroundColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corner Style */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Corner Eye Shape
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "rounded", label: "Smooth Rounded" },
                    { id: "extra-rounded", label: "Modern Circular" },
                    { id: "square", label: "Classic Square" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, cornerStyle: c.id as any }))}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        settings.cornerStyle === c.id
                          ? "border-amber-500 bg-amber-50/30 text-amber-950 ring-2 ring-amber-500/20"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Center Logo Shield */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Center Restaurant Logo
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Embeds your brand icon with high-contrast safety shield
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.logoEnabled}
                      onChange={(e) => setSettings((s) => ({ ...s, logoEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>

                {settings.logoEnabled && (
                  <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {restaurant.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={restaurant.logoUrl}
                        alt="Logo"
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                        🍽️
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Logo Size</span>
                        <span>{settings.logoSize}%</span>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={30}
                        value={settings.logoSize}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, logoSize: parseInt(e.target.value, 10) }))
                        }
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TABLE RANGE GENERATOR */}
          {activeTab === "table" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Table Numbering for Print
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, tableMode: "single" }))}
                    className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                      settings.tableMode === "single"
                        ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs font-black text-gray-900">Single Stand Card</div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Prints one clean universal QR stand card without table numbers.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, tableMode: "table" }))}
                    className={`p-3.5 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                      settings.tableMode === "table"
                        ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs font-black text-gray-900">Numbered Table Cards</div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Batch prints Table #1 to Table #N with visual table labels.
                    </p>
                  </button>
                </div>
              </div>

              {settings.tableMode === "table" && (
                <div className="space-y-4 pt-3 border-t border-gray-100 bg-gray-50/60 p-4 rounded-xl border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Preview Table #</label>
                      <input
                        type="text"
                        value={settings.tableNumber}
                        onChange={(e) => setSettings((s) => ({ ...s, tableNumber: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:border-amber-500 focus:outline-none"
                        placeholder="e.g. 1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Total Tables to Print</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={settings.tableCount}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            tableCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    💡 All table cards encode the clean universal QR code, with distinct visual table labels (Table #1, Table #2...) printed for your staff and guests.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STAND CARD & WI-FI */}
          {activeTab === "stand" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 space-y-5 shadow-2xs">
              {/* CTA Text */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Print Call-To-Action Banner
                </label>
                <input
                  type="text"
                  value={settings.ctaText}
                  onChange={(e) => setSettings((s) => ({ ...s, ctaText: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-900 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Scan for Menu"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CTA_PRESETS.map((cta) => (
                    <button
                      key={cta}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, ctaText: cta }))}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition cursor-pointer"
                    >
                      {cta}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wi-Fi Integration */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                      Include Wi-Fi Details on Stand Card
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Displays Wi-Fi network and password at the bottom of the table stand
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.includeWifi}
                      onChange={(e) => setSettings((s) => ({ ...s, includeWifi: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>

                {settings.includeWifi && (
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">Wi-Fi Network (SSID)</label>
                      <input
                        type="text"
                        value={settings.wifiSsid || restaurant.wifiSsid || ""}
                        onChange={(e) => setSettings((s) => ({ ...s, wifiSsid: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-900"
                        placeholder="e.g. Bear_Coffee_Guest"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">Wi-Fi Password</label>
                      <input
                        type="text"
                        value={settings.wifiPassword || restaurant.wifiPassword || ""}
                        onChange={(e) => setSettings((s) => ({ ...s, wifiPassword: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-900"
                        placeholder="e.g. coffee2026"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <span className="text-xs text-gray-500">
              Save changes to keep this QR styling default for all prints
            </span>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Customization"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME QR STAND PREVIEW (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Stand Display Card */}
          <div className="bg-gradient-to-b from-[#FAF9F5] to-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 shadow-lg shadow-gray-200/50 flex flex-col items-center justify-between text-center relative min-h-[500px]">
            {/* Top Restaurant Branding */}
            <div className="space-y-2 pt-1">
              {restaurant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-14 h-14 rounded-2xl object-cover mx-auto shadow-xs border border-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-2xl mx-auto shadow-xs">
                  🍽️
                </div>
              )}
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                {restaurant.name}
              </h3>
            </div>

            {/* Live Vector QR Code Rendering */}
            <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-md max-w-[240px] w-full aspect-square flex items-center justify-center relative my-4 group">
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvgString }}
              />
            </div>

            {/* CTA & Table Badge */}
            <div className="w-full space-y-2.5 pb-1">
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-black uppercase tracking-wider">
                {settings.ctaText || "امسح لعرض القائمة • Scan for Menu"}
              </div>

              {settings.tableMode === "table" && (
                <div className="text-xs font-black text-gray-800 bg-gray-100 py-1 px-3 rounded-lg border border-gray-200 inline-block">
                  طاولة / Table #{settings.tableNumber}
                </div>
              )}

              {settings.includeWifi && (settings.wifiSsid || restaurant.wifiSsid) && (
                <div className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 p-2 rounded-xl flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1 font-semibold">
                    <Wifi size={13} className="text-amber-500" />
                    <span>{settings.wifiSsid || restaurant.wifiSsid}</span>
                  </span>
                  {(settings.wifiPassword || restaurant.wifiPassword) && (
                    <span className="text-gray-400">
                      Pass: <strong className="text-gray-800">{settings.wifiPassword || restaurant.wifiPassword}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Direct Tracked Links Box */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-900">Attributed Links</span>
              <a
                href={currentQrTrackedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                <span>Test Scan</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* QR Encoded URL */}
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">
                  Encoded in QR Code (Table Scan)
                </span>
                <span className="text-gray-700 font-mono text-[11px] truncate block">
                  {currentQrTrackedUrl}
                </span>
              </div>
            </div>

            {/* Share Link */}
            <div className="p-2.5 bg-blue-50/40 rounded-xl border border-blue-100 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-blue-500 block uppercase">
                  Share Link (?src=share)
                </span>
                <span className="text-blue-950 font-mono text-[11px] truncate block">
                  {shareTrackedUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="p-2 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition cursor-pointer shrink-0"
                title="Copy share link"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Stand Modal */}
      <PrintableStandModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        restaurant={restaurant}
        settings={settings}
        subdomainBaseUrl={subdomainBaseUrl}
      />
    </div>
  );
}
