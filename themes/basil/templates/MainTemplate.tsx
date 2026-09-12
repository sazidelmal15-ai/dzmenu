"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Clock,
  Wifi,
  Leaf,
  Plus,
  Minus,
  ShoppingBag,
  Flame,
  X,
} from "lucide-react";
import type { ThemeRenderContext } from "@/types/theme-contract";
import { filterCategoriesWithSearch } from "@/lib/search/fuzzy-search";
import { getFramingTransformStyle, getSlotFraming } from "@/lib/utils";

export function BasilMainTemplate({
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
  const cardStyle = (layout.card_style as string) || "artisan_card";
  const categoryStyle = (layout.category_style as string) || "banner";

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
        {/* 1. Rustic Farm & Trattoria Cover Banner */}
        {showBanner && (
          <div className="h-44 sm:h-52 w-full overflow-hidden relative bg-black/40 select-none">
            {heroCoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroCoverUrl}
                alt={menu.restaurant.name}
                className="w-full h-full object-cover"
                style={getFramingTransformStyle(heroFraming)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-stone-900 to-teal-950 flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest text-emerald-100/40 font-semibold">
                  {menu.restaurant.name}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--dz-theme-background)] via-black/25 to-transparent" />
          </div>
        )}

        {/* 2. Restaurant Brand & Organic Identity */}
        <div className="px-5 pt-3 pb-2 relative z-10">
          <div className="flex items-start gap-4">
            {menu.restaurant.logoUrl ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] shadow-md shrink-0 bg-white relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={menu.restaurant.logoUrl}
                  alt={menu.restaurant.name}
                  className="w-full h-full object-cover"
                  style={getFramingTransformStyle(logoFraming)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--dz-theme-primary)] text-white text-2xl flex items-center justify-center shadow-md shrink-0 font-bold">
                🌿
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--dz-theme-text)] tracking-tight truncate">
                  {menu.restaurant.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[var(--dz-theme-surface-raised)] text-[var(--dz-theme-primary)] border border-[var(--dz-theme-border)] text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <Leaf className="w-3 h-3" />
                  Farm Fresh
                </span>
              </div>

              {menu.restaurant.tagline && (
                <p className="text-xs text-[var(--dz-theme-muted)] line-clamp-1 mt-0.5 font-medium">
                  {menu.restaurant.tagline}
                </p>
              )}

              {/* Status Badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                {menu.restaurant.schedule?.isOpenNow !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                      menu.restaurant.schedule.isOpenNow
                        ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/20"
                        : "bg-red-500/15 text-red-800 border border-red-500/20"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {menu.restaurant.schedule.isOpenNow ? "Woodfire Ready" : "Closed"}
                  </span>
                )}

                {menu.restaurant.wifi?.ssid && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)] flex items-center gap-1">
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
              <Search className="w-4 h-4 text-[var(--dz-theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search woodfired pizza, handmade pasta, salads..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[var(--dz-theme-surface)] border border-[var(--dz-theme-border)] text-xs text-[var(--dz-theme-text)] placeholder-[var(--dz-theme-muted)]/60 focus:outline-none focus:border-[var(--dz-theme-primary)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--dz-theme-muted)] opacity-70 hover:opacity-100 transition-opacity active:scale-90"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Category Navigation (Photo Banner Showcase or Rustic Pills) */}
        <div className="mt-4 sticky top-0 z-20 bg-[var(--dz-theme-background)]/95 backdrop-blur-sm px-5 py-2.5 border-b border-[var(--dz-theme-border)]">
          {categoryStyle === "banner" ? (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {showAllCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`h-14 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                    selectedCategoryId === "all"
                      ? "bg-[var(--dz-theme-primary)] text-white shadow-md"
                      : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)]"
                  }`}
                >
                  <span>🌿</span>
                  <span>All Dishes</span>
                </button>
              )}
              {activeCategories.map((cat) => {
                const active = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(active ? "all" : cat.id)}
                    className={`relative h-14 min-w-[120px] rounded-xl overflow-hidden shadow-xs text-left p-2.5 flex items-end cursor-pointer border-2 transition shrink-0 ${
                      active
                        ? "border-[var(--dz-theme-primary)] ring-2 ring-[var(--dz-theme-primary)]/30"
                        : "border-transparent"
                    }`}
                  >
                    {cat.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-teal-900" />
                    )}
                    <div className="absolute inset-0 bg-black/40" />
                    <span className="relative z-10 text-xs font-black text-white flex items-center gap-1 drop-shadow">
                      <span>{cat.icon || "🍕"}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {showAllCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedCategoryId === "all"
                      ? "bg-[var(--dz-theme-primary)] text-white"
                      : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)]"
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                      active
                        ? "bg-[var(--dz-theme-primary)] text-white"
                        : "bg-[var(--dz-theme-surface)] text-[var(--dz-theme-muted)] border border-[var(--dz-theme-border)]"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Dishes Grid (Artisan Showcase Cards) */}
        <div className="px-5 mt-4 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-[var(--dz-theme-muted)] text-sm">
              No organic dishes found.
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--dz-theme-border)] pb-2">
                  <h2 className="text-base font-black text-[var(--dz-theme-text)] flex items-center gap-2">
                    <span>{cat.icon || "🌿"}</span>
                    <span>{cat.name}</span>
                  </h2>
                  <span className="text-xs text-[var(--dz-theme-muted)] font-semibold">
                    {cat.items.length} dishes
                  </span>
                </div>

                {cardStyle === "artisan_card" ? (
                  <div className="space-y-3">
                    {cat.items.map((item) => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          onClick={() => navigation.goToItem(item.id)}
                          className="bg-[var(--dz-theme-surface)] rounded-[var(--dz-theme-card-radius)] border border-[var(--dz-theme-border)] p-3 sm:p-4 flex items-center gap-4 hover:border-[var(--dz-theme-primary)]/50 transition cursor-pointer group shadow-2xs"
                        >
                          {item.imageUrl && (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[var(--dz-theme-surface-raised)] border border-black/5 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                style={getFramingTransformStyle(item.framing)}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-[var(--dz-theme-text)] group-hover:text-[var(--dz-theme-primary)] transition truncate">
                                {item.name}
                              </h3>
                              {item.isFeatured && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-0.5 shrink-0">
                                  <Flame className="w-2.5 h-2.5" />
                                  Woodfired
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-xs text-[var(--dz-theme-muted)] line-clamp-2 mt-0.5">
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-1">
                              <span className="text-sm font-black text-[var(--dz-theme-primary)]">
                                {Number(item.price).toLocaleString()} {menu.restaurant.currency}
                              </span>

                              {qty > 0 ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2 bg-[var(--dz-theme-primary)] text-white px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
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
                                  className="px-3 py-1 bg-[var(--dz-theme-surface-raised)] hover:bg-[var(--dz-theme-primary)] hover:text-white rounded-lg text-xs font-bold text-[var(--dz-theme-primary)] border border-[var(--dz-theme-border)] transition cursor-pointer shrink-0"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Trattoria List */
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigation.goToItem(item.id)}
                        className="bg-[var(--dz-theme-surface)] rounded-xl p-3 border border-[var(--dz-theme-border)] flex items-center justify-between gap-3 hover:border-[var(--dz-theme-primary)]/40 transition cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-[var(--dz-theme-text)] truncate">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-[10px] text-[var(--dz-theme-muted)] line-clamp-1 mt-0.5">
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

      {/* 6. Floating Cart Dock */}
      {showCart && totalCartCount > 0 && (
        <div className="absolute bottom-4 left-5 right-5 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="bg-[var(--dz-theme-primary)] text-white rounded-2xl p-3 shadow-xl flex items-center justify-between border border-white/20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black/15 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">
                  {totalCartCount} {totalCartCount === 1 ? "Item" : "Items"} in Basket
                </span>
                <span className="text-[10px] opacity-80">Ready for kitchen</span>
              </div>
            </div>

            <span className="text-sm font-bold bg-black/15 px-3 py-1 rounded-xl">
              {totalCartPrice.toLocaleString()} {menu.restaurant.currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
