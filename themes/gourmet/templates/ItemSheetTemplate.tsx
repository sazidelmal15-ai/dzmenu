"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  X,
  Heart,
  Sparkles,
  Flame,
  Leaf,
  WheatOff,
  Share2,
} from "lucide-react";
import type { ThemeRenderContext, MenuItemView } from "@/types/theme-contract";

export function GourmetItemSheetTemplate({
  menu,
  activeView,
  navigation,
}: ThemeRenderContext) {
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Find target item
  const selectedItem: MenuItemView | null = useMemo(() => {
    if (!activeView.itemId) return null;
    for (const cat of menu.categories) {
      const found = cat.items.find((i) => i.id === activeView.itemId);
      if (found) return found;
    }
    return menu.featuredItems.find((i) => i.id === activeView.itemId) || null;
  }, [menu, activeView.itemId]);

  useEffect(() => {
    if (!selectedItem) return;
    try {
      const storedLikes = JSON.parse(localStorage.getItem("dz_gourmet_favorites") || "[]");
      setIsLiked(storedLikes.includes(selectedItem.id));
    } catch {
      // Ignore
    }
  }, [selectedItem]);

  const toggleLike = () => {
    if (!selectedItem) return;
    try {
      const storedLikes: string[] = JSON.parse(
        localStorage.getItem("dz_gourmet_favorites") || "[]"
      );
      let updated: string[];
      if (storedLikes.includes(selectedItem.id)) {
        updated = storedLikes.filter((id) => id !== selectedItem.id);
        setIsLiked(false);
      } else {
        updated = [...storedLikes, selectedItem.id];
        setIsLiked(true);
      }
      localStorage.setItem("dz_gourmet_favorites", JSON.stringify(updated));
    } catch {
      setIsLiked(!isLiked);
    }
  };

  const ingredientsList = useMemo(() => {
    if (!selectedItem?.description) return [];
    const text = selectedItem.description;
    if (text.includes("•")) {
      return text.split("•").map((s) => s.trim()).filter(Boolean);
    }
    if (text.includes(",")) {
      return text.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [selectedItem]);

  if (!selectedItem) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click listener */}
      <div
        className="absolute inset-0"
        onClick={navigation.closeModal}
        aria-label="Close dialog"
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-[440px] max-h-[90%] overflow-y-auto rounded-t-[32px] bg-[var(--dz-theme-background)] border-t border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 rounded-full bg-[var(--dz-theme-border)] mx-auto mb-4" />

        {/* Top Control Buttons */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={toggleLike}
            className={`p-2 rounded-full border border-[var(--dz-theme-border)] transition-all cursor-pointer ${
              isLiked
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] hover:text-rose-500"
            }`}
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>

          <button
            type="button"
            onClick={navigation.closeModal}
            className="p-2 rounded-full bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dish Image */}
        {selectedItem.imageUrl && (
          <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] mb-4 bg-black/5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              className="w-full h-full object-cover"
            />
            {selectedItem.isFeatured && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--dz-theme-surface)] text-[var(--dz-theme-accent)] text-[11px] font-serif tracking-wide flex items-center gap-1 shadow-md border border-[var(--dz-theme-border)]">
                <Sparkles className="w-3 h-3 text-[var(--dz-theme-accent)]" />
                <span>Chef&apos;s Recommendation</span>
              </div>
            )}
          </div>
        )}

        {/* Dish Title & Price */}
        <div className="flex justify-between items-start gap-4 mb-2">
          <h2
            className="text-xl sm:text-2xl font-serif text-[var(--dz-theme-text)]"
            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
          >
            {selectedItem.name}
          </h2>
          <span
            className="text-lg font-serif font-semibold text-[var(--dz-theme-text)] shrink-0"
            style={{ fontFamily: "var(--dz-theme-font-serif)" }}
          >
            {selectedItem.formattedPrice}
          </span>
        </div>

        {/* Dietary Badges */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {selectedItem.dietary.isVegetarian && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              <span>Vegetarian</span>
            </span>
          )}
          {selectedItem.dietary.isSpicy && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-800 border border-red-200 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>Spicy</span>
            </span>
          )}
          {selectedItem.badges.map((b) => (
            <span
              key={b}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)]"
            >
              {b}
            </span>
          ))}
        </div>

        {/* Description */}
        {selectedItem.description && (
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--dz-theme-text)]/80 mb-4 whitespace-pre-line break-words [overflow-wrap:anywhere]">
            {selectedItem.description}
          </p>
        )}

        {/* Ingredients if available */}
        {ingredientsList.length > 0 && (
          <div className="mb-4 space-y-1.5 pt-2 border-t border-[var(--dz-theme-border)]">
            <h3
              className="text-xs font-serif text-[var(--dz-theme-text)] font-semibold uppercase tracking-wider"
              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
            >
              Ingredients
            </h3>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--dz-theme-muted)]">
              {ingredientsList.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-lg bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Variants / Sizes (Informational) */}
        {selectedItem.sizes.length > 0 && (
          <div className="mb-4 space-y-2 pt-2 border-t border-[var(--dz-theme-border)]">
            <h3
              className="text-xs font-serif text-[var(--dz-theme-text)] font-semibold uppercase tracking-wider"
              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
            >
              Portion Sizes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedItem.sizes.map((s) => (
                <div
                  key={s.name}
                  className="p-2.5 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex justify-between items-center text-xs"
                >
                  <span className="text-[var(--dz-theme-text)]">{s.name}</span>
                  <span className="font-serif font-semibold text-[var(--dz-theme-accent)]">
                    {String(s.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button at bottom (NO Cart / No Add-to-Order CTA) */}
        <button
          type="button"
          onClick={navigation.closeModal}
          className="w-full py-3 px-5 rounded-2xl bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-text)] border border-[var(--dz-theme-border)] font-serif font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] mt-4 cursor-pointer"
          style={{ fontFamily: "var(--dz-theme-font-serif)" }}
        >
          <span>إغلاق • Close</span>
        </button>
      </div>
    </div>
  );
}
