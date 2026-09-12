"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Wifi,
  Clock,
  MapPin,
  ChevronRight,
  Plus,
  Minus,
  X,
  Sparkles,
  Share2,
  Home,
  Heart,
  User,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Restaurant } from "@/types/restaurant";
import type { Category, MenuItem } from "@/types/menu";
import type { ResolvedTheme } from "@/lib/themes/resolver";
import { searchMenuItems } from "@/lib/search/fuzzy-search";

interface CustomerMenuProps {
  restaurant: Restaurant;
  theme: ResolvedTheme;
  categories: Category[];
  items: MenuItem[];
}

export default function CustomerMenuClient({
  restaurant,
  theme,
  categories,
  items,
}: CustomerMenuProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Category ID to Name mapping for richer search matching
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Filtered categories (only those with items or active)
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.isActive);
  }, [categories]);

  // Filtered items with fuzzy search
  const filteredItems = useMemo(() => {
    const visibleItems = items.filter((item) => {
      if (!item.isVisible) return false;
      return selectedCategoryId === "all" || item.categoryId === selectedCategoryId;
    });

    if (!searchQuery.trim()) {
      return visibleItems;
    }

    // Attach category name to items for search matching
    const enrichedItems = visibleItems.map((item) => ({
      ...item,
      categoryName: item.categoryId ? categoryMap.get(item.categoryId) || "" : "",
    }));

    return searchMenuItems(enrichedItems, searchQuery);
  }, [items, selectedCategoryId, searchQuery, categoryMap]);

  // Cart calculation
  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
      const item = items.find((i) => i.id === itemId);
      return sum + (item ? Number(item.price) * qty : 0);
    }, 0);
  }, [cart, items]);

  const addToCart = (itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newQty = (prev[itemId] || 0) - 1;
      if (newQty <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const [liveSettings, setLiveSettings] = useState(theme.settings);
  const [liveCssVariables, setLiveCssVariables] = useState(theme.cssVariables);

  // Synchronize with parent window when embedded in Theme Editor
  useEffect(() => {
    // Only listen and handshake if this menu is running in preview mode inside an iframe
    if (!theme.isPreview || typeof window === "undefined" || window.parent === window) {
      return;
    }

    const handleMessage = (e: MessageEvent) => {
      // 1. Origin validation: Only accept messages from same origin
      if (e.origin !== window.location.origin) return;

      // 2. Source validation: Only accept messages from parent window
      if (e.source !== window.parent) return;

      // 3. Message validation: Ensure message type and payload are present and valid
      if (e.data?.type === "DZMENU_THEME_PREVIEW_UPDATE") {
        if (e.data.settings && typeof e.data.settings === "object") {
          setLiveSettings(e.data.settings);
        }
        if (e.data.cssVariables && typeof e.data.cssVariables === "object") {
          setLiveCssVariables(e.data.cssVariables);
        }
      }
    };
    window.addEventListener("message", handleMessage);

    // Notify parent editor that client has hydrated and is ready to receive live tweaks
    try {
      window.parent?.postMessage({ type: "DZMENU_PREVIEW_READY" }, window.location.origin);
    } catch {}

    return () => window.removeEventListener("message", handleMessage);
  }, [theme.isPreview]);

  const settings = (liveSettings as unknown as Record<string, unknown>) || {};
  const layout = (settings.layout as Record<string, unknown>) || {};
  const cssVariables = liveCssVariables;
  const categoryStyle = (layout.category_style as string) || "stories";
  const cardStyle = (layout.card_style as string) || "hero";
  const showAllCategory = layout.show_all_category !== false;
  const showHeaderBanner = layout.show_header_banner !== false;
  const showSearch = layout.show_search !== false;
  const showCartBar = layout.show_cart_bar !== false;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // iOS Momentum physics loop for Desktop mouse wheel & trackpad
  const targetScrollY = useRef(0);
  const isAnimatingScroll = useRef(false);

  const startSmoothScroll = () => {
    if (isAnimatingScroll.current) return;
    isAnimatingScroll.current = true;

    const tick = () => {
      if (!scrollContainerRef.current) {
        isAnimatingScroll.current = false;
        return;
      }

      const el = scrollContainerRef.current;
      const current = el.scrollTop;
      const target = targetScrollY.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.5) {
        // iOS exponential easing: moves 16% towards target per frame (buttery 60/120fps glide)
        el.scrollTop = current + diff * 0.16;
        setScrollY(el.scrollTop);
        requestAnimationFrame(tick);
      } else {
        el.scrollTop = target;
        setScrollY(target);
        isAnimatingScroll.current = false;
      }
    };

    requestAnimationFrame(tick);
  };

  const handleWheelScroll = (e: React.WheelEvent) => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    
    // Smooth iOS momentum accumulator
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const startVal = isAnimatingScroll.current ? targetScrollY.current : el.scrollTop;
    // iOS standard wheel damping
    const delta = e.deltaY * 0.9;
    targetScrollY.current = Math.max(0, Math.min(maxScroll, startVal + delta));

    startSmoothScroll();
  };

  // Drag-to-scroll on desktop (Simulates iOS touch swipe with mouse)
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  // Window scroll listener for mobile parallax
  useEffect(() => {
    const handleWinScroll = () => {
      if (window.innerWidth < 768) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener("scroll", handleWinScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWinScroll);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with mouse on desktop screens (>= 768px and fine pointer)
    if (typeof window !== "undefined" && (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches)) return;
    if ((e.target as HTMLElement).closest("button, input, a, select, textarea")) return;
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = scrollContainerRef.current?.scrollTop || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    const deltaY = e.clientY - dragStartY.current;
    scrollContainerRef.current.scrollTop = dragStartScrollTop.current - deltaY;
    targetScrollY.current = scrollContainerRef.current.scrollTop;
    setScrollY(scrollContainerRef.current.scrollTop);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      onWheel={handleWheelScroll}
      className="dzmenu-customer-menu select-none min-h-screen w-full bg-[var(--dz-bg)] md:bg-[#0e1013] md:flex md:items-center md:justify-center md:py-6 md:px-4"
    >
      {/* Mobile Device Mockup Frame on Desktop Screens */}
      <div
        style={cssVariables as React.CSSProperties}
        className="w-full min-h-screen md:min-h-0 md:h-[92vh] md:max-h-[900px] md:max-w-[430px] mx-auto md:rounded-[36px] md:border-2 md:border-[#4e5564] md:ring-1 md:ring-white/20 md:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(0,0,0,0.5)] md:overflow-hidden relative bg-[var(--dz-bg)] text-[var(--dz-text)] font-[family-name:var(--dz-font-family)] flex flex-col transition-all"
      >
        {/* Scrollable Menu Area */}
        <div
          ref={scrollContainerRef}
          onScroll={(e) => {
            if (typeof window !== "undefined" && window.innerWidth >= 768) {
              setScrollY(e.currentTarget.scrollTop);
            }
          }}
          onWheel={handleWheelScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full min-h-screen md:min-h-0 md:flex-1 md:overflow-y-auto md:overflow-x-hidden pb-36 md:pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] no-scrollbar relative"
        >
          {/* ========================================================================= */}
          {/* 1. HEADER SECTION                                                         */}
          {/* ========================================================================= */}
          <div className="relative">
            {/* Cover Photo with iOS Parallax & Elastic Scaling */}
            {showHeaderBanner && (
              <div className="h-44 sm:h-52 w-full overflow-hidden relative bg-black/20 select-none">
                <div
                  style={{
                    transform: `translateY(${Math.max(0, scrollY * 0.35)}px) scale(${
                      scrollY < 0 ? 1 + Math.abs(scrollY) * 0.003 : 1
                    })`,
                    transformOrigin: "top center",
                    willChange: "transform",
                  }}
                  className="w-full h-full relative"
                >
                  {restaurant.coverUrl ? (
                    <img
                      src={restaurant.coverUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[var(--dz-primary)] to-[var(--dz-accent)] opacity-90" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                </div>
              </div>
            )}

        {/* Restaurant Card Header */}
        <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-[var(--dz-surface)] rounded-2xl p-4 sm:p-5 shadow-lg border border-black/5 flex items-start gap-4">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white shadow-md border border-gray-100 shrink-0 flex items-center justify-center text-xl font-bold">
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[var(--dz-primary)]">
                  {restaurant.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-lg sm:text-xl font-black truncate tracking-tight text-[var(--dz-text)]">
                  {restaurant.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0 border border-emerald-200">
                  Open Now
                </span>
              </div>

              {restaurant.tagline && (
                <p className="text-xs text-[var(--dz-text-secondary)] mt-0.5 truncate">
                  {restaurant.tagline}
                </p>
              )}

              {/* Quick Info Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[var(--dz-text-secondary)]">
                {restaurant.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[var(--dz-primary)]" />
                    <span>{restaurant.city}</span>
                  </span>
                )}
                {restaurant.wifiSsid && (
                  <span className="flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded-full">
                    <Wifi size={11} className="text-[var(--dz-primary)]" />
                    <span>{restaurant.wifiSsid}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & PROMO BANNER                                                  */}
      {/* ========================================================================= */}
      <div className="max-w-3xl mx-auto px-4 mt-4 space-y-3">
        {showSearch && (
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, desserts..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--dz-surface)] border border-gray-200/80 rounded-xl text-xs sm:text-sm text-[var(--dz-text)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--dz-primary)] transition shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC CATEGORY BAR (RENDERED ACCORDING TO THEME STYLE)              */}
      {/* ========================================================================= */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        
        {/* Style 1: Circle Stories (Gourmet style) */}
        {categoryStyle === "stories" && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {showAllCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 transition ${
                    selectedCategoryId === "all"
                      ? "border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white shadow-md scale-105"
                      : "border-gray-200 bg-[var(--dz-surface)] text-gray-600"
                  }`}
                >
                  ✨
                </div>
                <span className="text-[11px] font-bold">All</span>
              </button>
            )}
            {activeCategories.map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(active ? "all" : c.id)}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-full overflow-hidden p-0.5 border-2 transition ${
                      active
                        ? "border-[var(--dz-primary)] shadow-md scale-105"
                        : "border-gray-200 opacity-80"
                    }`}
                  >
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--dz-surface)] rounded-full flex items-center justify-center text-xl">
                        {c.icon || "🍽️"}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11px] truncate max-w-[70px] ${
                      active ? "font-black text-[var(--dz-primary)]" : "text-gray-600 font-medium"
                    }`}
                  >
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Style 2: Card Badges (Craving style) */}
        {categoryStyle === "card_badges" && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {showAllCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                  selectedCategoryId === "all"
                    ? "bg-[var(--dz-primary)] text-white border-[var(--dz-primary)] shadow-sm font-bold"
                    : "bg-[var(--dz-surface)] border-gray-200 text-gray-700"
                }`}
              >
                <div className="text-base">🔥</div>
                <div className="text-[10px] font-extrabold mt-0.5">All Items</div>
              </button>
            )}
            {activeCategories.slice(0, 7).map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(active ? "all" : c.id)}
                  className={`p-2 rounded-xl border text-center relative overflow-hidden transition cursor-pointer ${
                    active
                      ? "bg-[var(--dz-surface)] border-[var(--dz-primary)] ring-2 ring-[var(--dz-primary)] font-bold"
                      : "bg-[var(--dz-surface)] border-gray-200 text-gray-700"
                  }`}
                >
                  {c.badge && (
                    <span className="absolute top-1 right-1 px-1 py-0.2 rounded-full text-[7px] font-black bg-[var(--dz-primary)] text-white">
                      {c.badge}
                    </span>
                  )}
                  <div className="text-base">{c.icon || "🍔"}</div>
                  <div className="text-[10px] font-bold truncate mt-0.5">{c.name}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Style 3: Minimal Icon (Crema style) */}
        {categoryStyle === "minimal_icons" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {showAllCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedCategoryId === "all"
                    ? "bg-[var(--dz-primary)] text-white border-[var(--dz-primary)] shadow-sm"
                    : "bg-[var(--dz-surface)] border-gray-200 text-gray-700"
                }`}
              >
                <span>☕</span>
                <span>All</span>
              </button>
            )}
            {activeCategories.map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(active ? "all" : c.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-[var(--dz-surface)] text-[var(--dz-primary)] border-[var(--dz-primary)] ring-1 ring-[var(--dz-primary)] shadow-xs"
                      : "bg-[var(--dz-surface)] border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{c.icon || "🥐"}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Style 4: Modern Glass (Noir style) */}
        {categoryStyle === "glass" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {showAllCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition shrink-0 cursor-pointer backdrop-blur-md ${
                  selectedCategoryId === "all"
                    ? "bg-[var(--dz-primary)] text-black border-[var(--dz-primary)] shadow-lg shadow-[var(--dz-primary)]/20"
                    : "bg-white/10 border-white/20 text-gray-300"
                }`}
              >
                All Menu
              </button>
            )}
            {activeCategories.map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(active ? "all" : c.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition shrink-0 cursor-pointer backdrop-blur-md flex items-center gap-1.5 ${
                    active
                      ? "bg-[var(--dz-primary)]/20 text-[var(--dz-primary)] border-[var(--dz-primary)] shadow-md"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <span>{c.icon || "🍣"}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Style 5: Banner Showcase (Basil style) */}
        {categoryStyle === "banner" && (
          <div className="grid grid-cols-3 gap-2">
            {activeCategories.slice(0, 3).map((c) => {
              const active = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(active ? "all" : c.id)}
                  className={`relative h-14 rounded-xl overflow-hidden shadow-xs text-left p-2 flex items-end cursor-pointer border-2 transition ${
                    active ? "border-[var(--dz-primary)] ring-2 ring-[var(--dz-primary)]/30" : "border-transparent"
                  }`}
                >
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-teal-900" />
                  )}
                  <div className="absolute inset-0 bg-black/40" />
                  <span className="relative z-10 text-xs font-black text-white flex items-center gap-1">
                    <span>{c.icon || "🍕"}</span>
                    <span>{c.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. DISH ITEMS LIST (RENDERED ACCORDING TO THEME CARD STYLE)               */}
      {/* ========================================================================= */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {filteredItems.length === 0 ? (
          <div className="bg-[var(--dz-surface)] rounded-2xl p-10 text-center border border-gray-100 text-gray-400">
            <p className="text-sm font-semibold">No items found in this section.</p>
          </div>
        ) : cardStyle === "grid_2col" ? (
          /* Layout 1: 2-Column Fast Casual Food Grid (Craving / Little Caesars) */
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="bg-[var(--dz-surface)] rounded-2xl border border-gray-200/70 p-3 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    {item.imageUrl ? (
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-gray-100 mb-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-xl bg-gray-50 flex items-center justify-center text-3xl mb-2">
                        🍔
                      </div>
                    )}
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--dz-text)] line-clamp-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[10px] text-[var(--dz-text-secondary)] line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span className="text-xs sm:text-sm font-black text-[var(--dz-primary)]">
                      {Number(item.price).toLocaleString()} {restaurant.currency}
                    </span>

                    {qty > 0 ? (
                      <div className="flex items-center gap-1.5 bg-[var(--dz-primary)] text-white px-2 py-1 rounded-full text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="hover:opacity-75"
                        >
                          <Minus size={12} />
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(item.id)}
                          className="hover:opacity-75"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(item.id)}
                        className="w-7 h-7 rounded-full bg-[var(--dz-primary)] text-white flex items-center justify-center hover:opacity-90 shadow-xs cursor-pointer transition active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : cardStyle === "compact_row" ? (
          /* Layout 2: Compact Horizontal Rows (Crema Café style) */
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="bg-[var(--dz-surface)] rounded-xl p-3 border border-gray-200/70 shadow-2xs flex items-center justify-between gap-3 hover:shadow-xs transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--dz-text)] truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-[10px] text-[var(--dz-text-secondary)] line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                      <span className="text-xs font-black text-[var(--dz-primary)] mt-1 block">
                        {Number(item.price).toLocaleString()} {restaurant.currency}
                      </span>
                    </div>
                  </div>

                  {qty > 0 ? (
                    <div className="flex items-center gap-2 bg-[var(--dz-primary)] text-white px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                      <button type="button" onClick={() => removeFromCart(item.id)}>
                        <Minus size={12} />
                      </button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => addToCart(item.id)}>
                        <Plus size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(item.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-[var(--dz-primary)] hover:text-white rounded-lg text-xs font-bold text-gray-700 transition cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Layout 3: Hero Featured Cards (Gourmet / Basil / Noir style) */
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="bg-[var(--dz-surface)] rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-4 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 bg-gray-100"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[var(--dz-text)] truncate">
                          {item.name}
                        </h3>
                        {item.isFeatured && (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-100 text-amber-800">
                            ★ Special
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-[var(--dz-text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <span className="text-sm sm:text-base font-black text-[var(--dz-primary)] mt-1.5 block">
                        {Number(item.price).toLocaleString()} {restaurant.currency}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-[var(--dz-primary)] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
                        <button type="button" onClick={() => removeFromCart(item.id)}>
                          <Minus size={13} />
                        </button>
                        <span>{qty}</span>
                        <button type="button" onClick={() => addToCart(item.id)}>
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(item.id)}
                        className="px-4 py-2 bg-[var(--dz-primary)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

        </div>

        {/* ========================================================================= */}
        {/* 5. FLOATING BOTTOM DOCK & CART (INSIDE PHONE FRAME / SCREEN)              */}
        {/* ========================================================================= */}
        <div className="fixed md:absolute bottom-3 inset-x-0 z-40 px-3 max-w-md mx-auto pointer-events-none flex flex-col gap-2">
          {/* Active Cart Banner */}
          {showCartBar && totalCartCount > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="pointer-events-auto"
            >
              <div className="bg-[var(--dz-primary)] text-white rounded-2xl p-3 shadow-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium block opacity-90">
                      {totalCartCount} {totalCartCount === 1 ? "Item" : "Items"} in Cart
                    </span>
                    <span className="text-xs font-black">
                      Total: {totalCartPrice.toLocaleString()} {restaurant.currency}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Your order of ${totalCartCount} items (${totalCartPrice} ${restaurant.currency}) is ready!`)}
                  className="px-3.5 py-1.5 bg-white text-black font-extrabold rounded-xl text-xs shadow hover:bg-gray-100 transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>View Order</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Floating Navigation Dock matching user screenshot */}
          <div className="pointer-events-auto bg-[#181a20]/92 backdrop-blur-xl border border-white/10 text-white rounded-3xl p-1.5 shadow-2xl flex items-center justify-around">
            {/* Info / Profile */}
            <button
              type="button"
              onClick={() => {
                alert(`${restaurant.name}\n${restaurant.tagline || ""}\nWiFi: ${restaurant.wifiSsid || "None"}\nCity: ${restaurant.city || ""}`);
              }}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
              title="Restaurant Info"
            >
              <User size={18} />
            </button>

            {/* Favorites */}
            <button
              type="button"
              onClick={() => alert("Favorites list")}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
              title="Favorites"
            >
              <Heart size={18} />
            </button>

            {/* Cart with count badge */}
            <button
              type="button"
              onClick={() => {
                if (totalCartCount > 0) {
                  alert(`Cart: ${totalCartCount} items (${totalCartPrice} ${restaurant.currency})`);
                } else {
                  alert("Your cart is empty. Add delicious dishes from the menu!");
                }
              }}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition relative"
              title="Cart"
            >
              <ShoppingBag size={18} />
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--dz-primary)] text-white text-[9px] font-black flex items-center justify-center border border-[#181a20]">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Search */}
            <button
              type="button"
              onClick={() => {
                scrollContainerRef.current?.scrollTo({ top: 120, behavior: "smooth" });
              }}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
              title="Search Menu"
            >
              <Search size={18} />
            </button>

            {/* Categories */}
            <button
              type="button"
              onClick={() => {
                scrollContainerRef.current?.scrollTo({ top: 220, behavior: "smooth" });
              }}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
              title="Categories"
            >
              <LayoutGrid size={18} />
            </button>

            {/* Home Active Pill (White button with label matching screenshot) */}
            <button
              type="button"
              onClick={() => {
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex flex-col items-center justify-center bg-white text-black px-3.5 py-1.5 rounded-2xl font-bold shadow-md transition active:scale-95 cursor-pointer"
            >
              <Home size={16} />
              <span className="text-[9px] font-extrabold mt-0.5">الرئيسية</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
