"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Clock,
  MapPin,
  Phone,
  Globe,
  Share,
  Share2,
  Heart,
  Sparkles,
  Leaf,
  Flame,
  WheatOff,
  Wifi,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  Instagram,
  Utensils,
  Info,
  Bookmark,
  Copy,
  Check,
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

function formatBadgeLabel(badge: string | null | undefined): string | null {
  if (!badge) return null;
  const normalized = badge.toUpperCase().trim();
  switch (normalized) {
    case "CHEF_PICK":
      return "Chef's Pick";
    case "BEST_SELLER":
      return "Best Seller";
    case "NEW":
      return "New";
    case "SIGNATURE":
      return "Signature";
    case "SPECIAL_OFFER":
      return "Special Offer";
    default:
      return badge;
  }
}

export function GourmetMainTemplate({
  menu,
  settings,
  imageSlots,
  navigation,
}: ThemeRenderContext) {
  // Navigation tabs: 'menu' | 'search' | 'info' | 'featured'
  const [activeTab, setActiveTab] = useState<"menu" | "search" | "info" | "featured">("menu");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedPromoBadge, setSelectedPromoBadge] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchDietaryFilter, setSearchDietaryFilter] = useState<string>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [wifiCopied, setWifiCopied] = useState<boolean>(false);

  const isRosePalette = (settings as Record<string, unknown>)?.paletteId === "rose";

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
      const stored = JSON.parse(localStorage.getItem("dz_gourmet_favorites") || "[]");
      if (Array.isArray(stored)) {
        setFavorites(stored);
      }
    } catch {
      // Ignore storage errors
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
      localStorage.setItem("dz_gourmet_favorites", JSON.stringify(updated));
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
        // User dismissed
      }
    } else if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // User dismissed
      }
    }
  };

  // Filtered active categories
  const activeCategories = useMemo(() => {
    return menu.categories.filter((c) => c.isActive);
  }, [menu.categories]);

  // All menu items flattened for search & recommendations
  const allItems = useMemo(() => {
    const map = new Map<string, MenuItemView>();
    menu.categories.forEach((cat) => {
      cat.items.forEach((item) => map.set(item.id, item));
    });
    menu.featuredItems.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [menu]);

  // Featured items list (or first 4 items if none flagged)
  const featuredItems = useMemo(() => {
    if (menu.featuredItems && menu.featuredItems.length > 0) {
      return menu.featuredItems;
    }
    const items = allItems.filter((i) => i.isFeatured);
    return items.length > 0 ? items : allItems.slice(0, 4);
  }, [menu.featuredItems, allItems]);

  // Chef's Recommendations (Strictly dishes with Chef's Choice / CHEF_PICK badge)
  const chefRecommendations = useMemo(() => {
    return allItems.filter((item) => {
      const badge = (item.badge || "").toLowerCase();
      const hasChefBadge =
        badge === "chef_pick" ||
        badge === "chef" ||
        badge.includes("chef") ||
        badge.includes("شيف") ||
        item.badges.some((b) => {
          const bLower = b.toLowerCase();
          return (
            bLower === "chef_pick" ||
            bLower.includes("chef") ||
            bLower.includes("شيف")
          );
        });
      return hasChefBadge;
    });
  }, [allItems]);

  // Promotional & Featured Items Grouped by Promotional Badge for "View All" page
  const promotionalBadgeGroups = useMemo(() => {
    const promoMap = new Map<string, MenuItemView>();

    // 1. Add explicitly featured items
    featuredItems.forEach((item) => promoMap.set(item.id, item));

    // 2. Add any items with explicit badges or marked as featured
    allItems.forEach((item) => {
      const nonDietaryBadges = item.badges.filter(
        (b) => !["Vegetarian", "Vegan", "Gluten-Free", "Spicy"].includes(b)
      );
      if (item.isFeatured || item.badge || nonDietaryBadges.length > 0) {
        promoMap.set(item.id, item);
      }
    });

    // Fallback: If restaurant has few/no badges configured, include first allItems
    if (promoMap.size === 0) {
      allItems.slice(0, 6).forEach((item) => promoMap.set(item.id, item));
    }

    type BadgeGroup = {
      id: string;
      title: string;
      icon: string;
      subtitle: string;
      items: MenuItemView[];
    };

    const predefinedGroups: Record<string, BadgeGroup> = {
      chef: {
        id: "chef",
        title: "Chef's Choice",
        icon: "🌟",
        subtitle: "Handpicked culinary specialties curated by our executive chef",
        items: [],
      },
      bestseller: {
        id: "bestseller",
        title: "Best Sellers",
        icon: "🔥",
        subtitle: "The most celebrated and ordered dishes by our guests",
        items: [],
      },
      new: {
        id: "new",
        title: "New Creations",
        icon: "✨",
        subtitle: "Fresh additions and seasonal innovations on our menu",
        items: [],
      },
      special: {
        id: "special",
        title: "Special Offers",
        icon: "🏷️",
        subtitle: "Exclusive limited-time promotions and signature value combos",
        items: [],
      },
      signature: {
        id: "signature",
        title: "House Signatures",
        icon: "👑",
        subtitle: "Iconic dishes defining our restaurant's culinary identity",
        items: [],
      },
    };

    const dynamicGroups: Record<string, BadgeGroup> = {};

    Array.from(promoMap.values()).forEach((item) => {
      const explicitBadge =
        item.badge ||
        item.badges.find(
          (b) => !["Vegetarian", "Vegan", "Gluten-Free", "Spicy"].includes(b)
        );
      const badgeUpper = (explicitBadge || "").toUpperCase();
      const badgeLower = (explicitBadge || "").toLowerCase();

      if (
        badgeUpper === "BEST_SELLER" ||
        badgeLower.includes("best") ||
        badgeLower.includes("seller") ||
        badgeLower.includes("popular") ||
        badgeLower.includes("top") ||
        badgeLower.includes("الأكثر طلبا")
      ) {
        predefinedGroups.bestseller.items.push(item);
      } else if (
        badgeUpper === "NEW" ||
        badgeLower.includes("new") ||
        badgeLower.includes("nouveau") ||
        badgeLower.includes("جديد")
      ) {
        predefinedGroups.new.items.push(item);
      } else if (
        badgeUpper === "SPECIAL_OFFER" ||
        badgeLower.includes("offer") ||
        badgeLower.includes("special") ||
        badgeLower.includes("promo") ||
        badgeLower.includes("عرض") ||
        badgeLower.includes("discount")
      ) {
        predefinedGroups.special.items.push(item);
      } else if (
        badgeUpper === "SIGNATURE" ||
        badgeLower.includes("signature") ||
        badgeLower.includes("house") ||
        badgeLower.includes("متميز") ||
        badgeLower.includes("خاص")
      ) {
        predefinedGroups.signature.items.push(item);
      } else if (
        badgeUpper === "CHEF_PICK" ||
        item.isFeatured ||
        badgeLower.includes("chef") ||
        badgeLower.includes("featured") ||
        badgeLower.includes("شيف") ||
        badgeLower.includes("مميز")
      ) {
        predefinedGroups.chef.items.push(item);
      } else if (explicitBadge) {
        if (!dynamicGroups[explicitBadge]) {
          dynamicGroups[explicitBadge] = {
            id: explicitBadge.toLowerCase().replace(/\s+/g, "-"),
            title: formatBadgeLabel(explicitBadge) || explicitBadge,
            icon: "✨",
            subtitle: `Curated dishes tagged with ${formatBadgeLabel(explicitBadge)}`,
            items: [],
          };
        }
        dynamicGroups[explicitBadge].items.push(item);
      } else {
        predefinedGroups.chef.items.push(item);
      }
    });

    const result: BadgeGroup[] = [];
    if (predefinedGroups.chef.items.length > 0) result.push(predefinedGroups.chef);
    if (predefinedGroups.bestseller.items.length > 0) result.push(predefinedGroups.bestseller);
    if (predefinedGroups.new.items.length > 0) result.push(predefinedGroups.new);
    if (predefinedGroups.special.items.length > 0) result.push(predefinedGroups.special);
    if (predefinedGroups.signature.items.length > 0) result.push(predefinedGroups.signature);

    Object.values(dynamicGroups).forEach((g) => {
      if (g.items.length > 0) result.push(g);
    });

    if (result.length === 0) {
      result.push({
        id: "chef",
        title: "Chef's Choice",
        icon: "🌟",
        subtitle: "Handpicked culinary specialties curated by our executive chef",
        items: Array.from(promoMap.values()),
      });
    }

    return result;
  }, [allItems, featuredItems]);

  // Smart Typo-Tolerant Search results powered by Fuse.js & Arabic normalization
  const searchResults = useMemo(() => {
    // 1. Filter by category & dietary requirements
    let pool = allItems;

    if (selectedCategoryId !== "all") {
      pool = pool.filter((item) => item.categoryId === selectedCategoryId);
    }

    if (searchDietaryFilter === "veg") {
      pool = pool.filter((item) => item.dietary.isVegetarian || item.dietary.isVegan);
    } else if (searchDietaryFilter === "spicy") {
      pool = pool.filter((item) => item.dietary.isSpicy);
    } else if (searchDietaryFilter === "gluten_free") {
      pool = pool.filter((item) => item.dietary.isGlutenFree);
    } else if (searchDietaryFilter === "chef") {
      pool = pool.filter(
        (item) =>
          item.isFeatured ||
          (item.badge || "").toLowerCase().includes("chef") ||
          item.badges.some((b) => b.toLowerCase().includes("chef"))
      );
    } else if (searchDietaryFilter === "favorites") {
      pool = pool.filter((item) => favorites.includes(item.id));
    }

    // 2. Perform intelligent fuzzy search with typo tolerance on query
    if (searchQuery.trim()) {
      return searchMenuItems(pool, searchQuery.trim(), { threshold: 0.35 });
    }

    return pool;
  }, [allItems, searchQuery, searchDietaryFilter, selectedCategoryId, favorites]);

  // Selected single category (if not 'all')
  const currentSelectedCategory = useMemo(() => {
    if (selectedCategoryId === "all" || selectedCategoryId === "featured") return null;
    return activeCategories.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId, activeCategories]);

  const activeLogo = imageSlots.logo || menu.restaurant.logoUrl || null;

  const heroCoverUrl =
    imageSlots.hero_cover ||
    menu.restaurant.coverUrl ||
    featuredItems[0]?.imageUrl ||
    null;

  const ambiencePhotoUrl =
    imageSlots.info_ambience ||
    imageSlots.hero_cover ||
    menu.restaurant.coverUrl ||
    heroCoverUrl;

  const heroFraming = getSlotFraming(settings, "hero_cover");
  const logoFraming = getSlotFraming(settings, "logo");
  const ambienceFraming = getSlotFraming(settings, "info_ambience");

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 relative select-none bg-[var(--dz-theme-background)] text-[var(--dz-theme-text)] overflow-hidden">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. TOP APP BAR (Screen 1 & 2 Header — Hidden on Info & Featured tabs)
          ────────────────────────────────────────────────────────────────────────── */}
      {!["info", "featured"].includes(activeTab) && (
        <header className="sticky top-0 z-30 px-4 sm:px-5 py-3 bg-[var(--dz-theme-background)] border-b border-[var(--dz-theme-border)] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {activeLogo ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[var(--dz-theme-border)] shadow-xs shrink-0 relative bg-[var(--dz-theme-surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeLogo}
                  alt={menu.restaurant.name}
                  className="w-full h-full object-cover"
                  style={getFramingTransformStyle(logoFraming)}
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-xl shrink-0 shadow-xs">
                🌿
              </div>
            )}

            <div className="min-w-0">
              <h1
                className="text-sm sm:text-base font-serif uppercase tracking-[0.14em] text-[var(--dz-theme-text)] font-semibold truncate leading-tight"
                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
              >
                {menu.restaurant.name}
              </h1>
              <p className="text-[11px] sm:text-xs text-[var(--dz-theme-muted)] tracking-normal truncate flex items-center gap-1.5 mt-0.5">
                <span>{menu.restaurant.contact.city || "Algiers"}</span>
                <span className="opacity-40">•</span>
                <span
                  className={`font-semibold ${
                    menu.restaurant.schedule.isOpenNow
                      ? "text-emerald-600"
                      : isRosePalette
                      ? "text-rose-600"
                      : "text-red-600"
                  }`}
                >
                  {menu.restaurant.schedule.isOpenNow ? "Open" : "Closed"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              aria-label="Share menu"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className="w-9 h-9 rounded-full border border-[var(--dz-theme-border)] bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)] flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              aria-label="Restaurant Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          2. SCROLLABLE MAIN BODY CONTAINER (Changes by activeTab)
          ────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 pb-6 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {/* ========================================================================
            VIEW 1: MENU (Default Showcase)
            ======================================================================== */}
        {activeTab === "menu" && (
          <div className="animate-in fade-in duration-200">
            {/* 1. Full-Width Edge-to-Edge Hero Brand Section (Merged with page) */}
            <div className="w-full">
              {/* Hero Artwork with Seamless Bottom Fade */}
              {heroCoverUrl && (
                <div className="h-56 sm:h-72 w-full relative bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroCoverUrl}
                    alt={menu.restaurant.name}
                    className="w-full h-full object-cover"
                    style={getFramingTransformStyle(heroFraming)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--dz-theme-background)] from-0% via-[var(--dz-theme-background)]/80 via-20% via-[var(--dz-theme-background)]/20 via-40% to-transparent to-70%" />
                </div>
              )}

              {/* Brand Narrative & Info Row directly on page canvas */}
              <div className="px-4 sm:px-5 pb-3 pt-2 space-y-3.5">
                <div>
                  <h2
                    className="font-serif font-normal text-[var(--dz-theme-text)] break-words [overflow-wrap:anywhere]"
                    style={{
                      fontFamily: "var(--dz-theme-font-serif)",
                      fontSize: "var(--dz-theme-hero-title-size, clamp(1.875rem, 6vw, 2.25rem))",
                      letterSpacing: "var(--dz-theme-hero-title-tracking, -0.01em)",
                      lineHeight: "var(--dz-theme-hero-title-leading, 1.1)",
                    }}
                  >
                    {menu.restaurant.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--dz-theme-muted)] mt-1.5 font-normal tracking-normal">
                    {menu.restaurant.tagline || "Modern Mediterranean dining"}
                  </p>
                </div>

                {/* 3 Columns Info Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-[11px] pt-3.5 border-t border-[var(--dz-theme-border)]/50 items-start">
                  {/* 1. Operating Hours */}
                  <div className="flex items-start gap-1.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-[var(--dz-theme-text)]/75 stroke-[1.5] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span
                        className={`font-semibold block text-[11px] leading-tight truncate ${
                          menu.restaurant.schedule.isOpenNow
                            ? "text-emerald-600"
                            : isRosePalette
                            ? "text-rose-600"
                            : "text-red-600"
                        }`}
                      >
                        {menu.restaurant.schedule.isOpenNow ? "Open" : "Closed"}
                      </span>
                      <span className="text-[10px] text-[var(--dz-theme-muted)] block mt-0.5 leading-tight truncate">
                        {menu.restaurant.schedule.formattedHours || "12:00 — 23:00"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Location & Address */}
                  <div className="flex items-start gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[var(--dz-theme-text)]/75 stroke-[1.5] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-medium text-[var(--dz-theme-text)] block text-[11px] leading-tight truncate">
                        {menu.restaurant.contact.address || "12 Rue Didouche Mourad"}
                      </span>
                      <span className="text-[10px] text-[var(--dz-theme-muted)] block mt-0.5 leading-tight truncate">
                        {menu.restaurant.contact.city ? `${menu.restaurant.contact.city}, Algeria` : "Algiers, Algeria"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Direct Phone Number */}
                  <div className="flex items-start gap-1.5 min-w-0">
                    {menu.restaurant.contact.phone ? (
                      <a
                        href={`tel:${menu.restaurant.contact.phone}`}
                        className="flex items-start gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <Phone className="w-3.5 h-3.5 text-[var(--dz-theme-text)]/75 stroke-[1.5] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-medium text-[var(--dz-theme-text)] block text-[11px] leading-tight truncate">
                            {menu.restaurant.contact.phone}
                          </span>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-[var(--dz-theme-text)]/75 stroke-[1.5] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-medium text-[var(--dz-theme-text)] block text-[11px] leading-tight truncate">
                            +213 555 123 456
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Sticky Category Tabs Horizontal Navigation Bar (Flush with top header) */}
            <div className="sticky top-0 z-20 bg-[var(--dz-theme-background)] border-b border-[var(--dz-theme-border)] py-2 px-4 sm:px-5">
              <div className="flex items-center gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedCategoryId("all")}
                  className={`text-xs sm:text-sm font-serif font-medium tracking-wide transition-colors duration-150 whitespace-nowrap cursor-pointer flex flex-col items-center py-0.5 outline-none ${
                    selectedCategoryId === "all"
                      ? "text-[var(--dz-theme-text)]"
                      : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
                  }`}
                  style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                >
                  <span>Featured</span>
                  {selectedCategoryId === "all" ? (
                    <span className="w-full h-[2px] bg-[var(--dz-theme-accent)] rounded-full mt-0.5" />
                  ) : (
                    <span className="w-full h-[2px] bg-transparent mt-0.5" />
                  )}
                </button>

                {activeCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`text-xs sm:text-sm font-serif font-medium tracking-wide transition-colors duration-150 whitespace-nowrap cursor-pointer flex flex-col items-center py-0.5 outline-none ${
                      selectedCategoryId === category.id
                        ? "text-[var(--dz-theme-text)]"
                        : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
                    }`}
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    <span>{category.name}</span>
                    {selectedCategoryId === category.id ? (
                      <span className="w-full h-[2px] bg-[var(--dz-theme-accent)] rounded-full mt-0.5" />
                    ) : (
                      <span className="w-full h-[2px] bg-transparent mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. In-Page Content (Switches smoothly based on selectedCategoryId) */}
            <div className="pt-4 space-y-4">
            {selectedCategoryId === "all" ? (
              <>
                {/* 3a. Featured Showcase (Exactly 2 Dishes - High-End Editorial Presentation) */}
                {featuredItems.length > 0 && (
                  <div className="px-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--dz-theme-accent)] stroke-[1.75]" />
                        <h3
                          className="text-lg font-serif text-[var(--dz-theme-text)] font-medium"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          Featured
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("featured")}
                        className="text-xs font-serif text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-accent)] flex items-center gap-1 cursor-pointer transition-colors active:scale-95 py-1 px-1.5"
                        style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        aria-label="View all featured dishes"
                      >
                        <span>View all</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {featuredItems.slice(0, 2).map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => navigation.goToItem(dish.id)}
                          className="group rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] transition-all cursor-pointer shadow-xs flex flex-col justify-between active:scale-[0.98]"
                        >
                          <div>
                            {/* Dish Photo */}
                            <div className="h-32 sm:h-36 w-full relative bg-black/5 overflow-hidden">
                              {dish.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  style={getFramingTransformStyle(dish.framing)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                  🍽️
                                </div>
                              )}
                              {(dish.badge || dish.isFeatured) && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-[10px] font-serif text-[var(--dz-theme-accent)] shadow-xs">
                                  {formatBadgeLabel(dish.badge) || "Chef's pick"}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                              <h4
                                className="text-sm font-serif text-[var(--dz-theme-text)] font-medium leading-snug line-clamp-1 break-words [overflow-wrap:anywhere]"
                                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                              >
                                {dish.name}
                              </h4>
                              {dish.description && (
                                <p className="text-[11px] text-[var(--dz-theme-muted)] line-clamp-2 mt-1 leading-relaxed break-words [overflow-wrap:anywhere]">
                                  {dish.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bottom Row: Price & Leaf / Dietary */}
                          <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-[var(--dz-theme-border)]/40 mt-1">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className="text-xs sm:text-sm font-serif font-semibold text-[var(--dz-theme-text)]"
                                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                              >
                                {dish.formattedPrice}
                              </span>
                              {dish.hasActiveDiscount && dish.formattedOriginalPrice && (
                                <span className="text-[10px] text-[var(--dz-theme-muted)] line-through">
                                  {dish.formattedOriginalPrice}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {dish.hasActiveDiscount && dish.discountPercentage && (
                                <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-bold">
                                  -{dish.discountPercentage}%
                                </span>
                              )}
                              {dish.dietary.isVegetarian ? (
                                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                              ) : dish.dietary.isSpicy ? (
                                <Flame className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-[var(--dz-theme-accent)]" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3b. Chef's Recommendations Section (Horizontal Cards) */}
                {chefRecommendations.length > 0 && (
                  <div className="px-4 space-y-3 pt-2">
                    <h3
                      className="text-lg font-serif text-[var(--dz-theme-text)] font-medium"
                      style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                    >
                      Chef&apos;s Recommendations
                    </h3>

                    <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                      {chefRecommendations.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => navigation.goToItem(dish.id)}
                          className="w-36 shrink-0 rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <div className="h-24 w-full relative bg-black/5 overflow-hidden">
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
                                👨‍🍳
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <h4
                              className="text-xs font-serif text-[var(--dz-theme-text)] font-medium truncate"
                              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                            >
                              {dish.name}
                            </h4>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <p
                                className="text-[11px] font-serif font-semibold text-[var(--dz-theme-accent)]"
                                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                              >
                                {dish.formattedPrice}
                              </p>
                              {dish.hasActiveDiscount && dish.formattedOriginalPrice && (
                                <span className="text-[9px] text-[var(--dz-theme-muted)] line-through">
                                  {dish.formattedOriginalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3c. Categorized Dishes Showcase */}
                <div className="px-4 space-y-6 pt-2">
                  {activeCategories.map((category) => (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-baseline justify-between border-b border-[var(--dz-theme-border)] pb-2">
                        <h3
                          className="text-lg font-serif text-[var(--dz-theme-text)] font-medium"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          {category.name}
                        </h3>
                        <span className="text-[11px] text-[var(--dz-theme-muted)]">
                          {category.items.length} items
                        </span>
                      </div>

                      <div className="space-y-3">
                        {category.items.map((dish) => (
                          <DishHorizontalCard
                            key={dish.id}
                            dish={dish}
                            isFavorite={favorites.includes(dish.id)}
                            onToggleFavorite={(e) => toggleFavorite(e, dish.id)}
                            onClick={() => navigation.goToItem(dish.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Specific Category View (In-Page Filtered) */
              currentSelectedCategory && (
                <div className="px-4 space-y-4 pt-1">
                  {/* Category Banner if has image/desc */}
                  {(currentSelectedCategory.imageUrl || currentSelectedCategory.description) && (
                    <div className="relative rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] bg-[var(--dz-theme-surface)] shadow-xs">
                      {currentSelectedCategory.imageUrl ? (
                        <div className="h-40 sm:h-48 w-full relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentSelectedCategory.imageUrl}
                            alt={currentSelectedCategory.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                          <div className="absolute bottom-3.5 left-4 right-4 text-white">
                            <h2
                              className="text-xl sm:text-2xl font-serif leading-tight"
                              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                            >
                              {currentSelectedCategory.name}
                            </h2>
                            {currentSelectedCategory.description && (
                              <p className="text-xs text-white/80 mt-1 line-clamp-2">
                                {currentSelectedCategory.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-[var(--dz-theme-surface-raised)]">
                          <h2
                            className="text-xl font-serif text-[var(--dz-theme-text)]"
                            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                          >
                            {currentSelectedCategory.name}
                          </h2>
                          {currentSelectedCategory.description && (
                            <p className="text-xs text-[var(--dz-theme-muted)] mt-1">
                              {currentSelectedCategory.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dishes of this category */}
                  <div className="space-y-3">
                    {currentSelectedCategory.items.length === 0 ? (
                      <div className="p-8 text-center bg-[var(--dz-theme-surface)] rounded-2xl border border-[var(--dz-theme-border)]">
                        <span className="text-2xl">🍽️</span>
                        <p
                          className="text-xs font-serif text-[var(--dz-theme-muted)] mt-2"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          No dishes available in this section yet.
                        </p>
                      </div>
                    ) : (
                      currentSelectedCategory.items.map((dish) => (
                        <DishHorizontalCard
                          key={dish.id}
                          dish={dish}
                          isFavorite={favorites.includes(dish.id)}
                          onToggleFavorite={(e) => toggleFavorite(e, dish.id)}
                          onClick={() => navigation.goToItem(dish.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            )}
            </div>
          </div>
        )}

        {/* ========================================================================
            VIEW 2: SEARCH (Instant Filter & Exploration)
            ======================================================================== */}
        {activeTab === "search" && (
          <div className="px-4 pt-4 space-y-4 animate-in fade-in duration-200">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--dz-theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, ingredients, tags..."
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-sm text-[var(--dz-theme-text)] placeholder-[var(--dz-theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dz-theme-accent)] shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)] absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategoryId === "all"
                    ? "bg-[var(--dz-theme-text)] text-white border-[var(--dz-theme-text)]"
                    : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border-[var(--dz-theme-border)] hover:text-[var(--dz-theme-text)]"
                }`}
                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
              >
                All Categories
              </button>
              {activeCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategoryId === c.id
                      ? "bg-[var(--dz-theme-text)] text-white border-[var(--dz-theme-text)]"
                      : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border-[var(--dz-theme-border)] hover:text-[var(--dz-theme-text)]"
                  }`}
                  style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Dietary Filter Pills */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: "all", label: "All" },
                { id: "veg", label: "🌱 Vegetarian" },
                { id: "chef", label: "👨‍🍳 Chef's Pick" },
                { id: "spicy", label: "🌶️ Spicy" },
                { id: "gluten_free", label: "🌾 Gluten-Free" },
                { id: "favorites", label: "❤️ Favorites" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSearchDietaryFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                    searchDietaryFilter === pill.id
                      ? "bg-[var(--dz-theme-accent)] text-white border-[var(--dz-theme-accent)]"
                      : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border-[var(--dz-theme-border)] hover:text-[var(--dz-theme-text)]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search Results List */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs text-[var(--dz-theme-muted)]">
                <span>{searchResults.length} results found</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 text-center bg-[var(--dz-theme-surface)] rounded-2xl border border-[var(--dz-theme-border)]">
                  <span className="text-3xl">🔍</span>
                  <p
                    className="text-sm font-serif text-[var(--dz-theme-text)] font-medium mt-2"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    No dishes matched your search
                  </p>
                  <p className="text-xs text-[var(--dz-theme-muted)] mt-1">
                    Try different keywords or reset dietary filters
                  </p>
                </div>
              ) : (
                searchResults.map((dish) => (
                  <DishHorizontalCard
                    key={dish.id}
                    dish={dish}
                    isFavorite={favorites.includes(dish.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, dish.id)}
                    onClick={() => navigation.goToItem(dish.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================
            VIEW 3: RESTAURANT INFO & STORY (Screen 4)
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
              {/* Minimalist Info Top Bar (Non-sticky, centered restaurant name, back & share buttons) */}
              <div className="px-4 py-3 flex items-center justify-between bg-[var(--dz-theme-background)] shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--dz-theme-text)] hover:opacity-70 transition-opacity active:scale-95 cursor-pointer -ml-1"
                  aria-label="Back to menu"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
                </button>

                <h1
                  className="text-base sm:text-lg font-serif text-[var(--dz-theme-text)] font-normal text-center tracking-tight truncate px-2"
                  style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                >
                  {menu.restaurant.name}
                </h1>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--dz-theme-text)] hover:opacity-70 transition-opacity active:scale-95 cursor-pointer -mr-1"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Full-Width Edge-to-Edge Interior Ambience Photography (Clean No Gradient) */}
              {showAmbience && ambiencePhotoUrl && (
                <div className="h-44 sm:h-52 w-full relative bg-black/5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ambiencePhotoUrl}
                    alt={menu.restaurant.name}
                    className="w-full h-full object-cover"
                    style={getFramingTransformStyle(ambienceFraming)}
                  />
                </div>
              )}

              <div className="px-4 sm:px-5 pt-3 pb-8 space-y-5">
                {/* Restaurant Name & Narrative Tagline / Marketing Message */}
                <div className="space-y-1.5">
                  <h2
                    className="text-3xl sm:text-4xl font-serif font-normal text-[var(--dz-theme-text)] leading-[1.1] tracking-tight break-words [overflow-wrap:anywhere]"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    {menu.restaurant.name}
                  </h2>
                  {menu.restaurant.tagline && (
                    <p className="text-xs sm:text-sm leading-relaxed text-[var(--dz-theme-muted)] font-normal whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {menu.restaurant.tagline}
                    </p>
                  )}
                </div>

                {/* Structured Contact, Socials & Hours Rows (Unified Icon Badges) */}
                <div className="divide-y divide-[var(--dz-theme-border)] border-y border-[var(--dz-theme-border)]">
                  {/* 1. Opening Hours */}
                  {showHours && (
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <Clock className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          Opening Hours
                        </h4>
                        <p className="text-xs text-[var(--dz-theme-muted)] mt-0.5">
                          Monday — Sunday
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold text-[var(--dz-theme-text)]">
                            {menu.restaurant.schedule.formattedHours || "12:00 — 23:00"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              menu.restaurant.schedule.isOpenNow
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : isRosePalette
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
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
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <MapPin className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          Location
                        </h4>
                        <p className="text-xs text-[var(--dz-theme-text)] font-medium mt-0.5">
                          {menu.restaurant.contact.address}
                          {menu.restaurant.contact.city ? `, ${menu.restaurant.contact.city}` : ""}
                        </p>
                        {directionsUrl && (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-medium mt-1.5 hover:underline"
                          >
                            <span>Open in Google Maps</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Phone Contact */}
                  {showContact && menu.restaurant.contact.phone && (
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <Phone className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          Phone Contact
                        </h4>
                        <a
                          href={`tel:${menu.restaurant.contact.phone}`}
                          className="text-xs sm:text-sm font-semibold text-[var(--dz-theme-text)] mt-0.5 block hover:underline"
                        >
                          {menu.restaurant.contact.phone}
                        </a>
                        <a
                          href={`tel:${menu.restaurant.contact.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-medium mt-1.5 hover:underline"
                        >
                          <span>Call Directly</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 4. WhatsApp */}
                  {showWhatsapp && whatsappInfo && (
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <WhatsAppIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          WhatsApp
                        </h4>
                        <a
                          href={whatsappInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs sm:text-sm font-semibold text-[var(--dz-theme-text)] mt-0.5 block hover:underline"
                        >
                          {whatsappInfo.handle}
                        </a>
                        <a
                          href={whatsappInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-medium mt-1.5 hover:underline"
                        >
                          <span>Chat on WhatsApp</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 5. Instagram */}
                  {showSocials && instagramInfo && (
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <InstagramIcon className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          Instagram
                        </h4>
                        <a
                          href={instagramInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs sm:text-sm font-semibold text-[var(--dz-theme-text)] mt-0.5 block hover:underline"
                        >
                          {instagramInfo.handle}
                        </a>
                        <a
                          href={instagramInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-medium mt-1.5 hover:underline"
                        >
                          <span>Follow on Instagram</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 6. Facebook */}
                  {showSocials && facebookInfo && (
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <FacebookIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          Facebook
                        </h4>
                        <a
                          href={facebookInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs sm:text-sm font-semibold text-[var(--dz-theme-text)] mt-0.5 block hover:underline"
                        >
                          {facebookInfo.handle}
                        </a>
                        <a
                          href={facebookInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-medium mt-1.5 hover:underline"
                        >
                          <span>Visit Facebook Page</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 7. TikTok */}
                  {showSocials && tiktokInfo && (
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <TikTokIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          TikTok
                        </h4>
                        <a
                          href={tiktokInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs sm:text-sm font-semibold text-[var(--dz-theme-text)] mt-0.5 block hover:underline"
                        >
                          {tiktokInfo.handle}
                        </a>
                        <a
                          href={tiktokInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--dz-theme-accent)] font-medium mt-1.5 hover:underline"
                        >
                          <span>Watch on TikTok</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 8. Wi-Fi Details */}
                  {showWifi && menu.restaurant.wifi?.ssid && (
                    <div className="py-3.5 px-0 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-[var(--dz-theme-accent)] shrink-0 shadow-2xs mt-0.5">
                        <Wifi className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-[11px] font-serif font-medium text-[var(--dz-theme-muted)] uppercase tracking-wider"
                          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                        >
                          Guest Wi-Fi
                        </h4>
                        <p className="text-xs sm:text-sm text-[var(--dz-theme-text)] font-semibold mt-0.5">
                          Network: {menu.restaurant.wifi.ssid}
                        </p>
                        {menu.restaurant.wifi.password ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-[var(--dz-theme-text)] font-mono px-2.5 py-1 rounded-lg bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)]">
                              {menu.restaurant.wifi.password}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyWifi(e, menu.restaurant.wifi.password || "")}
                              className="px-2.5 py-1 rounded-lg bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-xs text-[var(--dz-theme-accent)] font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                            >
                              {wifiCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--dz-theme-muted)] mt-0.5">
                            No password required
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* "About the Restaurant" Section (Seamless on Page Canvas) */}
                {showAbout && (menu.restaurant.description || menu.restaurant.logoUrl || heroCoverUrl) && (
                  <div className="pt-2 space-y-3">
                    <h3
                      className="text-sm font-serif text-[var(--dz-theme-text)] font-semibold tracking-wide"
                      style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                    >
                      About the Restaurant
                    </h3>
                    <div className="flex gap-3.5 items-start">
                      {activeLogo || heroCoverUrl ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[var(--dz-theme-border)] relative bg-[var(--dz-theme-surface)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeLogo || heroCoverUrl || ""}
                            alt={menu.restaurant.name}
                            className="w-full h-full object-cover"
                            style={getFramingTransformStyle(activeLogo ? logoFraming : heroFraming)}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-2xl shrink-0">
                          🌿
                        </div>
                      )}
                      <p className="text-[11px] sm:text-xs leading-relaxed text-[var(--dz-theme-muted)] whitespace-pre-line break-words [overflow-wrap:anywhere] flex-1">
                        {menu.restaurant.description ||
                          `At ${menu.restaurant.name}, we celebrate the richness of fine dining with a modern touch. Our menu is inspired by seasonal ingredients, handcrafted recipes and the simple joy of sharing great food in a warm and elegant atmosphere.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ========================================================================
            VIEW 4: FEATURED & PROMOTIONAL SPECIALS (Dedicated "View All" Page)
            ======================================================================== */}
        {activeTab === "featured" && (
          <div className="animate-in fade-in duration-200">
            {/* Minimalist Top Bar matching Gourmet Info Style */}
            <div className="px-4 py-3 flex items-center justify-between bg-[var(--dz-theme-background)] shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("menu")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--dz-theme-text)] hover:opacity-70 transition-opacity active:scale-95 cursor-pointer -ml-1"
                aria-label="Back to menu"
              >
                <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
              </button>

              <h1
                className="text-base sm:text-lg font-serif text-[var(--dz-theme-text)] font-normal text-center tracking-tight truncate px-2"
                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
              >
                Featured &amp; Specials
              </h1>

              <button
                type="button"
                onClick={handleShare}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--dz-theme-text)] hover:opacity-70 transition-opacity active:scale-95 cursor-pointer -mr-1"
                aria-label="Share"
              >
                <Share className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            <div className="px-4 sm:px-5 pt-3 pb-6 space-y-5">
              {/* Header Narrative & Subtitle */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--dz-theme-accent)]">
                  <Sparkles className="w-4 h-4 stroke-[1.75]" />
                  <span
                    className="text-[11px] font-serif uppercase tracking-widest font-semibold"
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    Curated Selection
                  </span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-serif font-normal text-[var(--dz-theme-text)] leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                >
                  Featured Creations
                </h2>
                <p className="text-xs sm:text-sm text-[var(--dz-theme-muted)] font-normal leading-relaxed">
                  Explore our chef&apos;s recommendations, top-rated best sellers, and exclusive seasonal highlights.
                </p>
              </div>

              {/* Filter Pills / Badge Quick Filter */}
              {promotionalBadgeGroups.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedPromoBadge("all")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer border ${
                      selectedPromoBadge === "all"
                        ? "bg-[var(--dz-theme-text)] text-white border-[var(--dz-theme-text)] shadow-2xs"
                        : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border-[var(--dz-theme-border)] hover:text-[var(--dz-theme-text)]"
                    }`}
                    style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                  >
                    All Specials ({promotionalBadgeGroups.reduce((acc, g) => acc + g.items.length, 0)})
                  </button>
                  {promotionalBadgeGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedPromoBadge(group.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-serif whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                        selectedPromoBadge === group.id
                          ? "bg-[var(--dz-theme-text)] text-white border-[var(--dz-theme-text)] shadow-2xs"
                          : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border-[var(--dz-theme-border)] hover:text-[var(--dz-theme-text)]"
                      }`}
                      style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                    >
                      <span>{group.icon}</span>
                      <span>{group.title}</span>
                      <span className="opacity-70 text-[10px]">({group.items.length})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Grouped Badge Sections */}
              <div className="space-y-6 pt-1">
                {(selectedPromoBadge === "all"
                  ? promotionalBadgeGroups
                  : promotionalBadgeGroups.filter((g) => g.id === selectedPromoBadge)
                ).map((group) => (
                  <div key={group.id} className="space-y-3">
                    {/* Badge Section Header */}
                    <div className="border-b border-[var(--dz-theme-border)] pb-2 flex items-baseline justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{group.icon}</span>
                          <h3
                            className="text-lg font-serif text-[var(--dz-theme-text)] font-medium truncate"
                            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                          >
                            {group.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-[var(--dz-theme-muted)] mt-0.5 truncate">
                          {group.subtitle}
                        </p>
                      </div>
                      <span className="text-[11px] font-serif text-[var(--dz-theme-muted)] shrink-0 ml-2">
                        {group.items.length} {group.items.length === 1 ? "dish" : "dishes"}
                      </span>
                    </div>

                    {/* Dishes in this Badge Group */}
                    <div className="space-y-3">
                      {group.items.map((dish) => (
                        <DishHorizontalCard
                          key={`${group.id}-${dish.id}`}
                          dish={dish}
                          isFavorite={favorites.includes(dish.id)}
                          onToggleFavorite={(e) => toggleFavorite(e, dish.id)}
                          onClick={() => navigation.goToItem(dish.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. PERSISTENT 3-TAB BOTTOM NAVIGATION BAR (Screen 1, 2, 4)
          ────────────────────────────────────────────────────────────────────────── */}
      <nav className="sticky bottom-0 z-30 shrink-0 bg-[var(--dz-theme-background)] border-t border-[var(--dz-theme-border)] py-2.5 px-6 flex justify-around items-center w-full">
        <button
          type="button"
          onClick={() => {
            setActiveTab("menu");
            setSelectedCategoryId("all");
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 ${
            activeTab === "menu"
              ? "text-[var(--dz-theme-text)] font-semibold scale-105"
              : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span
            className="text-[10px] font-serif tracking-wider"
            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
          >
            Menu
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 ${
            activeTab === "search"
              ? "text-[var(--dz-theme-text)] font-semibold scale-105"
              : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
          }`}
        >
          <Search className="w-4 h-4" />
          <span
            className="text-[10px] font-serif tracking-wider"
            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
          >
            Search
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer py-1 ${
            activeTab === "info"
              ? "text-[var(--dz-theme-text)] font-semibold scale-105"
              : "text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)]"
          }`}
        >
          <Info className="w-4 h-4" />
          <span
            className="text-[10px] font-serif tracking-wider"
            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
          >
            Info
          </span>
        </button>
      </nav>
    </div>
  );
}

/**
 * Stacked Horizontal Dish Card (Matching Screen 2 in Mockup)
 */
function DishHorizontalCard({
  dish,
  isFavorite,
  onToggleFavorite,
  onClick,
}: {
  dish: MenuItemView;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group p-3 rounded-2xl border border-[var(--dz-theme-border)] bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] transition-all cursor-pointer shadow-xs flex items-center gap-3.5 active:scale-[0.99]"
    >
      {/* Dish Thumbnail */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/5 shrink-0 relative">
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
      </div>

      {/* Dish Information */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4
              className="text-sm sm:text-base font-serif text-[var(--dz-theme-text)] font-medium leading-snug line-clamp-1"
              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
            >
              {dish.name}
            </h4>
            <button
              type="button"
              onClick={onToggleFavorite}
              className="p-1 text-[var(--dz-theme-muted)] hover:text-rose-500 transition-colors shrink-0"
              aria-label="Save"
            >
              <Heart
                className={`w-3.5 h-3.5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
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
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-xs sm:text-sm font-serif font-semibold text-[var(--dz-theme-text)]"
              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
            >
              {dish.formattedPrice}
            </span>
            {dish.hasActiveDiscount && dish.formattedOriginalPrice && (
              <span className="text-[10px] text-[var(--dz-theme-muted)] line-through">
                {dish.formattedOriginalPrice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {dish.hasActiveDiscount && dish.discountPercentage && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-bold">
                -{dish.discountPercentage}%
              </span>
            )}
            {dish.badge ? (
              <span className="text-[10px] font-serif text-[var(--dz-theme-accent)] uppercase tracking-wider font-medium">
                {formatBadgeLabel(dish.badge)}
              </span>
            ) : dish.isFeatured ? (
              <span className="text-[10px] font-serif text-[var(--dz-theme-accent)] uppercase tracking-wider font-medium">
                Chef&apos;s pick
              </span>
            ) : null}
            {dish.dietary.isVegetarian && (
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            )}
            {dish.dietary.isSpicy && (
              <Flame className="w-3.5 h-3.5 text-red-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
