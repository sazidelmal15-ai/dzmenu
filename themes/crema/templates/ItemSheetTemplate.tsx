"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Heart,
  Share2,
  Check,
  Flame,
  Leaf,
  Info,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Star,
  Crown,
  Tag,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ThemeRenderContext, MenuItemView } from "@/types/theme-contract";

interface CremaBadgeConfig {
  label: string;
  renderIcon: (className?: string) => React.ReactNode;
}

interface CremaTagConfig {
  label: string;
  renderIcon: (className?: string) => React.ReactNode;
}

const CREMA_BADGE_CONFIG: Record<string, CremaBadgeConfig> = {
  CHEF_PICK: {
    label: "Chef's Selection",
    renderIcon: (cls = "w-3.5 h-3.5 text-amber-600") => <Sparkles className={cls} />,
  },
  BEST_SELLER: {
    label: "House Favorite",
    renderIcon: (cls = "w-3.5 h-3.5 fill-amber-500 text-amber-500") => <Star className={cls} />,
  },
  NEW: {
    label: "New Creation",
    renderIcon: (cls = "w-3.5 h-3.5 text-rose-500") => <Sparkles className={cls} />,
  },
  SIGNATURE: {
    label: "Maison Signature",
    renderIcon: (cls = "w-3.5 h-3.5 text-amber-700") => <Crown className={cls} />,
  },
  SPECIAL_OFFER: {
    label: "Curated Offer",
    renderIcon: (cls = "w-3.5 h-3.5 text-emerald-700") => <Tag className={cls} />,
  },
};

const CREMA_TAG_CONFIG: Record<string, CremaTagConfig> = {
  spicy: {
    label: "Spicy",
    renderIcon: (cls = "w-3.5 h-3.5 text-rose-500") => <Flame className={cls} />,
  },
  vegetarian: {
    label: "Vegetarian",
    renderIcon: (cls = "w-3.5 h-3.5 text-emerald-600") => <Leaf className={cls} />,
  },
  vegan: {
    label: "Plant-Based",
    renderIcon: (cls = "w-3.5 h-3.5 text-emerald-700") => <Leaf className={cls} />,
  },
  gluten_free: {
    label: "Gluten-Free",
    renderIcon: () => (
      <span className="font-bold text-[9.5px] tracking-tighter text-amber-800 leading-none">GF</span>
    ),
  },
  nuts: {
    label: "Contains Nuts",
    renderIcon: (cls = "w-3.5 h-3.5 text-amber-800") => <AlertCircle className={cls} />,
  },
};

export function CremaItemSheetTemplate({
  menu,
  activeView,
  navigation,
}: ThemeRenderContext) {
  const selectedItem: MenuItemView | null = useMemo(() => {
    if (!activeView.itemId) return null;
    for (const cat of menu.categories) {
      const found = cat.items.find((i) => i.id === activeView.itemId);
      if (found) return found;
    }
    return menu.featuredItems.find((i) => i.id === activeView.itemId) || null;
  }, [menu, activeView.itemId]);

  // 2-Stage Bottom Sheet: Peek (Initial Collapsed) vs Expanded (Swiped / Clicked)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Favorite / Like State (synced safely with localStorage)
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedItem || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`dzmenu_crema_favs_${menu.restaurant.id}`);
      if (saved) {
        const favs = JSON.parse(saved);
        setIsFavorite(Boolean(favs[selectedItem.id]));
      }
    } catch {
      // ignore
    }
  }, [menu.restaurant.id, selectedItem]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedItem) return;
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const key = `dzmenu_crema_favs_${menu.restaurant.id}`;
      const saved = localStorage.getItem(key);
      const favs = saved ? JSON.parse(saved) : {};
      favs[selectedItem.id] = next;
      localStorage.setItem(key, JSON.stringify(favs));
    } catch {
      // ignore
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedItem || typeof window === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedItem.name,
          text: selectedItem.description || `${selectedItem.name} at ${menu.restaurant.name}`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Touch Swipe Handlers for the Header / Handle Area & Peek Card
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const isAtTop = scrollContainerRef.current ? scrollContainerRef.current.scrollTop <= 5 : true;

    if (!isExpanded) {
      // In peek mode: swipe up to expand, swipe down to close modal
      if (diff > 25 && hasExtraDetails) {
        setIsExpanded(true);
      } else if (diff < -35) {
        navigation.closeModal();
      }
    } else {
      // In expanded mode: if user is at the top and swipes down, collapse back to peek
      if (diff < -45 && isAtTop) {
        handleCollapse();
      }
    }
    touchStartY.current = null;
  };

  // Desktop Mouse Wheel support
  const handleWheel = (e: React.WheelEvent) => {
    if (!isExpanded && e.deltaY > 15 && hasExtraDetails) {
      setIsExpanded(true);
    }
  };

  if (!selectedItem) return null;

  const hasSizes = selectedItem.sizes && selectedItem.sizes.length > 0;
  const hasVariants = selectedItem.variants && selectedItem.variants.length > 0;
  const hasExtras = selectedItem.extras && selectedItem.extras.length > 0;
  const dietary = selectedItem.dietary || {};
  const hasDietary =
    (Array.isArray(selectedItem.tags) && selectedItem.tags.length > 0) ||
    dietary.isVegetarian ||
    dietary.isVegan ||
    dietary.isGlutenFree ||
    dietary.isSpicy;

  const hasExtraDetails = hasSizes || hasVariants || hasExtras || hasDietary;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center select-none overflow-hidden">
      {/* Animated Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={navigation.closeModal}
        aria-label="Close modal"
      />

      {/* 2-Stage Smooth Bottom Sheet */}
      <motion.div
        ref={scrollContainerRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{
          type: "spring",
          damping: 28,
          stiffness: 280,
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[430px] rounded-t-[32px] p-5 pb-6 border-t z-10 max-h-[88vh] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        style={{
          backgroundColor: "var(--dz-theme-surface, #FFFFFF)",
          borderColor: "var(--dz-theme-border)",
          color: "var(--dz-theme-text)",
          boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Top Drag Handle Bar */}
        <button
          type="button"
          onClick={() => {
            if (!hasExtraDetails) return;
            if (isExpanded) {
              handleCollapse();
            } else {
              setIsExpanded(true);
            }
          }}
          className="w-full flex flex-col items-center justify-center -mt-1 mb-3 cursor-pointer py-1 group"
          aria-label={isExpanded ? "Collapse sheet" : "Expand sheet"}
        >
          <div
            className="w-12 h-1.5 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:scale-105"
            style={{ backgroundColor: "var(--dz-theme-border)" }}
          />
        </button>

        {/* 1. Dish Hero Photo with Floating Heart & Close Buttons */}
        {selectedItem.imageUrl ? (
          <div
            className="relative w-full h-48 sm:h-56 rounded-[22px] overflow-hidden border mb-3.5 shadow-sm group"
            style={{
              backgroundColor: "var(--dz-theme-surface-raised)",
              borderColor: "var(--dz-theme-border)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Top-Left: Heart Like Button */}
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={isFavorite ? "Unlike" : "Like"}
              className="absolute left-3 top-3 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer shadow-md active:scale-75 md:hover:scale-110 backdrop-blur-md"
              style={{
                backgroundColor: isFavorite
                  ? "var(--dz-theme-accent)"
                  : "rgba(255, 255, 255, 0.9)",
                color: isFavorite ? "#FFFFFF" : "var(--dz-theme-accent)",
              }}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  isFavorite ? "fill-white scale-110" : "fill-transparent scale-100"
                }`}
              />
            </button>

            {/* Top-Right: Close Button */}
            <button
              type="button"
              onClick={navigation.closeModal}
              aria-label="Close"
              className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-transform duration-150 active:scale-90 md:hover:scale-110 cursor-pointer backdrop-blur-md bg-white/90"
              style={{ color: "var(--dz-theme-text)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Header when no image exists */
          <div
            className="flex items-center justify-between mb-3 pb-2 border-b"
            style={{ borderColor: "var(--dz-theme-border)" }}
          >
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={isFavorite ? "Unlike" : "Like"}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer border active:scale-75 md:hover:scale-110"
              style={{
                backgroundColor: isFavorite
                  ? "var(--dz-theme-accent)"
                  : "var(--dz-theme-surface-raised)",
                color: isFavorite ? "#FFFFFF" : "var(--dz-theme-accent)",
                borderColor: isFavorite
                  ? "var(--dz-theme-accent)"
                  : "var(--dz-theme-border)",
              }}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  isFavorite ? "fill-white scale-110" : "fill-transparent scale-100"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={navigation.closeModal}
              aria-label="Close"
              className="w-9 h-9 rounded-full border flex items-center justify-center transition-transform duration-150 active:scale-90 md:hover:scale-110 cursor-pointer"
              style={{
                backgroundColor: "var(--dz-theme-surface-raised)",
                borderColor: "var(--dz-theme-border)",
                color: "var(--dz-theme-text)",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Dish Title & Price (Always visible in initial peek) */}
        <div>
          {/* Luxury Boutique Crema Promotional Badge */}
          {selectedItem.badge && CREMA_BADGE_CONFIG[selectedItem.badge] && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-bold tracking-wide mb-2 shadow-xs border"
              style={{
                backgroundColor: "var(--dz-theme-surface-raised)",
                borderColor: "var(--dz-theme-border)",
                color: "var(--dz-theme-accent)",
              }}
            >
              {CREMA_BADGE_CONFIG[selectedItem.badge].renderIcon("w-3.5 h-3.5 shrink-0")}
              <span>{CREMA_BADGE_CONFIG[selectedItem.badge].label}</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mt-0.5">
            <h2
              className="text-lg sm:text-xl font-serif font-bold tracking-tight leading-tight"
              style={{ color: "var(--dz-theme-text)" }}
            >
              {selectedItem.name}
            </h2>

            <span
              className="text-base sm:text-lg font-serif font-bold whitespace-nowrap tracking-tight"
              style={{ color: "var(--dz-theme-price)" }}
            >
              {Number(selectedItem.price).toLocaleString()} {menu.restaurant.currency}
            </span>
          </div>
        </div>

        {/* 3. Description (Always visible in initial peek) */}
        {selectedItem.description && (
          <p
            className="text-xs leading-relaxed mt-2 font-normal"
            style={{ color: "var(--dz-theme-muted)" }}
          >
            {selectedItem.description}
          </p>
        )}

        {/* 4. Swipe Up / View Options Trigger Button (shown in collapsed mode) */}
        {hasExtraDetails && !isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full mt-3.5 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold border transition-all hover:opacity-100 active:scale-95"
            style={{
              backgroundColor: "var(--dz-theme-surface-raised)",
              borderColor: "var(--dz-theme-border)",
              color: "var(--dz-theme-accent)",
            }}
          >
            <ChevronUp className="w-3.5 h-3.5 animate-bounce" />
            <span className="text-[11px]">View sizes & options</span>
          </button>
        )}

        {/* 5. Silky Smooth CSS Grid Accordion for Extra Details (Zero Glitch / Zero Jumps) */}
        <div
          className="grid"
          style={{
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
            opacity: isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? "auto" : "none",
            transition: "grid-template-rows 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease",
          }}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className="mt-4 pt-4 border-t space-y-4"
              style={{ borderColor: "var(--dz-theme-border)" }}
            >
              {/* Dietary Badges */}
              {hasDietary && (
                <div>
                  <h4
                    className="text-xs font-serif font-bold tracking-wider uppercase mb-2"
                    style={{ color: "var(--dz-theme-accent)" }}
                  >
                    Dietary & Attributes
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Array.isArray(selectedItem.tags) && selectedItem.tags.length > 0
                      ? selectedItem.tags.map((t) => {
                          const def = CREMA_TAG_CONFIG[t];
                          if (!def) return null;
                          return (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                              style={{
                                backgroundColor: "var(--dz-theme-surface-raised)",
                                borderColor: "var(--dz-theme-border)",
                                color: "var(--dz-theme-text)",
                              }}
                            >
                              {def.renderIcon("w-3.5 h-3.5 shrink-0")}
                              <span>{def.label}</span>
                            </span>
                          );
                        })
                      : (
                          <>
                            {dietary.isVegetarian && (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                                style={{
                                  backgroundColor: "var(--dz-theme-surface-raised)",
                                  borderColor: "var(--dz-theme-border)",
                                }}
                              >
                                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                                Vegetarian
                              </span>
                            )}
                            {dietary.isVegan && (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                                style={{
                                  backgroundColor: "var(--dz-theme-surface-raised)",
                                  borderColor: "var(--dz-theme-border)",
                                }}
                              >
                                <Leaf className="w-3.5 h-3.5 text-green-700" />
                                Plant-Based
                              </span>
                            )}
                            {dietary.isGlutenFree && (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border font-serif"
                                style={{
                                  backgroundColor: "var(--dz-theme-surface-raised)",
                                  borderColor: "var(--dz-theme-border)",
                                }}
                              >
                                <span className="font-bold text-[10px] text-amber-800">GF</span>
                                Gluten-Free
                              </span>
                            )}
                            {dietary.isSpicy && (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                                style={{
                                  backgroundColor: "var(--dz-theme-surface-raised)",
                                  borderColor: "var(--dz-theme-border)",
                                }}
                              >
                                <Flame className="w-3.5 h-3.5 text-rose-500" />
                                Spicy
                              </span>
                            )}
                          </>
                        )}
                  </div>
                </div>
              )}

              {/* Available Sizes */}
              {hasSizes && (
                <div>
                  <h4
                    className="text-xs font-serif font-bold tracking-wider uppercase mb-2"
                    style={{ color: "var(--dz-theme-accent)" }}
                  >
                    Available Sizes (الأحجام والأسعار)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.sizes.map((size, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-2xl border flex items-center justify-between"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                        }}
                      >
                        <span className="text-xs font-bold">{size.name}</span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: "var(--dz-theme-price)" }}
                        >
                          {Number(size.price).toLocaleString()} {menu.restaurant.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants & Options */}
              {hasVariants && (
                <div>
                  <h4
                    className="text-xs font-serif font-bold tracking-wider uppercase mb-2"
                    style={{ color: "var(--dz-theme-accent)" }}
                  >
                    Variants (الخيارات المتاحة)
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedItem.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                        }}
                      >
                        <span>{variant.name}</span>
                        {variant.price ? (
                          <span
                            className="font-bold"
                            style={{ color: "var(--dz-theme-price)" }}
                          >
                            +{Number(variant.price).toLocaleString()} {menu.restaurant.currency}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extras & Add-ons */}
              {hasExtras && (
                <div>
                  <h4
                    className="text-xs font-serif font-bold tracking-wider uppercase mb-2"
                    style={{ color: "var(--dz-theme-accent)" }}
                  >
                    Extras & Add-ons (الإضافات المتاحة)
                  </h4>
                  <div className="space-y-1.5">
                    {selectedItem.extras.map((extra, idx) => (
                      <div
                        key={idx}
                        className="p-2 px-3 rounded-xl border flex items-center justify-between text-xs"
                        style={{
                          backgroundColor: "var(--dz-theme-surface-raised)",
                          borderColor: "var(--dz-theme-border)",
                        }}
                      >
                        <span className="font-medium">+ {extra.name}</span>
                        <span
                          className="font-bold"
                          style={{ color: "var(--dz-theme-price)" }}
                        >
                          {Number(extra.price).toLocaleString()} {menu.restaurant.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preparation Note */}
              <div
                className="p-2.5 rounded-2xl border flex items-center gap-2 text-xs opacity-80"
                style={{
                  backgroundColor: "var(--dz-theme-search-bg)",
                  borderColor: "var(--dz-theme-search-border)",
                  color: "var(--dz-theme-muted)",
                }}
              >
                <Info className="w-3.5 h-3.5 shrink-0 text-[var(--dz-theme-accent)]" />
                <span>Freshly crafted with artisan ingredients.</span>
              </div>

              {/* Share Dish Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 rounded-full text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: "var(--dz-theme-surface-raised)",
                    borderColor: "var(--dz-theme-border)",
                    color: "var(--dz-theme-text)",
                  }}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link Copied! (تم نسخ الرابط)</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Dish (مشاركة الصنف)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collapse Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleCollapse}
                  className="flex items-center gap-1 text-[11px] font-bold opacity-75 hover:opacity-100 cursor-pointer"
                  style={{ color: "var(--dz-theme-muted)" }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Collapse (إخفاء التفاصيل)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
