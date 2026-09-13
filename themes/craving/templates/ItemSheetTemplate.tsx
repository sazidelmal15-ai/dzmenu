"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Flame,
  Leaf,
  WheatOff,
  Heart,
  Share2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { ThemeRenderContext, MenuItemView } from "@/types/theme-contract";

export function CravingItemSheetTemplate({
  menu,
  activeView,
  navigation,
}: ThemeRenderContext) {
  const [isLiked, setIsLiked] = useState(false);

  // Find active dish
  const selectedItem: MenuItemView | null = useMemo(() => {
    if (!activeView.itemId) return null;
    for (const cat of menu.categories) {
      const found = cat.items.find((i) => i.id === activeView.itemId);
      if (found) return found;
    }
    return menu.featuredItems.find((i) => i.id === activeView.itemId) || null;
  }, [menu, activeView.itemId]);

  // Load favorite state
  useEffect(() => {
    if (!selectedItem) return;
    try {
      const stored = JSON.parse(localStorage.getItem("dz_craving_favorites") || "[]");
      setIsLiked(Array.isArray(stored) && stored.includes(selectedItem.id));
    } catch {
      // Ignore
    }
  }, [selectedItem]);

  const toggleLike = () => {
    if (!selectedItem) return;
    try {
      const stored: string[] = JSON.parse(
        localStorage.getItem("dz_craving_favorites") || "[]"
      );
      let updated: string[];
      if (stored.includes(selectedItem.id)) {
        updated = stored.filter((id) => id !== selectedItem.id);
        setIsLiked(false);
      } else {
        updated = [...stored, selectedItem.id];
        setIsLiked(true);
      }
      localStorage.setItem("dz_craving_favorites", JSON.stringify(updated));
    } catch {
      setIsLiked(!isLiked);
    }
  };

  const handleShare = async () => {
    if (!selectedItem) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${selectedItem.name} — ${menu.restaurant.name}`,
          text: selectedItem.description || `Check out ${selectedItem.name} on ${menu.restaurant.name}`,
          url: window.location.href,
        });
      } catch {
        // Dismissed
      }
    }
  };

  // Recommended pairings ("You might also like") — clean extension point
  const recommendedDishes = useMemo(() => {
    if (!selectedItem) return [];
    const all = menu.categories.flatMap((c) => c.items);
    return all
      .filter((i) => i.id !== selectedItem.id)
      .slice(0, 3);
  }, [menu.categories, selectedItem]);

  if (!selectedItem) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      {/* Backdrop click listener */}
      <div
        className="absolute inset-0"
        onClick={navigation.closeModal}
        aria-label="Close modal"
      />

      {/* Sheet Container: Bounded to 90% height */}
      <div className="relative w-full max-w-[440px] max-h-[90%] overflow-y-auto rounded-t-[32px] bg-[var(--dz-theme-background)] border-t border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-4" />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLike}
              className="p-2 rounded-full bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-muted)] hover:text-red-500 transition-colors cursor-pointer"
              aria-label="Favorite"
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-muted)] hover:text-[var(--dz-theme-text)] transition-colors cursor-pointer"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={navigation.closeModal}
            className="p-2 rounded-full bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Food Photo */}
        {selectedItem.imageUrl ? (
          <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] mb-4 bg-black/20 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              className="w-full h-full object-cover"
            />
            {selectedItem.isFeatured && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--dz-theme-primary)] text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-lg">
                <Flame className="w-3.5 h-3.5 fill-current" />
                BEST SELLER
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 w-full rounded-2xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-center text-5xl mb-4">
            🍔
          </div>
        )}

        {/* Dish Title & Price */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2
            className="text-xl sm:text-2xl font-black text-[var(--dz-theme-text)] leading-tight tracking-tight flex-1 break-words"
            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
          >
            {selectedItem.name}
          </h2>
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-xl sm:text-2xl font-black text-[var(--dz-theme-accent)] whitespace-nowrap">
                {selectedItem.formattedPrice}
              </span>
              {selectedItem.hasActiveDiscount && selectedItem.formattedOriginalPrice && (
                <span className="text-sm text-[var(--dz-theme-muted)] line-through font-bold">
                  {selectedItem.formattedOriginalPrice}
                </span>
              )}
            </div>
            {selectedItem.hasActiveDiscount && selectedItem.discountPercentage && (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-black uppercase tracking-wider">
                Save {selectedItem.discountPercentage}%
              </span>
            )}
          </div>
        </div>

        {/* Dietary Badges */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {selectedItem.dietary.isSpicy && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              Spicy
            </span>
          )}
          {selectedItem.dietary.isVegetarian && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              Vegetarian
            </span>
          )}
          {selectedItem.dietary.isGlutenFree && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <WheatOff className="w-3 h-3" />
              Gluten-Free
            </span>
          )}
          {selectedItem.badges.map((b) => (
            <span
              key={b}
              className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)]"
            >
              {b}
            </span>
          ))}
        </div>

        {/* Description */}
        {selectedItem.description && (
          <p className="text-xs sm:text-sm text-[var(--dz-theme-text)]/80 leading-relaxed mb-3 whitespace-pre-line break-words [overflow-wrap:anywhere]">
            {selectedItem.description}
          </p>
        )}

        {/* Ingredients Chips (Ordered strictly by restaurant owner) */}
        {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
          <div className="mb-4 space-y-1.5 pt-2 border-t border-[var(--dz-theme-border)]">
            <h3 className="text-xs font-black uppercase text-[var(--dz-theme-muted)] tracking-wider">
              Ingredients
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {selectedItem.ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-xs font-bold text-[var(--dz-theme-text)] shadow-2xs"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portion Sizes / Variants (if configured) */}
        {selectedItem.sizes.length > 0 && (
          <div className="mb-4 space-y-1.5 pt-2 border-t border-[var(--dz-theme-border)]">
            <h3 className="text-xs font-black uppercase text-[var(--dz-theme-muted)] tracking-wider">
              Available Sizes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedItem.sizes.map((s) => (
                <div
                  key={s.name}
                  className="p-2.5 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex justify-between items-center text-xs"
                >
                  <span className="font-bold text-[var(--dz-theme-text)]">{s.name}</span>
                  <span className="font-black text-[var(--dz-theme-accent)]">{String(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* "You might also like" (Recommended Pairings Cross-Sell Grid) */}
        {recommendedDishes.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--dz-theme-border)] space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--dz-theme-text)]">
              You might also like
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {recommendedDishes.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => navigation.goToItem(dish.id)}
                  className="rounded-xl overflow-hidden bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] p-2 hover:border-[var(--dz-theme-accent)] transition cursor-pointer group"
                >
                  <div className="h-16 w-full rounded-lg overflow-hidden bg-black/20 mb-1.5">
                    {dish.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <h4 className="text-[11px] font-black text-[var(--dz-theme-text)] truncate leading-tight">
                    {dish.name}
                  </h4>
                  <span className="text-[10px] font-black text-[var(--dz-theme-accent)] mt-0.5 block">
                    {dish.formattedPrice}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Close Button (Clean Menu Mode — Zero Cart) */}
        <button
          type="button"
          onClick={navigation.closeModal}
          className="w-full py-3 rounded-2xl bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] font-black text-xs transition active:scale-[0.98] cursor-pointer mt-4"
        >
          Close • إغلاق
        </button>
      </div>
    </div>
  );
}
