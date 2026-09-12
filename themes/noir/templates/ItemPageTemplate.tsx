"use client";

import React, { useMemo } from "react";
import { ChevronLeft, Star, Sparkles } from "lucide-react";
import type { ThemeRenderContext, MenuItemView } from "@/types/theme-contract";

export function NoirItemPageTemplate({
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

  if (!selectedItem) {
    return (
      <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[var(--dz-theme-background)] text-[var(--dz-theme-text)]">
        <h2 className="text-lg font-bold mb-2">Item Not Located</h2>
        <p className="text-xs text-[var(--dz-theme-muted)] mb-6">
          The requested creation is currently unavailable.
        </p>
        <button
          type="button"
          onClick={navigation.goToMain}
          className="px-5 py-2.5 rounded-full bg-[var(--dz-theme-primary)] text-black font-bold text-xs flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Menu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 relative select-none bg-[var(--dz-theme-background)] text-[var(--dz-theme-text)]">
      {/* Top Floating Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
        <button
          type="button"
          onClick={navigation.goToMain}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer shadow-lg"
          aria-label="Back to menu"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Dish Showcase */}
      <div className="flex-1 overflow-y-auto pb-24 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {/* Large Cinematic Visual */}
        <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-black">
          {selectedItem.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-zinc-950">
              ✨
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--dz-theme-background)] via-black/30 to-transparent" />
        </div>

        {/* Content Details */}
        <div className="px-6 -mt-8 relative z-10 space-y-5">
          {selectedItem.isFeatured && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--dz-theme-primary)]/15 text-[var(--dz-theme-primary)] border border-[var(--dz-theme-primary)]/30 text-xs font-bold shadow-lg">
              <Star className="w-3.5 h-3.5 fill-current" />
              Chef Recommendation
            </span>
          )}

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--dz-theme-text)]">
              {selectedItem.name}
            </h1>
            <span className="text-2xl font-bold text-[var(--dz-theme-primary)] whitespace-nowrap">
              {Number(selectedItem.price).toLocaleString()} {menu.restaurant.currency}
            </span>
          </div>

          {selectedItem.description && (
            <div className="bg-[var(--dz-theme-surface)] rounded-2xl p-5 border border-white/10 shadow-lg">
              <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--dz-theme-muted)] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--dz-theme-primary)]" />
                Culinary Notes
              </h3>
              <p className="text-sm text-[var(--dz-theme-text)] leading-relaxed font-light">
                {selectedItem.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action */}
      <div className="absolute bottom-4 left-6 right-6 z-20">
        <button
          type="button"
          onClick={navigation.goToMain}
          className="w-full py-4 rounded-2xl bg-[var(--dz-theme-primary)] text-black font-black text-sm transition shadow-2xl hover:opacity-95 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Return to Menu</span>
        </button>
      </div>
    </div>
  );
}
