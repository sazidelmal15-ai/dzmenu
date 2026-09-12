"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Clock,
  Wifi,
  Sparkles,
  Plus,
  Minus,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import type { ThemeRenderContext } from "@/types/theme-contract";
import { filterCategoriesWithSearch } from "@/lib/search/fuzzy-search";
import { getFramingTransformStyle, getSlotFraming } from "@/lib/utils";

export function NoirMainTemplate({
  menu,
  settings,
  imageSlots,
  navigation,
}: ThemeRenderContext) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const layout = (settings.layout as Record<string, unknown>) || {};
  const showBanner = layout.show_header_banner !== false;
  const showSearch = layout.show_search !== false;
  const showCart = layout.show_cart_bar !== false;
  const showAllCategory = layout.show_all_category !== false;
  const cardStyle = (layout.card_style as string) || "cinematic_hero";
  const categoryStyle = (layout.category_style as string) || "glass";

  const activeCategories = useMemo(() => {
    return menu.categories.filter((c) => c.isActive);
  }, [menu.categories]);

  const filteredCategories = useMemo(() => {
    return filterCategoriesWithSearch(activeCategories, searchQuery, selectedCategoryId);
  }, [activeCategories, selectedCategoryId, searchQuery]);

  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    let sum = 0;
    for (const cat of menu.categories) {
      for (const item of cat.items) {
        if (cart[item.id]) {
          sum += Number(item.price) * cart[item.id];
        }
      }
    }
    return sum;
  }, [cart, menu.categories]);

  const addToCart = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setCart((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const heroCoverUrl = imageSlots.hero_cover || menu.restaurant.coverUrl;
  const heroFraming = getSlotFraming(settings, "hero_cover");
  const logoFraming = getSlotFraming(settings, "logo");

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 relative select-none">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto pb-28 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {/* 1. Dramatic Lounge Cover Banner */}
        {showBanner && (
          <div className="h-48 sm:h-56 w-full overflow-hidden relative bg-black select-none">
            {heroCoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroCoverUrl}
                alt={menu.restaurant.name}
                className="w-full h-full object-cover opacity-85"
                style={getFramingTransformStyle(heroFraming)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-zinc-950 via-slate-900 to-black flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest text-white/30 font-medium">
                  {menu.restaurant.name}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--dz-theme-background)] via-black/40 to-transparent" />
          </div>
        )}

        {/* 2. Restaurant Brand & Luxury Header */}
        <div className="px-5 pt-3 pb-2 relative z-10">
          <div className="flex items-start gap-4">
            {menu.restaurant.logoUrl ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[var(--dz-theme-primary)]/40 shadow-2xl shrink-0 bg-black/60 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={menu.restaurant.logoUrl}
                  alt={menu.restaurant.name}
                  className="w-full h-full object-cover"
                  style={getFramingTransformStyle(logoFraming)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-primary)]/40 text-[var(--dz-theme-primary)] text-2xl flex items-center justify-center shadow-2xl shrink-0 font-serif">
                ✨
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--dz-theme-text)] tracking-tight truncate">
                  {menu.restaurant.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[var(--dz-theme-primary)]/10 text-[var(--dz-theme-primary)] border border-[var(--dz-theme-primary)]/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3" />
                  Fine Dining
                </span>
              </div>

              {menu.restaurant.tagline && (
                <p className="text-xs text-[var(--dz-theme-muted)] line-clamp-1 mt-0.5 font-light">
                  {menu.restaurant.tagline}
                </p>
              )}

              {/* Status Badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                {menu.restaurant.schedule?.isOpenNow !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                      menu.restaurant.schedule.isOpenNow
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {menu.restaurant.schedule.isOpenNow ? "Open Tonight" : "Closed"}
                  </span>
                )}

                {menu.restaurant.wifi?.ssid && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[var(--dz-theme-muted)] border border-white/10 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    <span>{menu.restaurant.wifi.ssid}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Search Bar */}
        {showSearch && (
          <div className="px-5 mt-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search culinary creations, cocktails, courses..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-[var(--dz-theme-text)] placeholder-white/30 backdrop-blur-md focus:outline-none focus:border-[var(--dz-theme-primary)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors active:scale-90"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Frosted Glass Category Navigation */}
        <div className="mt-4 sticky top-0 z-20 bg-[var(--dz-theme-background)]/90 backdrop-blur-xl px-5 py-2.5 border-b border-white/5">
          {categoryStyle === "glass" ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {showAllCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer backdrop-blur-md ${
                    selectedCategoryId === "all"
                      ? "bg-[var(--dz-theme-primary)] text-black shadow-lg shadow-[var(--dz-theme-primary)]/20 font-black"
                      : "bg-white/[0.05] border border-white/10 text-[var(--dz-theme-muted)] hover:text-white"
                  }`}
                >
                  All Menu
                </button>
              )}
              {activeCategories.map((cat) => {
                const active = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(active ? "all" : cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition shrink-0 cursor-pointer backdrop-blur-md flex items-center gap-1.5 ${
                      active
                        ? "bg-[var(--dz-theme-primary)] text-black font-bold shadow-lg shadow-[var(--dz-theme-primary)]/20"
                        : "bg-white/[0.05] border border-white/10 text-[var(--dz-theme-muted)] hover:text-white"
                    }`}
                  >
                    <span>{cat.icon || "✨"}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {showAllCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`pb-1 text-xs transition shrink-0 cursor-pointer border-b-2 ${
                    selectedCategoryId === "all"
                      ? "border-[var(--dz-theme-primary)] text-[var(--dz-theme-primary)] font-bold"
                      : "border-transparent text-[var(--dz-theme-muted)] hover:text-white"
                  }`}
                >
                  All
                </button>
              )}
              {activeCategories.map((cat) => {
                const active = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(active ? "all" : cat.id)}
                    className={`pb-1 text-xs transition shrink-0 cursor-pointer border-b-2 ${
                      active
                        ? "border-[var(--dz-theme-primary)] text-[var(--dz-theme-primary)] font-bold"
                        : "border-transparent text-[var(--dz-theme-muted)] hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Luxury Dish Cards */}
        <div className="px-5 mt-4 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-[var(--dz-theme-muted)] text-sm">
              No creations match your selection.
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h2 className="text-sm font-bold tracking-wider uppercase text-[var(--dz-theme-muted)] flex items-center gap-2">
                    <span className="text-[var(--dz-theme-primary)]">◆</span>
                    <span>{cat.name}</span>
                  </h2>
                </div>

                {cardStyle === "cinematic_hero" ? (
                  /* Cinematic Full-Width Cards */
                  <div className="space-y-4">
                    {cat.items.map((item) => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => navigation.goToItem(item.id)}
                          className="bg-[var(--dz-theme-surface)] rounded-[var(--dz-theme-card-radius)] border border-white/10 overflow-hidden hover:border-[var(--dz-theme-primary)]/50 transition duration-300 cursor-pointer group shadow-lg"
                        >
                          {/* Panoramic Dish Visual */}
                          {item.imageUrl && (
                            <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-black/60">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                                style={getFramingTransformStyle(item.framing)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[var(--dz-theme-surface)] via-transparent to-transparent" />
                              {item.isFeatured && (
                                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[var(--dz-theme-accent)] border border-[var(--dz-theme-accent)]/30 text-[10px] font-bold flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  Chef Recommendation
                                </span>
                              )}
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="text-sm sm:text-base font-bold text-[var(--dz-theme-text)] group-hover:text-[var(--dz-theme-primary)] transition">
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p className="text-xs text-[var(--dz-theme-muted)] line-clamp-2 mt-1 leading-relaxed font-light">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm sm:text-base font-bold text-[var(--dz-theme-primary)] whitespace-nowrap">
                                {Number(item.price).toLocaleString()} {menu.restaurant.currency}
                              </span>
                            </div>

                            <div className="flex items-center justify-end mt-3 pt-2 border-t border-white/5">
                              {qty > 0 ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2 bg-[var(--dz-theme-primary)] text-black px-3 py-1 rounded-full text-xs font-black shadow-md"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => removeFromCart(e, item.id)}
                                    className="hover:opacity-75"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span>{qty}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => addToCart(e, item.id)}
                                    className="hover:opacity-75"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => addToCart(e, item.id)}
                                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-[var(--dz-theme-primary)] hover:text-black border border-white/10 text-xs font-bold text-[var(--dz-theme-text)] transition cursor-pointer"
                                >
                                  + Order
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Luxury Row Format */
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigation.goToItem(item.id)}
                        className="bg-[var(--dz-theme-surface)] rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3 hover:border-[var(--dz-theme-primary)]/40 transition cursor-pointer group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-bold text-[var(--dz-theme-text)] group-hover:text-[var(--dz-theme-primary)] transition truncate">
                              {item.name}
                            </h3>
                            {item.isFeatured && (
                              <span className="text-[10px] text-[var(--dz-theme-accent)]">★</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-[var(--dz-theme-muted)] line-clamp-1 mt-0.5 font-light">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[var(--dz-theme-primary)]">
                          {Number(item.price).toLocaleString()} {menu.restaurant.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Sleek Glassmorphism Cart Bar */}
      {showCart && totalCartCount > 0 && (
        <div className="absolute bottom-4 left-5 right-5 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="bg-[var(--dz-theme-surface)]/90 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-[var(--dz-theme-primary)]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--dz-theme-primary)]/20 text-[var(--dz-theme-primary)] flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">
                  {totalCartCount} Course{totalCartCount === 1 ? "" : "s"} Selected
                </span>
                <span className="text-[10px] text-[var(--dz-theme-muted)]">Order ready for service</span>
              </div>
            </div>

            <span className="text-sm font-bold text-[var(--dz-theme-primary)] bg-white/5 px-3 py-1 rounded-xl border border-white/10">
              {totalCartPrice.toLocaleString()} {menu.restaurant.currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
