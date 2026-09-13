"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Clock,
  MapPin,
  Phone,
  Share2,
  Heart,
  Sparkles,
  Flame,
  Leaf,
  WheatOff,
  Wifi,
  ChevronRight,
  ChevronLeft,
  X,
  Instagram,
  Utensils,
  Info,
  Copy,
  Check,
  LayoutGrid,
  List,
  Plus,
  ArrowLeft,
  Star,
} from "lucide-react";
import type { ThemeRenderContext, MenuItemView, MenuCategoryView } from "@/types/theme-contract";
import { buildTrackedMenuUrl } from "@/lib/analytics/urls";
import { searchMenuItems } from "@/lib/search/fuzzy-search";
import { getFramingTransformStyle, getSlotFraming } from "@/lib/utils";

function formatSocialUrl(
  raw: string | null | undefined,
  platform: "instagram" | "tiktok" | "facebook" | "whatsapp"
): { handle: string; url: string } | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();

  if (platform === "instagram") {
    const handle = trimmed
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/\/+$/, "")
      .replace(/^@/, "");
    return {
      handle: handle ? `@${handle}` : "Instagram",
      url: trimmed.startsWith("http") ? trimmed : `https://instagram.com/${handle}`,
    };
  }

  if (platform === "tiktok") {
    const handle = trimmed
      .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "")
      .replace(/\/+$/, "")
      .replace(/^@/, "");
    return {
      handle: handle ? `@${handle}` : "TikTok",
      url: trimmed.startsWith("http") ? trimmed : `https://tiktok.com/@${handle}`,
    };
  }

  if (platform === "facebook") {
    const handle = trimmed
      .replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
      .replace(/\/+$/, "");
    return {
      handle: handle ? handle : "Facebook Page",
      url: trimmed.startsWith("http") ? trimmed : `https://facebook.com/${handle}`,
    };
  }

  if (platform === "whatsapp") {
    const digits = trimmed.replace(/[^\d+]/g, "");
    return {
      handle: trimmed,
      url: trimmed.startsWith("http")
        ? trimmed
        : `https://wa.me/${digits.replace(/^\+/, "")}`,
    };
  }

  return { handle: trimmed, url: trimmed };
}

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

import { resolveCategoryFluentEmojiUrl } from "@/lib/constants/fluent-food-emojis";

function renderCategoryVisual(
  name: string,
  explicitIcon?: string | null,
  className = "w-full h-full object-contain"
) {
  const resolvedUrl = resolveCategoryFluentEmojiUrl(name, explicitIcon);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedUrl}
      alt={name}
      className={className}
      loading="lazy"
    />
  );
}

function formatBadgeLabel(badge: string | null | undefined): string | null {
  if (!badge) return null;
  const normalized = badge.toUpperCase().trim();
  switch (normalized) {
    case "BEST_SELLER":
      return "BEST SELLER";
    case "CHEF_PICK":
      return "CHEF'S PICK";
    case "NEW":
      return "NEW";
    case "POPULAR":
      return "POPULAR";
    case "SIGNATURE":
      return "SIGNATURE";
    case "SPECIAL_OFFER":
      return "SPECIAL OFFER";
    default:
      return badge;
  }
}

export function CravingMainTemplate({
  menu,
  settings,
  imageSlots,
  navigation,
}: ThemeRenderContext) {
  // Navigation tabs: 'home' | 'category' | 'search' | 'info'
  const [activeTab, setActiveTab] = useState<"home" | "category" | "search" | "info">("home");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchDietaryFilter, setSearchDietaryFilter] = useState<string>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [wifiCopied, setWifiCopied] = useState<boolean>(false);

  const layout = (settings.layout as Record<string, unknown>) || {};
  const showHeroHighlight = layout.show_hero_highlight !== false;
  const showFeatured = layout.show_featured !== false;
  const showCategoryIcons = layout.show_category_icons !== false;
  const showDealCombo = layout.show_deal_combo !== false;

  const handleCopyWifi = (e: React.MouseEvent, password: string) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(password);
      setWifiCopied(true);
      setTimeout(() => setWifiCopied(false), 2000);
    }
  };

  // Load favorites from local storage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("dz_craving_favorites") || "[]");
      if (Array.isArray(stored)) {
        setFavorites(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    try {
      let updated: string[];
      if (favorites.includes(itemId)) {
        updated = favorites.filter((id) => id !== itemId);
      } else {
        updated = [...favorites, itemId];
      }
      setFavorites(updated);
      localStorage.setItem("dz_craving_favorites", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = buildTrackedMenuUrl({ source: "share" });
    if (navigator.share) {
      try {
        await navigator.share({
          title: menu.restaurant.name,
          text: menu.restaurant.tagline || `Explore the menu at ${menu.restaurant.name}`,
          url: shareUrl,
        });
      } catch {
        // Dismissed
      }
    } else if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Dismissed
      }
    }
  };

  const activeCategories = useMemo(() => {
    return menu.categories.filter((c) => c.isActive);
  }, [menu.categories]);

  const allItems = useMemo(() => {
    const map = new Map<string, MenuItemView>();
    menu.categories.forEach((cat) => {
      cat.items.forEach((item) => map.set(item.id, item));
    });
    menu.featuredItems.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [menu]);

  // Featured items list
  const featuredItems = useMemo(() => {
    if (menu.featuredItems && menu.featuredItems.length > 0) {
      return menu.featuredItems;
    }
    const items = allItems.filter((i) => i.isFeatured);
    return items.length > 0 ? items : allItems.slice(0, 4);
  }, [menu.featuredItems, allItems]);

  // Highlight promo dish
  const heroHighlightDish = useMemo(() => {
    return featuredItems[0] || allItems[0] || null;
  }, [featuredItems, allItems]);

  // Today's Deal Combo dish
  const todayDealDish = useMemo(() => {
    return featuredItems[1] || allItems[1] || heroHighlightDish;
  }, [featuredItems, allItems, heroHighlightDish]);

  // Category View Options: Layout (grid vs list) & In-Category Dietary Filter
  const [categoryLayout, setCategoryLayout] = useState<"grid" | "list">("grid");
  const [categoryDietaryFilter, setCategoryDietaryFilter] = useState<"all" | "bestseller" | "spicy" | "veg">("all");

  const selectedCategoryObj = useMemo(() => {
    if (selectedCategoryId === "all") return null;
    return activeCategories.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId, activeCategories]);

  // Filtered dishes for category listing view with dietary support
  const categoryDishes = useMemo(() => {
    let pool = selectedCategoryId === "all" ? allItems : allItems.filter((i) => i.categoryId === selectedCategoryId);
    if (categoryDietaryFilter === "spicy") {
      pool = pool.filter((i) => i.dietary.isSpicy);
    } else if (categoryDietaryFilter === "veg") {
      pool = pool.filter((i) => i.dietary.isVegetarian || i.dietary.isVegan);
    } else if (categoryDietaryFilter === "bestseller") {
      pool = pool.filter((i) => {
        const b = (i.badge || "").toLowerCase();
        return b.includes("best") || b.includes("popular") || b.includes("top") || i.isFeatured;
      });
    }
    return pool;
  }, [selectedCategoryId, categoryDietaryFilter, allItems]);

  // Search results
  const searchResults = useMemo(() => {
    let pool = allItems;
    if (searchDietaryFilter === "veg") {
      pool = pool.filter((item) => item.dietary.isVegetarian || item.dietary.isVegan);
    } else if (searchDietaryFilter === "spicy") {
      pool = pool.filter((item) => item.dietary.isSpicy);
    } else if (searchDietaryFilter === "favorites") {
      pool = pool.filter((item) => favorites.includes(item.id));
    }

    if (searchQuery.trim()) {
      return searchMenuItems(pool, searchQuery.trim(), { threshold: 0.35 });
    }
    return pool;
  }, [allItems, searchQuery, searchDietaryFilter, favorites]);

  const activeLogo = imageSlots.logo || menu.restaurant.logoUrl || null;
  const heroBurgerUrl =
    imageSlots.hero_burger ||
    (heroHighlightDish?.imageUrl && !heroHighlightDish.imageUrl.toLowerCase().includes("ice") ? heroHighlightDish.imageUrl : null) ||
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop";
  const dealComboUrl =
    imageSlots.deal_combo ||
    (todayDealDish?.imageUrl && !todayDealDish.imageUrl.toLowerCase().includes("ice") ? todayDealDish.imageUrl : null) ||
    "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop";
  const ambiencePhotoUrl = imageSlots.info_ambience || menu.restaurant.coverUrl || heroBurgerUrl;

  const heroFraming = getSlotFraming(settings, "hero_burger");
  const dealFraming = getSlotFraming(settings, "deal_combo");
  const ambienceFraming = getSlotFraming(settings, "info_ambience");
  const logoFraming = getSlotFraming(settings, "logo");

  const navigateToCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setActiveTab("category");
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 relative select-none bg-[var(--dz-theme-background)] text-[var(--dz-theme-text)] font-sans">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. TOP APP BAR (Consistent Fast-Casual Header)
          ────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-[var(--dz-theme-background)] border-b border-[var(--dz-theme-border)] flex items-center justify-between gap-2 shrink-0 shadow-xs">
        {/* Left: Info / Back Action */}
        <div className="flex items-center justify-start shrink-0">
          {activeTab === "category" ? (
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="w-9 h-9 rounded-full bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
              aria-label="Back to home"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`w-9 h-9 rounded-full border border-[var(--dz-theme-border)] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 ${
                activeTab === "info"
                  ? "bg-[var(--dz-theme-accent)] text-black"
                  : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
              }`}
              aria-label="Restaurant Info"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center: Brand / Logo */}
        <div
          onClick={() => setActiveTab("home")}
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer min-w-0 px-2"
        >
          {activeLogo ? (
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-[var(--dz-theme-border)] shrink-0 relative bg-[var(--dz-theme-surface)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeLogo}
                alt={menu.restaurant.name}
                className="w-full h-full object-cover"
                style={getFramingTransformStyle(logoFraming)}
              />
            </div>
          ) : (
            <span className="text-xl shrink-0">👑</span>
          )}
          <h1
            className="text-base sm:text-lg font-black uppercase tracking-tight text-[var(--dz-theme-text)] truncate leading-tight text-center"
            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
          >
            {menu.restaurant.name}
          </h1>
        </div>

        {/* Right: Share Button */}
        <div className="flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. SCROLLABLE MAIN CONTENT (Switches by activeTab)
          ────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 pb-28 sm:pb-32 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {/* ========================================================================
            VIEW 1: HOME SHOWCASE (Screen 1 in Mockup)
            ======================================================================== */}
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-200">
            {/* 1. Hero Highlight Promo Banner (Edge-to-Edge Full Width Food Image Background) */}
            {showHeroHighlight && (
              <div
                onClick={() => {
                  if (heroHighlightDish) {
                    navigation.goToItem(heroHighlightDish.id);
                  } else {
                    setActiveTab("category");
                  }
                }}
                className="relative w-full overflow-hidden min-h-[270px] sm:min-h-[290px] shadow-lg cursor-pointer group active:scale-[0.99] transition-all"
              >
                {/* Full Card Background Image */}
                {heroBurgerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroBurgerUrl}
                    alt="Hero Showcase"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={getFramingTransformStyle(heroFraming)}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1E] to-[#121214]" />
                )}

                {/* Cinematic Multi-stop Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/25" />

                {/* Left Text & Action Content on Top */}
                <div className="relative z-10 p-5 sm:p-6 pb-14 sm:pb-16 flex flex-col justify-between h-full min-h-[270px] sm:min-h-[290px] max-w-[75%] space-y-3">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--dz-theme-accent)]/20 text-[var(--dz-theme-accent)] border border-[var(--dz-theme-accent)]/40 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs mb-2 shadow-xs">
                      <Flame className="w-3 h-3 fill-current" />
                      HOT &amp; FRESH
                    </span>

                    <h2
                      className="text-2xl sm:text-3xl font-black uppercase text-white leading-tight tracking-tight break-words [overflow-wrap:anywhere] drop-shadow-md"
                      style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                    >
                      {menu.restaurant.tagline ? (
                        (() => {
                          const words = menu.restaurant.tagline.trim().split(/\s+/);
                          if (words.length >= 2) {
                            return (
                              <>
                                <span className="text-[var(--dz-theme-accent)] block leading-none drop-shadow-sm">{words[0]}</span>
                                <span className="text-white block leading-none mt-1">{words.slice(1, 3).join(" ")}</span>
                                {words.length > 3 && (
                                  <span className="text-white/80 text-xs sm:text-sm font-bold block mt-1 normal-case tracking-normal">
                                    {words.slice(3).join(" ")}
                                  </span>
                                )}
                              </>
                            );
                          }
                          return <span className="text-[var(--dz-theme-accent)]">{menu.restaurant.tagline}</span>;
                        })()
                      ) : (
                        <>
                          <span className="text-[var(--dz-theme-accent)] block leading-none drop-shadow-sm">SMASH</span>
                          <span className="text-white block leading-none mt-1">BURGERS</span>
                          <span className="text-white/90 text-xs sm:text-sm font-bold block mt-1 tracking-wider">DONE RIGHT.</span>
                        </>
                      )}
                    </h2>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeCategories.length > 0) {
                          navigateToCategory(activeCategories[0].id);
                        } else {
                          setActiveTab("category");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--dz-theme-accent)] hover:brightness-110 text-black font-black text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                      <span>Explore Menu</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Body Content Container (Curved upwards over Hero Banner) */}
            <div className={`relative z-20 bg-[var(--dz-theme-background)] px-4 pt-5 pb-6 space-y-5 ${showHeroHighlight ? "-mt-7 rounded-t-[32px] border-t border-[var(--dz-theme-border)] shadow-xl" : "pt-4"}`}>
              {/* 2. Featured Section (Horizontal Swipeable Carousel matching mockup) */}
            {showFeatured && featuredItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-base sm:text-lg font-black text-[var(--dz-theme-text)] tracking-tight"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    Featured
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("category")}
                    className="text-xs font-black text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-accent)] flex items-center gap-1 transition-colors cursor-pointer py-1"
                  >
                    <span>See all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden -mx-4 px-4">
                  {featuredItems.map((dish, idx) => (
                    <div
                      key={dish.id}
                      onClick={() => navigation.goToItem(dish.id)}
                      className="w-[160px] sm:w-[180px] shrink-0 group rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] hover:border-[var(--dz-theme-accent)]/60 bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] transition-all duration-300 cursor-pointer shadow-xs hover:shadow-lg hover:shadow-[var(--dz-theme-accent)]/10 flex flex-col justify-between active:scale-[0.98]"
                    >
                      <div>
                        {/* Food Image */}
                        <div className="h-32 sm:h-36 w-full relative bg-black/20 overflow-hidden">
                          {dish.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              style={getFramingTransformStyle(dish.framing)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              🍽️
                            </div>
                          )}

                          {/* Promotional Pill Badge */}
                          <span
                            className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${
                              idx === 0
                                ? "bg-[var(--dz-theme-primary)] text-white"
                                : idx === 1
                                ? "bg-[var(--dz-theme-accent)] text-black"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {formatBadgeLabel(dish.badge) || (idx === 0 ? "BEST SELLER" : idx === 1 ? "POPULAR" : "NEW")}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(e, dish.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-xs text-white hover:text-red-500 transition-colors"
                            aria-label="Favorite"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                favorites.includes(dish.id)
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Info */}
                        <div className="p-3 pt-2.5 space-y-1">
                          <h4
                            className="text-xs sm:text-sm font-black text-[var(--dz-theme-text)] line-clamp-1 break-words [overflow-wrap:anywhere]"
                            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                          >
                            {dish.name}
                          </h4>
                          {dish.description && (
                            <p className="text-[10px] text-[var(--dz-theme-muted)] line-clamp-2 leading-tight">
                              {dish.description}
                            </p>
                          )}
                          <div className="pt-1 flex items-center justify-between gap-1.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs sm:text-sm font-black text-[var(--dz-theme-text)]">
                                {dish.formattedPrice}
                              </span>
                              {dish.hasActiveDiscount && dish.formattedOriginalPrice && (
                                <span className="text-[10px] text-[var(--dz-theme-muted)] line-through font-bold">
                                  {dish.formattedOriginalPrice}
                                </span>
                              )}
                            </div>
                            {dish.hasActiveDiscount && dish.discountPercentage && (
                              <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-black tracking-tight shrink-0">
                                -{dish.discountPercentage}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Circular Category Avatars (Burgers, Pizza, Tacos, Chicken, Sides, Drinks) */}
            {showCategoryIcons && activeCategories.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xs font-black text-[var(--dz-theme-muted)] uppercase tracking-wider"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    Menu Categories
                  </h3>
                </div>

                <div className="flex items-center gap-3.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden -mx-4 px-4">
                  {activeCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => navigateToCategory(cat.id)}
                      className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center p-2.5 transition-all duration-300 shadow-xs group-active:scale-95 bg-[var(--dz-theme-surface)] group-hover:bg-[var(--dz-theme-accent)] border border-[var(--dz-theme-border)] group-hover:border-[var(--dz-theme-accent)] group-hover:shadow-md group-hover:shadow-[var(--dz-theme-accent)]/20">
                        <div className="w-full h-full group-hover:scale-110 transition-transform duration-300">
                          {renderCategoryVisual(cat.name, cat.icon, "w-full h-full object-contain")}
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-black transition-colors duration-200 text-center max-w-[68px] truncate text-[var(--dz-theme-text)] group-hover:text-[var(--dz-theme-accent)]"
                        style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                      >
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. "Today's Craving" Daily Deal / Combo Promo Card */}
            {showDealCombo && todayDealDish && (
              <div
                onClick={() => navigation.goToItem(todayDealDish.id)}
                className="relative rounded-3xl overflow-hidden min-h-[160px] sm:min-h-[180px] border border-[var(--dz-theme-border)] p-4 sm:p-5 flex items-center justify-between shadow-xl cursor-pointer group active:scale-[0.99] transition-all hover:border-[var(--dz-theme-accent)]/50"
              >
                {/* Full Card Background Image */}
                {dealComboUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dealComboUrl}
                    alt="Today Deal"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={getFramingTransformStyle(dealFraming)}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#18181C] via-[#141416] to-[#101012]" />
                )}

                {/* Multi-stop Cinematic Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/30" />

                {/* Left Text & Deal Details on Top */}
                <div className="relative z-10 max-w-[70%] space-y-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C5221F] text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                    LIMITED OFFER
                  </span>

                  <h3
                    className="text-xl sm:text-2xl font-black uppercase text-white leading-none tracking-tight"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    TODAY&apos;S CRAVING
                  </h3>

                  <p className="text-[11px] text-white/70 line-clamp-1 font-medium">
                    {todayDealDish.name} + Fries + Drink
                  </p>

                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-lg sm:text-xl font-black text-[var(--dz-theme-accent)]">
                      {todayDealDish.formattedPrice}
                    </span>
                    {todayDealDish.hasActiveDiscount && todayDealDish.formattedOriginalPrice && (
                      <span className="text-xs text-white/60 line-through font-bold">
                        {todayDealDish.formattedOriginalPrice}
                      </span>
                    )}
                    {todayDealDish.hasActiveDiscount && todayDealDish.discountPercentage && (
                      <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-black uppercase">
                        -{todayDealDish.discountPercentage}%
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigation.goToItem(todayDealDish.id);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[var(--dz-theme-accent)] hover:brightness-110 text-black font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer mt-1"
                  >
                    <span>Get the Deal</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* ========================================================================
            VIEW 2: CATEGORY LISTING VIEW (Screen 2 in Mockup - High Energy Upgrade)
            ======================================================================== */}
        {activeTab === "category" && (
          <div className="animate-in fade-in duration-200 pb-4">
            {/* 1. Category Circular Switcher Carousel (Sticky Top) */}
            <div className="sticky top-0 z-20 bg-[var(--dz-theme-background)]/95 backdrop-blur-md px-4 py-3 border-b border-[var(--dz-theme-border)] flex items-center gap-3.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-lg transition-all shadow-xs ${
                    selectedCategoryId === "all"
                      ? "bg-[var(--dz-theme-accent)] text-black border-2 border-[var(--dz-theme-accent)] font-black shadow-md shadow-[var(--dz-theme-accent)]/25 scale-105"
                      : "bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)] border border-[var(--dz-theme-border)]"
                  }`}
                >
                  🍽️
                </div>
                <span
                  className={`text-[10px] font-black transition-colors ${
                    selectedCategoryId === "all"
                      ? "text-[var(--dz-theme-accent)]"
                      : "text-[var(--dz-theme-muted)] group-hover:text-[var(--dz-theme-text)]"
                  }`}
                  style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                >
                  All ({allItems.length})
                </span>
              </button>

              {activeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const catCount = allItems.filter((i) => i.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center p-2.5 transition-all shadow-xs ${
                        isSelected
                          ? "bg-[var(--dz-theme-accent)] border-2 border-[var(--dz-theme-accent)] shadow-md shadow-[var(--dz-theme-accent)]/25 scale-105"
                          : "bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)]"
                      }`}
                    >
                      <div className="w-full h-full group-hover:scale-110 transition-transform duration-300">
                        {renderCategoryVisual(cat.name, cat.icon, "w-full h-full object-contain")}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black transition-colors max-w-[64px] truncate text-center ${
                        isSelected
                          ? "text-[var(--dz-theme-accent)]"
                          : "text-[var(--dz-theme-muted)] group-hover:text-[var(--dz-theme-text)]"
                      }`}
                      style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                    >
                      {cat.name} ({catCount})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. Category Hero Header & Controls */}
            <div className="px-4 pt-3 space-y-3">
              {/* Category Showcase Banner */}
              <div className="p-4 rounded-2xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] shadow-xs relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-[var(--dz-theme-accent)]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--dz-theme-accent)]/15 border border-[var(--dz-theme-accent)]/30 flex items-center justify-center p-2.5 shrink-0 shadow-xs">
                      {selectedCategoryObj ? (
                        <div className="w-full h-full">
                          {renderCategoryVisual(selectedCategoryObj.name, selectedCategoryObj.icon, "w-full h-full object-contain")}
                        </div>
                      ) : (
                        <span className="text-2xl">🔥</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2
                          className="text-lg sm:text-xl font-black uppercase tracking-tight text-[var(--dz-theme-text)] truncate leading-tight"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          {selectedCategoryObj ? selectedCategoryObj.name : "ALL CRAVINGS"}
                        </h2>
                      </div>
                      <p className="text-[11px] text-[var(--dz-theme-muted)] font-medium mt-0.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--dz-theme-accent)]/15 text-[var(--dz-theme-accent)] text-[10px] font-black">
                          🔥 {categoryDishes.length} Items
                        </span>
                        <span>• Ready to satisfy your hunger</span>
                      </p>
                    </div>
                  </div>

                  {/* Layout Grid / List Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-[var(--dz-theme-background)] rounded-xl border border-[var(--dz-theme-border)] shrink-0">
                    <button
                      type="button"
                      onClick={() => setCategoryLayout("grid")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        categoryLayout === "grid"
                          ? "bg-[var(--dz-theme-accent)] text-black shadow-xs font-bold"
                          : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
                      }`}
                      aria-label="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryLayout("list")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        categoryLayout === "list"
                          ? "bg-[var(--dz-theme-accent)] text-black shadow-xs font-bold"
                          : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
                      }`}
                      aria-label="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* In-Category Quick Dietary Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-[var(--dz-theme-border)]/60 [&::-webkit-scrollbar]:hidden">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "bestseller", label: "⭐ Popular" },
                    { id: "spicy", label: "🔥 Spicy" },
                    { id: "veg", label: "🌿 Veggie" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCategoryDietaryFilter(f.id as typeof categoryDietaryFilter)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                        categoryDietaryFilter === f.id
                          ? "bg-[var(--dz-theme-accent)] text-black shadow-xs"
                          : "bg-[var(--dz-theme-background)] text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)] border border-[var(--dz-theme-border)]"
                      }`}
                      style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Category Items Container (Grid 2-Col or Horizontal List) */}
            <div className="p-4 pt-3">
              {categoryDishes.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] space-y-2">
                  <div className="text-3xl">🔍</div>
                  <h4
                    className="text-sm font-black text-[var(--dz-theme-text)]"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    No matching items found
                  </h4>
                  <p className="text-xs text-[var(--dz-theme-muted)]">
                    Try switching filters or check another category.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryDietaryFilter("all");
                      setSelectedCategoryId("all");
                    }}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-[var(--dz-theme-accent)] text-black font-black text-xs cursor-pointer shadow-xs active:scale-95"
                  >
                    Show All Menu Items
                  </button>
                </div>
              ) : categoryLayout === "grid" ? (
                /* ── 2-COLUMN FOOD GRID VIEW ── */
                <div className="grid grid-cols-2 gap-3">
                  {categoryDishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => navigation.goToItem(dish.id)}
                      className="group rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] hover:border-[var(--dz-theme-accent)]/60 bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between active:scale-[0.98]"
                    >
                      <div>
                        {/* Food Image */}
                        <div className="h-32 sm:h-36 w-full relative bg-black/20 overflow-hidden">
                          {dish.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              style={getFramingTransformStyle(dish.framing)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              🍽️
                            </div>
                          )}

                          {/* Promotional Pill Badge */}
                          {dish.badge && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-[var(--dz-theme-primary)] text-white shadow-sm">
                              {formatBadgeLabel(dish.badge)}
                            </span>
                          )}

                          {/* Heart Favorite */}
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(e, dish.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white/80 hover:text-red-400 transition-colors shadow-xs"
                            aria-label="Favorite"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                favorites.includes(dish.id)
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Food Details */}
                        <div className="p-3">
                          <h4
                            className="text-xs sm:text-sm font-black text-[var(--dz-theme-text)] line-clamp-1 leading-snug break-words [overflow-wrap:anywhere]"
                            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                          >
                            {dish.name}
                          </h4>
                          {dish.description && (
                            <p className="text-[10px] text-[var(--dz-theme-muted)] line-clamp-2 mt-1 leading-relaxed break-words [overflow-wrap:anywhere]">
                              {dish.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer: Price & Quick Action */}
                      <div className="p-3 pt-0 flex items-center justify-between gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-xs sm:text-sm font-black text-[var(--dz-theme-accent)]"
                            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                          >
                            {dish.formattedPrice}
                          </span>
                          {dish.hasActiveDiscount && dish.formattedOriginalPrice && (
                            <span className="text-[10px] text-[var(--dz-theme-muted)] line-through font-bold">
                              {dish.formattedOriginalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {dish.hasActiveDiscount && dish.discountPercentage && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-black">
                              -{dish.discountPercentage}%
                            </span>
                          )}
                          {dish.dietary.isSpicy && (
                            <Flame className="w-3.5 h-3.5 text-red-500 fill-current" />
                          )}
                          {dish.dietary.isVegetarian && (
                            <Leaf className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                          )}
                          <div className="w-6 h-6 rounded-lg bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] group-hover:bg-[var(--dz-theme-accent)] group-hover:text-black flex items-center justify-center transition-colors shadow-2xs">
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── ENHANCED HORIZONTAL LIST VIEW ── */
                <div className="space-y-3">
                  {categoryDishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => navigation.goToItem(dish.id)}
                      className="p-3 rounded-2xl border border-[var(--dz-theme-border)] hover:border-[var(--dz-theme-accent)]/50 bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-3.5 active:scale-[0.99] group"
                    >
                      {/* Dish Photo */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-black/20 shrink-0 relative">
                        {dish.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            style={getFramingTransformStyle(dish.framing)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            🍽️
                          </div>
                        )}
                        {dish.badge && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-[var(--dz-theme-primary)] text-white shadow-sm">
                            {formatBadgeLabel(dish.badge)}
                          </span>
                        )}
                      </div>

                      {/* Dish Information */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className="text-sm sm:text-base font-black text-[var(--dz-theme-text)] leading-snug line-clamp-1"
                              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                            >
                              {dish.name}
                            </h4>

                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(e, dish.id)}
                              className="p-1 text-[var(--dz-theme-muted)] hover:text-red-500 transition-colors shrink-0"
                              aria-label="Favorite"
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  favorites.includes(dish.id)
                                    ? "fill-red-500 text-red-500"
                                    : ""
                                }`}
                              />
                            </button>
                          </div>

                          {dish.description && (
                            <p className="text-[11px] text-[var(--dz-theme-muted)] line-clamp-2 mt-1 leading-relaxed break-words [overflow-wrap:anywhere]">
                              {dish.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2">
                          <div className="flex items-baseline gap-2">
                            <span
                              className="text-sm sm:text-base font-black text-[var(--dz-theme-accent)]"
                              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                            >
                              {dish.formattedPrice}
                            </span>
                            {dish.hasActiveDiscount && dish.formattedOriginalPrice && (
                              <span className="text-xs text-[var(--dz-theme-muted)] line-through font-bold">
                                {dish.formattedOriginalPrice}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {dish.hasActiveDiscount && dish.discountPercentage && (
                              <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-black">
                                -{dish.discountPercentage}%
                              </span>
                            )}
                            {dish.dietary.isSpicy && (
                              <Flame className="w-3.5 h-3.5 text-red-500 fill-current" />
                            )}
                            {dish.dietary.isVegetarian && (
                              <Leaf className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                            )}
                            <div className="w-7 h-7 rounded-xl bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] group-hover:bg-[var(--dz-theme-accent)] group-hover:text-black flex items-center justify-center transition-colors shadow-2xs">
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================
            VIEW 3: SEARCH TAB (Fuzzy Search & Dietary Filters)
            ======================================================================== */}
        {activeTab === "search" && (
          <div className="animate-in fade-in duration-200 p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--dz-theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search burgers, pizzas, tacos, drinks..."
                autoFocus
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-xs text-[var(--dz-theme-text)] placeholder-[var(--dz-theme-muted)] focus:outline-none focus:border-[var(--dz-theme-accent)] shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Dietary Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {[
                { id: "all", label: "All Items" },
                { id: "spicy", label: "Spicy 🔥" },
                { id: "veg", label: "Vegetarian 🌿" },
                { id: "favorites", label: `Favorites ❤️ (${favorites.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSearchDietaryFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    searchDietaryFilter === f.id
                      ? "bg-[var(--dz-theme-accent)] text-black"
                      : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Results List */}
            <div className="space-y-3 pt-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-[var(--dz-theme-muted)] text-xs">
                  No delicious matches found for &quot;{searchQuery}&quot;.
                </div>
              ) : (
                searchResults.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => navigation.goToItem(dish.id)}
                    className="p-3 rounded-2xl border border-[var(--dz-theme-border)] bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] transition-all cursor-pointer shadow-xs flex items-center gap-3.5"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/20 shrink-0">
                      {dish.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                          style={getFramingTransformStyle(dish.framing)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-[var(--dz-theme-text)] truncate">
                        {dish.name}
                      </h4>
                      {dish.description && (
                        <p className="text-[10px] text-[var(--dz-theme-muted)] line-clamp-1 mt-0.5">
                          {dish.description}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xs font-black text-[var(--dz-theme-accent)]">
                          {dish.formattedPrice}
                        </span>
                        {dish.hasActiveDiscount && dish.formattedOriginalPrice && (
                          <span className="text-[10px] text-[var(--dz-theme-muted)] line-through font-bold">
                            {dish.formattedOriginalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================
            VIEW 4: RESTAURANT INFO & STORY TAB
            ======================================================================== */}
        {activeTab === "info" && (() => {
          const infoSettings = (settings as Record<string, unknown>)?.info as Record<string, boolean> | undefined || {};
          const showAmbience = infoSettings.show_ambience_photo !== false;
          const showHours = infoSettings.show_hours !== false;
          const showLocation = infoSettings.show_location !== false;
          const showContact = infoSettings.show_contact !== false;
          const showWhatsapp = infoSettings.show_whatsapp !== false;
          const showSocials = infoSettings.show_social_links !== false;
          const showWifi = infoSettings.show_wifi !== false;
          const showAbout = infoSettings.show_about !== false;

          const instagramInfo = formatSocialUrl(menu.restaurant.contact.instagram, "instagram");
          const tiktokInfo = formatSocialUrl(menu.restaurant.contact.tiktok, "tiktok");
          const facebookInfo = formatSocialUrl(menu.restaurant.contact.facebook, "facebook");
          const whatsappInfo = formatSocialUrl(menu.restaurant.contact.whatsapp, "whatsapp");
          const directionsUrl =
            menu.restaurant.contact.googleMapsUrl ||
            (menu.restaurant.contact.address
              ? `https://maps.google.com/?q=${encodeURIComponent(
                  `${menu.restaurant.name} ${menu.restaurant.contact.address || ""}`
                )}`
              : null);

          return (
            <div className="animate-in fade-in duration-200">
              {/* Kitchen / Ambience Photo */}
              {showAmbience && ambiencePhotoUrl && (
                <div className="h-44 sm:h-52 w-full relative bg-black/20 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ambiencePhotoUrl}
                    alt={menu.restaurant.name}
                    className="w-full h-full object-cover"
                    style={getFramingTransformStyle(ambienceFraming)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--dz-theme-background)] via-transparent to-transparent" />
                </div>
              )}

              <div className="p-4 space-y-5">
                {/* Brand Name & Tagline */}
                <div>
                  <h2
                    className="text-2xl sm:text-3xl font-black uppercase text-[var(--dz-theme-text)] tracking-tight leading-none"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    {menu.restaurant.name}
                  </h2>
                  {menu.restaurant.tagline && (
                    <p className="text-xs text-[var(--dz-theme-muted)] font-medium mt-1">
                      {menu.restaurant.tagline}
                    </p>
                  )}
                </div>

                {/* Structured Contact & Hours Rows */}
                <div className="divide-y divide-[var(--dz-theme-border)] border-y border-[var(--dz-theme-border)]">
                  {/* 1. Hours */}
                  {showHours && (
                    <div className="py-3.5 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-[var(--dz-theme-muted)] uppercase tracking-wider">
                          Opening Hours
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-bold text-[var(--dz-theme-text)]">
                            {menu.restaurant.schedule.formattedHours || "11:00 — 00:00"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              menu.restaurant.schedule.isOpenNow
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {menu.restaurant.schedule.isOpenNow ? "Open Now" : "Closed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Location */}
                  {showLocation && menu.restaurant.contact.address && (
                    <div className="py-3.5 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-[var(--dz-theme-muted)] uppercase tracking-wider">
                          Location
                        </h4>
                        <p className="text-xs text-[var(--dz-theme-text)] font-semibold mt-0.5">
                          {menu.restaurant.contact.address}
                          {menu.restaurant.contact.city ? `, ${menu.restaurant.contact.city}` : ""}
                        </p>
                        {directionsUrl && (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-bold mt-1 hover:underline"
                          >
                            <span>Open in Google Maps</span>
                            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Phone */}
                  {showContact && menu.restaurant.contact.phone && (
                    <div className="py-3.5 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 mt-0.5">
                        <Phone className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-[var(--dz-theme-muted)] uppercase tracking-wider">
                          Phone Contact
                        </h4>
                        <a
                          href={`tel:${menu.restaurant.contact.phone}`}
                          className="text-xs sm:text-sm font-black text-[var(--dz-theme-text)] mt-0.5 block hover:underline"
                        >
                          {menu.restaurant.contact.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 4. WhatsApp */}
                  {showWhatsapp && whatsappInfo && (
                    <div className="py-3.5 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 mt-0.5">
                        <WhatsAppIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-[var(--dz-theme-muted)] uppercase tracking-wider">
                          WhatsApp
                        </h4>
                        <a
                          href={whatsappInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-bold mt-1 hover:underline"
                        >
                          <span>Chat on WhatsApp</span>
                          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 5. Social Links */}
                  {showSocials && (instagramInfo || facebookInfo || tiktokInfo) && (
                    <div className="py-3.5 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 mt-0.5">
                        <InstagramIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-[11px] font-black text-[var(--dz-theme-muted)] uppercase tracking-wider">
                          Social Media
                        </h4>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {instagramInfo && (
                            <a
                              href={instagramInfo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-xs text-[var(--dz-theme-text)] font-bold flex items-center gap-1.5 hover:border-[var(--dz-theme-accent)] transition"
                            >
                              <InstagramIcon className="w-3.5 h-3.5" />
                              <span>{instagramInfo.handle}</span>
                            </a>
                          )}
                          {facebookInfo && (
                            <a
                              href={facebookInfo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-xs text-[var(--dz-theme-text)] font-bold flex items-center gap-1.5 hover:border-[var(--dz-theme-accent)] transition"
                            >
                              <FacebookIcon className="w-3.5 h-3.5" />
                              <span>Facebook</span>
                            </a>
                          )}
                          {tiktokInfo && (
                            <a
                              href={tiktokInfo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-xs text-[var(--dz-theme-text)] font-bold flex items-center gap-1.5 hover:border-[var(--dz-theme-accent)] transition"
                            >
                              <TikTokIcon className="w-3.5 h-3.5" />
                              <span>{tiktokInfo.handle}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Wi-Fi */}
                  {showWifi && menu.restaurant.wifi?.ssid && (
                    <div className="py-3.5 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 mt-0.5">
                        <Wifi className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-[var(--dz-theme-muted)] uppercase tracking-wider">
                          Guest Wi-Fi
                        </h4>
                        <p className="text-xs font-bold text-[var(--dz-theme-text)] mt-0.5">
                          Network: {menu.restaurant.wifi.ssid}
                        </p>
                        {menu.restaurant.wifi.password && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-[var(--dz-theme-text)] font-mono px-2.5 py-1 rounded-lg bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)]">
                              {menu.restaurant.wifi.password}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyWifi(e, menu.restaurant.wifi.password || "")}
                              className="px-2.5 py-1 rounded-lg bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-xs text-[var(--dz-theme-accent)] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                            >
                              {wifiCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. About Us */}
                {showAbout && menu.restaurant.description && (
                  <div className="pt-2 space-y-2">
                    <h3 className="text-xs font-black uppercase text-[var(--dz-theme-text)] tracking-wider">
                      About Us
                    </h3>
                    <p className="text-xs text-[var(--dz-theme-muted)] leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {menu.restaurant.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. PERSISTENT 3-TAB BOTTOM NAVIGATION BAR (Menu / Search / Info)
          ────────────────────────────────────────────────────────────────────────── */}
      <nav className="sticky bottom-0 z-30 shrink-0 bg-[var(--dz-theme-background)] border-t border-[var(--dz-theme-border)] py-2.5 px-6 flex justify-around items-center w-full shadow-lg">
        <button
          type="button"
          onClick={() => {
            setActiveTab("home");
            setSelectedCategoryId("all");
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 ${
            activeTab === "home" || activeTab === "category"
              ? "text-[var(--dz-theme-accent)] font-black scale-105"
              : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
          }`}
        >
          <Utensils className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Menu
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 ${
            activeTab === "search"
              ? "text-[var(--dz-theme-accent)] font-black scale-105"
              : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
          }`}
        >
          <Search className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Search
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 ${
            activeTab === "info"
              ? "text-[var(--dz-theme-accent)] font-black scale-105"
              : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
          }`}
        >
          <Info className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Info
          </span>
        </button>
      </nav>
    </div>
  );
}
