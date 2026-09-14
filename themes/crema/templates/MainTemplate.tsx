"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Heart,
  X,
  MapPin,
  Phone,
  Clock,
  Wifi,
  Copy,
  Check,
  Share2,
  ChevronDown,
  ChevronUp,
  Navigation,
  Sparkles,
  Star,
  Crown,
  Tag,
} from "lucide-react";
import type { ThemeRenderContext } from "@/types/theme-contract";
import { buildTrackedMenuUrl } from "@/lib/analytics/urls";
import {
  filterCategoriesWithSearch,
  getCategorySearchCounts,
} from "@/lib/search/fuzzy-search";
import { getFramingTransformStyle, getSlotFraming } from "@/lib/utils";
import { FoodPatternPlaceholder } from "@/components/ui/FoodPatternPlaceholder";

interface CremaBadgeConfig {
  label: string;
  renderIcon: (className?: string) => React.ReactNode;
}

const CREMA_BADGE_CONFIG: Record<string, CremaBadgeConfig> = {
  CHEF_PICK: {
    label: "Chef's Selection",
    renderIcon: (cls = "w-3 h-3 text-amber-600") => <Sparkles className={cls} />,
  },
  BEST_SELLER: {
    label: "House Favorite",
    renderIcon: (cls = "w-3 h-3 fill-amber-500 text-amber-500") => <Star className={cls} />,
  },
  NEW: {
    label: "New Creation",
    renderIcon: (cls = "w-3 h-3 text-rose-500") => <Sparkles className={cls} />,
  },
  SIGNATURE: {
    label: "Maison Signature",
    renderIcon: (cls = "w-3 h-3 text-amber-700") => <Crown className={cls} />,
  },
  SPECIAL_OFFER: {
    label: "Curated Offer",
    renderIcon: (cls = "w-3 h-3 text-emerald-700") => <Tag className={cls} />,
  },
};

export function CremaMainTemplate({
  menu,
  settings,
  imageSlots,
  navigation,
  isEditorPreview = false,
}: ThemeRenderContext) {
  // 1. Settings & Customizations
  const splash = (settings.splash as Record<string, unknown>) || {};
  const splashEnabled = splash.enabled !== false;
  const splashTitle = (splash.title as string) || "Sweet Moments";
  const splashSubtitle = (splash.subtitle as string) || "DESSERTS & CAFÉ";
  const autoDismissSec =
    typeof splash.auto_dismiss_seconds === "number" ? splash.auto_dismiss_seconds : 2.5;

  const greeting = (settings.greeting as Record<string, unknown>) || {};
  const greetingTitle = (greeting.title as string) || "Hello";
  const morningSubtitle =
    (greeting.morning_subtitle as string) ||
    (greeting.subtitle as string) ||
    "Good Morning";
  const eveningSubtitle =
    (greeting.evening_subtitle as string) || "Good Evening";

  // Dynamic Timezone calculation (Algeria Africa/Algiers timezone UTC+1)
  // Morning: 05:00 - 11:59 | Evening/Afternoon: 12:00 - 04:59
  const isMorning = useMemo(() => {
    try {
      const hourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Algiers",
        hour: "numeric",
        hour12: false,
      }).format(new Date());
      const hour = parseInt(hourStr, 10);
      return hour >= 5 && hour < 12;
    } catch {
      const h = new Date().getHours();
      return h >= 5 && h < 12;
    }
  }, []);

  const activeGreetingSubtitle = isMorning ? morningSubtitle : eveningSubtitle;

  const footer = (settings.footer as Record<string, unknown>) || {};
  const showInfoCard = footer.show_info_card !== false;
  const showDirections = footer.show_directions !== false;
  const directionsButtonText = (footer.directions_button_text as string) || "Get Directions";
  const showSocialLinks = footer.show_social_links !== false;
  const showPhone = footer.show_phone !== false;
  const showWhatsapp = footer.show_whatsapp !== false;
  const showInstagram = footer.show_instagram !== false;
  const showTiktok = footer.show_tiktok !== false;
  const showFacebook = footer.show_facebook !== false;
  const showShare = footer.show_share !== false;
  const showOperatingHours = footer.show_operating_hours !== false;
  const showWifiInfo = footer.show_wifi_info !== false;

  const layout = (settings.layout as Record<string, unknown>) || {};
  const showSearch = layout.show_search !== false;
  const cardRadius = typeof layout.card_radius === "number" ? layout.card_radius : 22;

  // 2. Splash Screen State (Visible from frame 0 on customer load/refresh, then smoothly auto-dismisses or dismisses on tap)
  const [showSplashOverlay, setShowSplashOverlay] = useState<boolean>(() => splashEnabled);
  const [splashFading, setSplashFading] = useState<boolean>(false);

  useEffect(() => {
    if (!splashEnabled || !showSplashOverlay) return;

    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => {
        setShowSplashOverlay(false);
      }, 500);
    }, autoDismissSec * 1000);

    return () => clearTimeout(timer);
  }, [splashEnabled, showSplashOverlay, autoDismissSec]);

  const dismissSplash = () => {
    setSplashFading(true);
    setTimeout(() => {
      setShowSplashOverlay(false);
    }, 350);
  };

  // 3. Favorites / Likes System (Heart Button)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`dzmenu_crema_favs_${menu.restaurant.id}`);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [menu.restaurant.id]);

  const toggleFavorite = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem(`dzmenu_crema_favs_${menu.restaurant.id}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // 4. Footer Interactive State (Weekly Hours & Copy Feedback)
  const [showWeeklyHours, setShowWeeklyHours] = useState<boolean>(false);
  const [copiedWifi, setCopiedWifi] = useState<boolean>(false);
  const [copiedMenuLink, setCopiedMenuLink] = useState<boolean>(false);

  const copyWifiPassword = async (pwd: string) => {
    if (!pwd || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleShareMenu = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = buildTrackedMenuUrl({ source: "share" });
    if (navigator.share) {
      try {
        await navigator.share({
          title: menu.restaurant.name,
          text: menu.restaurant.tagline || `Menu for ${menu.restaurant.name}`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedMenuLink(true);
      setTimeout(() => setCopiedMenuLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const mapsUrl =
    menu.restaurant.contact.googleMapsUrl ||
    (menu.restaurant.contact.address || menu.restaurant.contact.city
      ? `https://maps.google.com/?q=${encodeURIComponent(
          `${menu.restaurant.contact.address || ""} ${
            menu.restaurant.contact.city || ""
          }`.trim()
        )}`
      : null);

  const activeCategories = useMemo(() => {
    return menu.categories.filter((c) => c.isActive);
  }, [menu.categories]);

  // 5. Search & Categories Filter (Intelligent categorized search with dynamic badges)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => activeCategories[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string | null>(null);

  // Auto reset category filter when search query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchCategoryFilter(null);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, selectedCategoryId]);

  const searchCounts = useMemo(() => {
    return getCategorySearchCounts(activeCategories, searchQuery);
  }, [activeCategories, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const filteredCategories = useMemo(() => {
    return filterCategoriesWithSearch(
      activeCategories,
      searchQuery,
      selectedCategoryId,
      searchCategoryFilter
    );
  }, [activeCategories, selectedCategoryId, searchQuery, searchCategoryFilter]);

  const totalVisibleItems = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredCategories]);

  // Client-uploaded artwork & Smart Logo Fallback
  const customSplashBg = imageSlots.splash_background;
  const activeLogo = imageSlots.logo || menu.restaurant.logoUrl;

  const splashFraming = getSlotFraming(settings, "splash_background");
  const logoFraming = getSlotFraming(settings, "logo");

  const { contact, schedule, wifi } = menu.restaurant;
  const hasContactOrInfo =
    Boolean(contact.phone) ||
    Boolean(contact.whatsapp) ||
    Boolean(contact.instagram) ||
    Boolean(contact.tiktok) ||
    Boolean(contact.facebook) ||
    Boolean(contact.address) ||
    Boolean(contact.city) ||
    Boolean(mapsUrl) ||
    Boolean(wifi.ssid) ||
    (schedule.operatingHours && schedule.operatingHours.length > 0);

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden relative select-none bg-[var(--dz-theme-background,#FFF6F8)] text-[var(--dz-theme-text,#381B26)]">
      {/* ========================================================================= */}
      {/* PAGE 1: FULLSCREEN LOADING / SPLASH SCREEN                               */}
      {/* ========================================================================= */}
      {showSplashOverlay && (
        <div
          onClick={dismissSplash}
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${
            splashFading ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          } bg-[var(--dz-theme-background,#FFF6F8)] text-white overflow-hidden`}
        >
          {/* Client-Uploaded Background (or Soft Pastel Artisan Canvas) */}
          {customSplashBg ? (
            <div className="absolute inset-0 z-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={customSplashBg}
                alt="Splash Background"
                className="w-full h-full object-cover animate-in fade-in duration-700"
                style={getFramingTransformStyle(splashFraming)}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/50" />
            </div>
          ) : (
            <div
              className="absolute inset-0 z-0 flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(to bottom, var(--dz-theme-splash-from), var(--dz-theme-splash-via), var(--dz-theme-splash-to))",
              }}
            >
              <div
                className="absolute w-80 h-80 rounded-full blur-3xl -top-10 -left-10 animate-pulse"
                style={{ backgroundColor: "var(--dz-theme-splash-glow1)" }}
              />
              <div
                className="absolute w-72 h-72 rounded-full blur-3xl -bottom-10 -right-10"
                style={{ backgroundColor: "var(--dz-theme-splash-glow2)" }}
              />
              {/* Subtle Polka / Blossom Grid Pattern */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: "radial-gradient(var(--dz-theme-primary) 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>
          )}

          {/* Centered Content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-xs animate-in zoom-in-95 duration-500">
            {/* Store Logo */}
            <div className="mb-3">
              {activeLogo ? (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 backdrop-blur-md shadow-xl ring-2 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    borderColor: "var(--dz-theme-border)",
                    boxShadow: "0 10px 25px var(--dz-theme-border)",
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeLogo}
                      alt={menu.restaurant.name}
                      className="w-full h-full object-cover bg-white"
                      style={getFramingTransformStyle(logoFraming)}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full backdrop-blur-md border flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--dz-theme-surface-raised)",
                    borderColor: "var(--dz-theme-border)",
                    boxShadow: "0 8px 25px var(--dz-theme-border)",
                  }}
                >
                  <Heart
                    className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm animate-pulse"
                    style={{
                      color: customSplashBg ? "#FFFFFF" : "var(--dz-theme-primary)",
                      fill: customSplashBg ? "#FFFFFF" : "var(--dz-theme-primary)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Small Heart Icon directly above title */}
            <div className="mb-1.5">
              <Heart
                className="w-3.5 h-3.5 mx-auto opacity-90"
                style={{
                  color: customSplashBg ? "#FFFFFF" : "var(--dz-theme-primary)",
                  fill: customSplashBg ? "#FFFFFF" : "var(--dz-theme-primary)",
                }}
              />
            </div>

            {/* Customizable Title (Default: Sweet Moments) */}
            <h1
              className="text-3xl sm:text-4xl font-serif italic font-normal tracking-wide drop-shadow-md"
              style={{
                color: customSplashBg ? "#FFFFFF" : "var(--dz-theme-text)",
              }}
            >
              {splashTitle}
            </h1>

            {/* Customizable Subtitle (Default: DESSERTS & CAFÉ) */}
            <p
              className="text-[11px] sm:text-xs font-bold tracking-[0.32em] uppercase mt-2 drop-shadow-sm"
              style={{
                color: customSplashBg ? "rgba(255, 255, 255, 0.9)" : "var(--dz-theme-muted)",
              }}
            >
              {splashSubtitle}
            </p>

            {/* Tap indicator */}
            <div className="mt-10 flex flex-col items-center gap-1.5 opacity-80">
              <div
                className="w-20 h-1 rounded-full overflow-hidden"
                style={{
                  backgroundColor: customSplashBg ? "rgba(255, 255, 255, 0.25)" : "var(--dz-theme-surface-raised)",
                }}
              >
                <div
                  className="w-full h-full rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--dz-theme-primary)" }}
                />
              </div>
              <span
                className="text-[10px] tracking-wider uppercase font-medium"
                style={{
                  color: customSplashBg ? "rgba(255, 255, 255, 0.9)" : "var(--dz-theme-muted)",
                }}
              >
                Tap to enter
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: MAIN MENU VIEW                                                    */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto pb-4 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="min-h-full flex flex-col justify-between">
          <div>
            {/* 1. Centered Greeting: Hello / Good Morning with Live Status Pill */}
        <div className="pt-7 pb-1 text-center px-6 animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
          <h1
            className="text-3xl sm:text-4xl font-serif font-bold tracking-tight transition-colors duration-300"
            style={{ color: "var(--dz-theme-text)" }}
          >
            {greetingTitle}
          </h1>
          <p
            className="text-sm sm:text-base font-serif italic mt-0.5 transition-colors duration-300"
            style={{ color: "var(--dz-theme-accent)" }}
          >
            {activeGreetingSubtitle}
          </p>

          {/* Live Status Pill: 🟢 Open Now • Closes / Operating Hours • Location */}
          <div className="mt-2.5 flex items-center justify-center">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm shadow-xs transition-all duration-200"
              style={{
                backgroundColor: "var(--dz-theme-surface-raised)",
                borderColor: "var(--dz-theme-border)",
                color: "var(--dz-theme-text)",
              }}
            >
              {/* Pulsing Status Indicator Dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    menu.restaurant.schedule.isOpenNow
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    menu.restaurant.schedule.isOpenNow
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
              </span>

              <span className="font-medium">
                {menu.restaurant.schedule.isOpenNow ? "Open Now" : "Closed"}
              </span>

              {menu.restaurant.schedule.formattedHours && (
                <>
                  <span className="opacity-35 font-normal">•</span>
                  <span className="opacity-75 font-normal">
                    {menu.restaurant.schedule.formattedHours}
                  </span>
                </>
              )}

              {menu.restaurant.contact.city && (
                <>
                  <span className="opacity-35 font-normal">•</span>
                  <span className="opacity-75 font-normal inline-flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-[var(--dz-theme-accent)]" />
                    {menu.restaurant.contact.city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Search Pill with Micro-Focus Glow */}
        {showSearch && (
          <div className="px-6 mt-3 animate-in fade-in slide-in-from-top-1 duration-600 fill-mode-both">
            <div className="relative group">
              <Search
                className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-75 group-focus-within:opacity-100 group-focus-within:scale-110 transition-all duration-200"
                style={{ color: "var(--dz-theme-accent)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pastries & coffee..."
                className="w-full pl-11 pr-10 py-2.5 rounded-full text-xs transition-all duration-200 outline-none focus:outline-none focus:ring-1 focus:ring-[var(--dz-theme-accent)]/40 focus:border-[var(--dz-theme-accent)]"
                style={{
                  backgroundColor: "var(--dz-theme-search-bg)",
                  borderColor: "var(--dz-theme-search-border)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  color: "var(--dz-theme-text)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-xs opacity-60 hover:opacity-100 transition-opacity active:scale-90 cursor-pointer"
                  style={{ color: "var(--dz-theme-muted)" }}
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Categories Navigation (Dynamic Theme Pills + Live Search Count Badges) */}
        <div className="px-5 mt-5">
          {isSearching ? (
            <div className="flex items-center justify-between mb-2.5">
              <h4
                className="text-base font-serif font-bold tracking-tight"
                style={{ color: "var(--dz-theme-text)" }}
              >
                Search Results
              </h4>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--dz-theme-search-bg)",
                  borderColor: "var(--dz-theme-search-border)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  color: "var(--dz-theme-muted)",
                }}
              >
                {searchCounts.totalMatches}{" "}
                {searchCounts.totalMatches === 1 ? "dish found" : "dishes found"}
              </span>
            </div>
          ) : (
            <h4
              className="text-base font-serif font-bold mb-2.5 tracking-tight"
              style={{ color: "var(--dz-theme-text)" }}
            >
              Categories
            </h4>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden">
            {/* If searching: show 'All Results' pill */}
            {isSearching && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearchCategoryFilter(null)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer shrink-0 active:opacity-80 flex items-center gap-1.5 outline-none"
                style={{
                  backgroundColor:
                    searchCategoryFilter === null
                      ? "var(--dz-theme-pill-active-bg)"
                      : "var(--dz-theme-pill-inactive-bg)",
                  color:
                    searchCategoryFilter === null
                      ? "var(--dz-theme-pill-active-text)"
                      : "var(--dz-theme-pill-inactive-text)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor:
                    searchCategoryFilter === null
                      ? "var(--dz-theme-pill-active-bg)"
                      : "var(--dz-theme-pill-inactive-border)",
                  boxShadow: searchCategoryFilter === null ? "0 4px 14px var(--dz-theme-border)" : "none",
                }}
              >
                <span>All</span>
                <span className="opacity-80 font-normal">({searchCounts.totalMatches})</span>
              </button>
            )}

            {activeCategories.map((cat) => {
              const count = isSearching ? searchCounts.countsByCategoryId[cat.id] || 0 : 0;
              const active = isSearching
                ? searchCategoryFilter === cat.id
                : selectedCategoryId === cat.id;

              // In search mode: only dim or skip if 0 matches
              const isDisabled = isSearching && count === 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={isDisabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (isSearching) {
                      setSearchCategoryFilter(searchCategoryFilter === cat.id ? null : cat.id);
                    } else {
                      setSelectedCategoryId(cat.id);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 shrink-0 flex items-center gap-1.5 outline-none ${
                    isDisabled
                      ? "opacity-35 cursor-not-allowed"
                      : "cursor-pointer active:opacity-80"
                  }`}
                  style={{
                    backgroundColor: active
                      ? "var(--dz-theme-pill-active-bg)"
                      : "var(--dz-theme-pill-inactive-bg)",
                    color: active
                      ? "var(--dz-theme-pill-active-text)"
                      : "var(--dz-theme-pill-inactive-text)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: active
                      ? "var(--dz-theme-pill-active-bg)"
                      : "var(--dz-theme-pill-inactive-border)",
                    boxShadow: active ? "0 4px 14px var(--dz-theme-border)" : "none",
                  }}
                >
                  <span>{cat.name}</span>
                  {isSearching && (
                    <span className="opacity-80 text-[10px] font-normal">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. 2-Column Pastry Cards Grid (Native Mobile Touch Feel + Desktop Hover) */}
        <div className="px-5 mt-5">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16 px-4 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-2xl border"
                style={{
                  backgroundColor: "var(--dz-theme-search-bg)",
                  borderColor: "var(--dz-theme-search-border)",
                }}
              >
                🔍
              </div>
              <p className="text-xs font-bold" style={{ color: "var(--dz-theme-text)" }}>
                No dishes found for &quot;{searchQuery}&quot;
              </p>
              <p className="text-[11px] mt-1 opacity-70" style={{ color: "var(--dz-theme-muted)" }}>
                Try searching with a different keyword
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchCategoryFilter(null);
                }}
                className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: "var(--dz-theme-pill-active-bg)",
                  color: "var(--dz-theme-pill-active-text)",
                  borderColor: "var(--dz-theme-pill-active-bg)",
                }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="space-y-3">
                  {/* Category Section Divider (shown during search) */}
                  {isSearching && (
                    <div className="flex items-center gap-2 pt-1 pb-0.5">
                      <h5
                        className="text-xs font-serif font-bold tracking-wider uppercase"
                        style={{ color: "var(--dz-theme-accent)" }}
                      >
                        {cat.name}
                      </h5>
                      <div
                        className="flex-1 h-[1px] opacity-25"
                        style={{ backgroundColor: "var(--dz-theme-accent)" }}
                      />
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--dz-theme-search-bg)",
                          borderColor: "var(--dz-theme-search-border)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          color: "var(--dz-theme-muted)",
                        }}
                      >
                        {cat.items.length}
                      </span>
                    </div>
                  )}

                  {/* 2-Column Pastry Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {cat.items.map((item) => {
                      const isFav = Boolean(favorites[item.id]);

                      return (
                        <div
                          key={item.id}
                          onClick={() => navigation.goToItem(item.id)}
                          style={{
                            borderRadius: `${cardRadius}px`,
                            backgroundColor: "var(--dz-theme-surface)",
                            borderColor: "var(--dz-theme-border)",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                          }}
                          className="p-2.5 sm:p-3 border flex flex-col justify-between active:scale-[0.97] active:opacity-90 md:hover:shadow-xl md:hover:-translate-y-1 transition-all duration-200 ease-out cursor-pointer group select-none"
                        >
                          <div>
                            {/* Dish Photo */}
                            <div
                              style={{
                                borderRadius: `${Math.max(cardRadius - 6, 4)}px`,
                                backgroundColor: "var(--dz-theme-surface-raised)",
                                borderColor: "var(--dz-theme-border)",
                              }}
                              className="relative aspect-square w-full overflow-hidden mb-2.5 border"
                            >
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300 ease-out"
                                  style={getFramingTransformStyle(item.framing)}
                                />
                              ) : (
                                <FoodPatternPlaceholder altText={item.name} />
                              )}
                            </div>

                            {/* Luxury Boutique Eyebrow Tag (Above Title) */}
                            {item.badge && CREMA_BADGE_CONFIG[item.badge] && (
                              <div
                                className="flex items-center gap-1 text-[9.5px] sm:text-[10px] font-serif font-bold uppercase tracking-wider mb-1 line-clamp-1"
                                style={{ color: "var(--dz-theme-accent)" }}
                              >
                                {CREMA_BADGE_CONFIG[item.badge].renderIcon("w-2.5 h-2.5 shrink-0")}
                                <span className="truncate">{CREMA_BADGE_CONFIG[item.badge].label}</span>
                              </div>
                            )}

                            {/* Dish Title */}
                            <h5
                              className="text-xs sm:text-sm font-bold line-clamp-1"
                              style={{ color: "var(--dz-theme-text)" }}
                            >
                              {item.name}
                            </h5>

                            {/* Short Description / Tagline */}
                            {item.description ? (
                              <p
                                className="text-[10px] line-clamp-1 mt-0.5 font-normal"
                                style={{ color: "var(--dz-theme-muted)" }}
                              >
                                {item.description}
                              </p>
                            ) : (
                              <p
                                className="text-[10px] line-clamp-1 mt-0.5 opacity-70 font-normal"
                                style={{ color: "var(--dz-theme-muted)" }}
                              >
                                Fresh & Creamy
                              </p>
                            )}
                          </div>

                          {/* Price & Heart Like Button with Rock-Solid Center Alignment */}
                          <div
                            className="flex items-center justify-between gap-1.5 mt-2.5 pt-1.5 border-t"
                            style={{ borderColor: "var(--dz-theme-border)" }}
                          >
                            <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                              <span
                                className="text-xs sm:text-sm font-bold tracking-tight truncate"
                                style={{ color: "var(--dz-theme-price)" }}
                              >
                                {item.formattedPrice || `${Number(item.price).toLocaleString()} ${menu.restaurant.currency}`}
                              </span>
                              {item.hasActiveDiscount && item.formattedOriginalPrice && (
                                <span
                                  className="text-[10px] line-through font-medium truncate shrink-0"
                                  style={{ color: "var(--dz-theme-muted)" }}
                                >
                                  {item.formattedOriginalPrice}
                                </span>
                              )}
                            </div>

                            {/* Heart Like / Favorite Button */}
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(e, item.id)}
                              aria-label={isFav ? "Unlike" : "Like"}
                              className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center origin-center transition-transform duration-150 cursor-pointer border active:scale-75 md:hover:scale-110 select-none"
                              style={{
                                backgroundColor: isFav
                                  ? "var(--dz-theme-primary)"
                                  : "var(--dz-theme-surface-raised)",
                                color: isFav ? "#FFFFFF" : "var(--dz-theme-primary)",
                                borderColor: isFav
                                  ? "var(--dz-theme-primary)"
                                  : "var(--dz-theme-border)",
                                boxShadow: isFav ? "0 2px 10px var(--dz-theme-border)" : "none",
                              }}
                            >
                              <Heart
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 origin-center transition-colors duration-200"
                                style={{
                                  fill: isFav ? "#FFFFFF" : "transparent",
                                }}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Area: Artisan Divider & Luxury Restaurant Info Card (Pushed to bottom when content is short) */}
      {hasContactOrInfo && !isSearching && (
        <div className="mt-4">
          {/* Subtle separator before footer (Only shown when not searching and footer card is enabled) */}
          {!isSearching && showInfoCard && (
            <div className="flex items-center justify-center gap-3 px-10 my-2 opacity-35">
              <div
                className="h-[1px] flex-1"
                style={{
                  background:
                    "linear-gradient(to right, transparent, var(--dz-theme-border), var(--dz-theme-accent))",
                }}
              />
              <span
                className="text-[11px] font-serif select-none"
                style={{ color: "var(--dz-theme-accent)" }}
              >
                ✦
              </span>
              <div
                className="h-[1px] flex-1"
                style={{
                  background:
                    "linear-gradient(to left, transparent, var(--dz-theme-border), var(--dz-theme-accent))",
                }}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. LUXURY ARTISAN FOOTER & RESTAURANT INFO CARD                           */}
          {/* ========================================================================= */}
          {!isSearching && showInfoCard && (
            <div className="px-5 mt-2 mb-2">
              <div
                className="p-5 sm:p-6 rounded-[28px] border relative overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: "var(--dz-theme-surface)",
                  borderColor: "var(--dz-theme-border)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                }}
              >
                {/* Soft decorative background radial glow */}
                <div
                  className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: "var(--dz-theme-accent)" }}
                />

                {/* Header: Restaurant Brand & Tagline */}
                <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b" style={{ borderColor: "var(--dz-theme-border)" }}>
                  {activeLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeLogo}
                      alt={menu.restaurant.name}
                      className="w-12 h-12 rounded-full object-cover border p-0.5"
                      style={{ borderColor: "var(--dz-theme-border)" }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-serif font-bold text-base border shadow-xs"
                      style={{
                        backgroundColor: "var(--dz-theme-surface-raised)",
                        borderColor: "var(--dz-theme-border)",
                        color: "var(--dz-theme-accent)",
                      }}
                    >
                      {menu.restaurant.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-base font-serif font-bold tracking-tight truncate"
                      style={{ color: "var(--dz-theme-text)" }}
                    >
                      {menu.restaurant.name}
                    </h3>
                    <p
                      className="text-[11px] truncate opacity-75 font-normal mt-0.5"
                      style={{ color: "var(--dz-theme-muted)" }}
                    >
                      {menu.restaurant.tagline || menu.restaurant.description || "Artisan Dining & Coffee"}
                    </p>
                  </div>
                </div>

                {/* Location & Directions Button */}
                {(contact.address || contact.city || mapsUrl) && (
                  <div className="mb-4">
                    <div className="flex items-start gap-2 text-xs mb-2.5">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[var(--dz-theme-accent)]" />
                      <span
                        className="leading-relaxed font-medium"
                        style={{ color: "var(--dz-theme-text)" }}
                      >
                        {[contact.address, contact.city].filter(Boolean).join(", ") || "Location"}
                      </span>
                    </div>

                    {mapsUrl && showDirections && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-full text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:opacity-95"
                        style={{
                          backgroundColor: "var(--dz-theme-pill-active-bg)",
                          borderColor: "var(--dz-theme-pill-active-bg)",
                          color: "var(--dz-theme-pill-active-text)",
                        }}
                      >
                        <Navigation className="w-3.5 h-3.5 fill-current" />
                        <span>{directionsButtonText}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Quick Contact & Social Media Action Buttons */}
                {showSocialLinks && (
                  (Boolean(contact.phone) && showPhone) ||
                  (Boolean(contact.whatsapp) && showWhatsapp) ||
                  (Boolean(contact.instagram) && showInstagram) ||
                  (Boolean(contact.tiktok) && showTiktok) ||
                  (Boolean(contact.facebook) && showFacebook) ||
                  showShare
                ) && (
                  <div className="flex items-center gap-2.5 flex-wrap justify-center my-4 pt-2">
                    {/* 1. Phone Call */}
                    {contact.phone && showPhone && (
                      <a
                        href={`tel:${contact.phone}`}
                        aria-label="Call Restaurant"
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-transform duration-150 cursor-pointer active:scale-90 md:hover:scale-110 shadow-xs"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                          color: "var(--dz-theme-text)",
                        }}
                      >
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </a>
                    )}

                    {/* 2. WhatsApp */}
                    {contact.whatsapp && showWhatsapp && (
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp Message"
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-transform duration-150 cursor-pointer active:scale-90 md:hover:scale-110 shadow-xs"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                          color: "#25D366",
                        }}
                      >
                        {/* Official WhatsApp SVG */}
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                      </a>
                    )}

                    {/* 3. Instagram */}
                    {contact.instagram && showInstagram && (
                      <a
                        href={
                          contact.instagram.startsWith("http")
                            ? contact.instagram
                            : `https://instagram.com/${contact.instagram.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram Page"
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-transform duration-150 cursor-pointer active:scale-90 md:hover:scale-110 shadow-xs"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                          color: "#E1306C",
                        }}
                      >
                        {/* Official Instagram SVG */}
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}

                    {/* 4. TikTok */}
                    {contact.tiktok && showTiktok && (
                      <a
                        href={
                          contact.tiktok.startsWith("http")
                            ? contact.tiktok
                            : `https://tiktok.com/@${contact.tiktok.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="TikTok Account"
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-transform duration-150 cursor-pointer active:scale-90 md:hover:scale-110 shadow-xs"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                          color: "var(--dz-theme-text)",
                        }}
                      >
                        {/* Official TikTok SVG */}
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                      </a>
                    )}

                    {/* 5. Facebook */}
                    {contact.facebook && showFacebook && (
                      <a
                        href={
                          contact.facebook.startsWith("http")
                            ? contact.facebook
                            : `https://facebook.com/${contact.facebook}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook Page"
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-transform duration-150 cursor-pointer active:scale-90 md:hover:scale-110 shadow-xs"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                          color: "#1877F2",
                        }}
                      >
                        {/* Official Facebook SVG */}
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    )}

                    {/* 6. Share Menu Button */}
                    {showShare && (
                      <button
                        type="button"
                        onClick={handleShareMenu}
                        aria-label="Share Menu"
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-transform duration-150 cursor-pointer active:scale-90 md:hover:scale-110 shadow-xs"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                          color: "var(--dz-theme-accent)",
                        }}
                      >
                        {copiedMenuLink ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Operating Hours Accordion (ساعات العمل الأسبوعية) */}
                {showOperatingHours && (
                  <div
                    className="mt-3.5 p-3.5 rounded-2xl border"
                    style={{
                      backgroundColor: "var(--dz-theme-surface-raised)",
                      borderColor: "var(--dz-theme-border)",
                    }}
                  >
                    <div
                      onClick={() => setShowWeeklyHours((prev) => !prev)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--dz-theme-accent)]" />
                        <div>
                          <span className="text-xs font-bold block" style={{ color: "var(--dz-theme-text)" }}>
                            {schedule.alwaysOpen
                              ? "Always Open (24/7)"
                              : schedule.formattedHours || "Opening Hours"}
                          </span>
                          <span className="text-[10px] opacity-70 block font-normal" style={{ color: "var(--dz-theme-muted)" }}>
                            {schedule.isOpenNow ? "🟢 Open right now" : "🔴 Currently closed"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="p-1 rounded-full opacity-70 hover:opacity-100"
                        style={{ color: "var(--dz-theme-text)" }}
                      >
                        {showWeeklyHours ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Expandable Weekly Schedule Table */}
                    {showWeeklyHours && (
                      <div
                        className="mt-3 pt-3 border-t space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                        style={{ borderColor: "var(--dz-theme-border)" }}
                      >
                        {schedule.operatingHours && schedule.operatingHours.length > 0 ? (
                          schedule.operatingHours.map((hour, idx) => {
                            const openTime = hour.open || hour.defaultOpen || "10:00";
                            const closeTime = hour.close || hour.defaultClose || "23:00";
                            const dayName =
                              hour.label ||
                              hour.day ||
                              (hour.id
                                ? hour.id.charAt(0).toUpperCase() + hour.id.slice(1)
                                : `Day ${idx + 1}`);
                            const isDayOpen = hour.isOpen !== false;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-0.5 transition-colors"
                              >
                                <span
                                  className="font-medium opacity-85"
                                  style={{ color: "var(--dz-theme-text)" }}
                                >
                                  {dayName}
                                </span>
                                <span
                                  className="font-semibold text-[11px]"
                                  style={{
                                    color: isDayOpen
                                      ? "var(--dz-theme-price)"
                                      : "var(--dz-theme-muted)",
                                  }}
                                >
                                  {isDayOpen
                                    ? `${openTime} - ${closeTime}`
                                    : "Closed"}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[11px] opacity-70 text-center py-1" style={{ color: "var(--dz-theme-muted)" }}>
                            Open daily according to standard hours.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Guest Wi-Fi Box (واي فاي المطعم) */}
                {showWifiInfo && wifi.ssid && (
                  <div
                    className="mt-3 p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: "var(--dz-theme-search-bg)",
                      borderColor: "var(--dz-theme-search-border)",
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Wifi className="w-4 h-4 shrink-0 text-[var(--dz-theme-accent)]" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate" style={{ color: "var(--dz-theme-text)" }}>
                          Wi-Fi: {wifi.ssid}
                        </span>
                        {wifi.password && (
                          <span className="text-[11px] opacity-75 font-mono block truncate" style={{ color: "var(--dz-theme-muted)" }}>
                            Pass: {wifi.password}
                          </span>
                        )}
                      </div>
                    </div>

                    {wifi.password && (
                      <button
                        type="button"
                        onClick={() => copyWifiPassword(wifi.password || "")}
                        className="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                        style={{
                          backgroundColor: copiedWifi
                            ? "var(--dz-theme-pill-active-bg)"
                            : "var(--dz-theme-surface)",
                          borderColor: copiedWifi
                            ? "var(--dz-theme-pill-active-bg)"
                            : "var(--dz-theme-border)",
                          color: copiedWifi
                            ? "var(--dz-theme-pill-active-text)"
                            : "var(--dz-theme-text)",
                        }}
                      >
                        {copiedWifi ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 opacity-70" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Footer Signature */}
                <div className="mt-5 pt-3.5 text-center border-t flex flex-col items-center gap-1" style={{ borderColor: "var(--dz-theme-border)" }}>
                  <p className="text-[10px] opacity-60 font-medium" style={{ color: "var(--dz-theme-muted)" }}>
                    © {new Date().getFullYear()} {menu.restaurant.name}. All rights reserved.
                  </p>
                  <span
                    className="text-[9px] tracking-wider uppercase font-semibold opacity-40 hover:opacity-80 transition-opacity"
                    style={{ color: "var(--dz-theme-accent)" }}
                  >
                    Powered by DZMenu
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</div>
  );
}
