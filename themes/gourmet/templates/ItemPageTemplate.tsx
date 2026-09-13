"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ChevronLeft,
  Heart,
  Sparkles,
  Flame,
  Leaf,
  WheatOff,
  Milk,
  Share2,
  UtensilsCrossed,
} from "lucide-react";
import type { ThemeRenderContext, MenuItemView } from "@/types/theme-contract";

export function GourmetItemPageTemplate({
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

  // Read initial like state from localStorage
  useEffect(() => {
    if (!selectedItem) return;
    try {
      const storedLikes = JSON.parse(localStorage.getItem("dz_gourmet_favorites") || "[]");
      setIsLiked(storedLikes.includes(selectedItem.id));
    } catch {
      // Ignore storage errors
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

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share && selectedItem) {
      try {
        await navigator.share({
          title: `${selectedItem.name} | ${menu.restaurant.name}`,
          text: selectedItem.description || `Discover ${selectedItem.name} at ${menu.restaurant.name}`,
          url: window.location.href,
        });
      } catch {
        // User dismissed share dialog
      }
    }
  };

  // Find parent category
  const parentCategory = useMemo(() => {
    if (!selectedItem || !selectedItem.categoryId) return null;
    return menu.categories.find((c) => c.id === selectedItem.categoryId) || null;
  }, [menu, selectedItem]);

  // Extract ingredients list from description if available
  const ingredientsList = useMemo(() => {
    if (selectedItem?.ingredients && selectedItem.ingredients.length > 0) {
      return selectedItem.ingredients;
    }
    if (!selectedItem?.description) return [];
    // If description contains commas or bullet points, split into list items
    const text = selectedItem.description;
    if (text.includes("•")) {
      return text.split("•").map((s) => s.trim()).filter(Boolean);
    }
    if (text.includes(",")) {
      return text.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (text.includes("\n")) {
      return text.split("\n").map((s) => s.trim().replace(/^[-*•]\s*/, "")).filter(Boolean);
    }
    return [];
  }, [selectedItem]);

  // Handle item not found
  if (!selectedItem) {
    return (
      <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[var(--dz-theme-background)] text-[var(--dz-theme-text)]">
        <div className="w-16 h-16 rounded-full bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] flex items-center justify-center text-2xl mb-4">
          🍽️
        </div>
        <h2 className="text-lg font-serif mb-2" style={{ fontFamily: "var(--dz-theme-font-serif)" }}>
          Dish Not Found
        </h2>
        <p className="text-xs text-[var(--dz-theme-muted)] mb-6 max-w-xs">
          The requested dish could not be located in the menu.
        </p>
        <button
          type="button"
          onClick={navigation.goToMain}
          className="px-5 py-2.5 rounded-full bg-[var(--dz-theme-primary)] text-white font-medium text-xs flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>العودة إلى القائمة • Back to Menu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 relative select-none bg-[var(--dz-theme-background)] text-[var(--dz-theme-text)] overflow-hidden animate-in fade-in duration-200">
      {/* 1. Sticky Minimalist Top Bar */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-[var(--dz-theme-background)] border-b border-[var(--dz-theme-border)] flex items-center justify-between gap-3 shrink-0 relative">
        <button
          type="button"
          onClick={navigation.goToMain}
          className="relative z-10 w-9 h-9 rounded-full bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-text)] border border-[var(--dz-theme-border)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-sm"
          aria-label="Back to menu"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {parentCategory && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-24">
            <span
              className="text-xs sm:text-sm font-serif tracking-wide text-[var(--dz-theme-text)] font-medium truncate"
              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
            >
              {parentCategory.name}
            </span>
          </div>
        )}

        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-sm"
            aria-label="Share dish"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleLike}
            className={`w-9 h-9 rounded-full border border-[var(--dz-theme-border)] flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm ${
              isLiked
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] hover:text-rose-500"
            }`}
            aria-label="Save favorite"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Detail Content */}
      <div className="flex-1 overflow-y-auto pb-16 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {/* Large Food Photography */}
        {selectedItem.imageUrl ? (
          <div className="relative w-full h-72 sm:h-80 bg-black/5 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--dz-theme-background)] via-transparent to-transparent opacity-80" />
            {selectedItem.isFeatured && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[var(--dz-theme-surface)] text-[var(--dz-theme-accent)] text-xs font-serif tracking-wide flex items-center gap-1.5 shadow-md border border-[var(--dz-theme-border)]">
                <Sparkles className="w-3 h-3 text-[var(--dz-theme-accent)]" />
                <span>Chef&apos;s Recommendation</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-44 bg-[var(--dz-theme-surface-raised)] border-b border-[var(--dz-theme-border)] flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}

        {/* Dish Information Section */}
        <div className="px-5 pt-5 pb-8 space-y-5">
          {/* Title & Price Header */}
          <div className="flex items-start justify-between gap-4">
            <h1
              className="text-2xl sm:text-3xl font-serif text-[var(--dz-theme-text)] leading-tight flex-1 break-words [overflow-wrap:anywhere]"
              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
            >
              {selectedItem.name}
            </h1>
            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-2 justify-end">
                <span
                  className="text-xl sm:text-2xl font-serif text-[var(--dz-theme-text)] font-semibold tracking-tight"
                  style={{ fontFamily: "var(--dz-theme-font-serif)" }}
                >
                  {selectedItem.formattedPrice}
                </span>
                {selectedItem.hasActiveDiscount && selectedItem.formattedOriginalPrice && (
                  <span className="text-sm text-[var(--dz-theme-muted)] line-through font-medium">
                    {selectedItem.formattedOriginalPrice}
                  </span>
                )}
              </div>
              {selectedItem.hasActiveDiscount && selectedItem.discountPercentage && (
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-serif font-semibold tracking-wider">
                  Save {selectedItem.discountPercentage}%
                </span>
              )}
            </div>
          </div>




          {/* Full Narrative Description */}
          {selectedItem.description && (
            <p className="text-xs sm:text-sm text-[var(--dz-theme-text)]/85 leading-relaxed font-normal whitespace-pre-line break-words [overflow-wrap:anywhere]">
              {selectedItem.description}
            </p>
          )}

          {/* Dietary & Characteristic Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedItem.isFeatured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-text)] border border-[var(--dz-theme-border)] text-[11px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[var(--dz-theme-accent)]" />
                <span>Chef&apos;s recommendation</span>
              </span>
            )}
            {selectedItem.dietary.isVegetarian && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vegetarian</span>
              </span>
            )}
            {selectedItem.dietary.isVegan && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vegan</span>
              </span>
            )}
            {selectedItem.dietary.isGlutenFree && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                <WheatOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Gluten-Free</span>
              </span>
            )}
            {selectedItem.dietary.isSpicy && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-[11px] font-medium">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                <span>Spicy</span>
              </span>
            )}
            {selectedItem.badges?.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)] text-[11px] font-medium"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="border-t border-[var(--dz-theme-border)] pt-4" />

          {/* Ingredients Section */}
          {ingredientsList.length > 0 && (
            <div className="space-y-3">
              <h2
                className="text-base font-serif text-[var(--dz-theme-text)] font-medium tracking-wide"
                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
              >
                Ingredients
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--dz-theme-muted)]">
                {ingredientsList.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--dz-theme-accent)] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Available Sizes / Variations (Informational Only - No Cart) */}
          {selectedItem.sizes && selectedItem.sizes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h2
                className="text-sm font-serif text-[var(--dz-theme-text)] font-medium tracking-wide"
                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
              >
                Available Portions
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {selectedItem.sizes.map((size) => (
                  <div
                    key={size.name}
                    className="p-3 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-between text-xs shadow-sm"
                  >
                    <span className="font-medium text-[var(--dz-theme-text)]">{size.name}</span>
                    <span className="font-serif font-semibold text-[var(--dz-theme-accent)]">
                      {String(size.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Extras (Informational Only - No Cart) */}
          {selectedItem.extras && selectedItem.extras.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h2
                className="text-sm font-serif text-[var(--dz-theme-text)] font-medium tracking-wide"
                style={{ fontFamily: "var(--dz-theme-font-serif)" }}
              >
                Optional Accompaniments
              </h2>
              <div className="space-y-2">
                {selectedItem.extras.map((extra) => (
                  <div
                    key={extra.name}
                    className="p-3 rounded-xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] flex items-center justify-between text-xs shadow-sm"
                  >
                    <span className="text-[var(--dz-theme-text)]">{extra.name}</span>
                    <span className="font-serif font-semibold text-[var(--dz-theme-accent)]">
                      +{String(extra.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clean Return Button */}
          <div className="pt-6">
            <button
              type="button"
              onClick={navigation.goToMain}
              className="w-full py-3.5 px-5 rounded-2xl bg-[var(--dz-theme-surface)] hover:bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] font-serif font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              style={{ fontFamily: "var(--dz-theme-font-serif)" }}
            >
              <ChevronLeft className="w-4 h-4 text-[var(--dz-theme-muted)]" />
              <span>العودة إلى القائمة • Return to Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
