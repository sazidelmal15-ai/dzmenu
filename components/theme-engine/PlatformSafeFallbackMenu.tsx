"use client";

import React, { useState, useMemo } from "react";
import { AlertCircle, RefreshCw, Search, Clock, MapPin, Phone, X } from "lucide-react";
import type { MenuPresentationModel } from "@/types/theme-contract";
import { filterCategoriesWithSearch } from "@/lib/search/fuzzy-search";

export interface PlatformSafeFallbackMenuProps {
  menu: MenuPresentationModel;
  error?: Error | null;
  onRetry?: () => void;
  isEditorPreview?: boolean;
}

export function PlatformSafeFallbackMenu({
  menu,
  error,
  onRetry,
  isEditorPreview = false,
}: PlatformSafeFallbackMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const filteredCategories = useMemo(() => {
    return filterCategoriesWithSearch(menu.categories, searchQuery, selectedCategoryId);
  }, [menu.categories, selectedCategoryId, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-[#0a0c10] text-[#e1e7ec] flex items-center justify-center p-0 md:p-6 font-sans">
      <div className="w-full min-h-screen md:min-h-0 md:h-[92vh] md:max-h-[900px] md:max-w-[430px] mx-auto md:rounded-[32px] md:border md:border-white/10 shadow-2xl bg-[#11151d] flex flex-col overflow-hidden relative">
        {/* Diagnostic Banner if Error / Preview */}
        {(error || isEditorPreview) && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2 truncate">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">
                {error ? "Theme fallback mode active" : "Editor Preview • Baseline Template"}
              </span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="shrink-0 ml-2 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-colors flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto pb-20 [&::-webkit-scrollbar]:hidden">
          {/* Header & Restaurant Info */}
          <div className="relative bg-gradient-to-b from-[#181f2c] to-[#11151d] p-5 pt-8 border-b border-white/5">
            <div className="flex items-center gap-3.5">
              {menu.restaurant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={menu.restaurant.logoUrl}
                  alt={menu.restaurant.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xl flex items-center justify-center">
                  {menu.restaurant.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-white truncate">
                  {menu.restaurant.name}
                </h1>
                {menu.restaurant.tagline && (
                  <p className="text-xs text-white/60 truncate mt-0.5">
                    {menu.restaurant.tagline}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-white/50 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {menu.restaurant.schedule.formattedHours}
                  </span>
                  {menu.restaurant.contact.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-white/40" />
                      {menu.restaurant.contact.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-5 relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, drinks..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50"
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

          {/* Category Tabs */}
          <div className="sticky top-0 z-10 bg-[#11151d]/95 backdrop-blur-md px-4 py-2.5 border-b border-white/5 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedCategoryId === "all"
                  ? "bg-amber-500 text-black font-semibold"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              All Items ({menu.totalItemCount})
            </button>
            {menu.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedCategoryId === cat.id
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {cat.name} ({cat.itemCount})
              </button>
            ))}
          </div>

          {/* Menu Sections */}
          <div className="p-4 space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-sm">
                No items found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div key={cat.id} className="space-y-3">
                  <h2 className="text-sm font-semibold text-amber-400 tracking-wider uppercase text-[11px]">
                    {cat.name}
                  </h2>
                  <div className="space-y-2.5">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex gap-3.5 items-center"
                      >
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-sm font-medium text-white truncate">
                              {item.name}
                            </h3>
                            <span className="text-sm font-semibold text-amber-400 shrink-0">
                              {item.formattedPrice}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-white/50 line-clamp-2 mt-0.5">
                              {item.description}
                            </p>
                          )}
                          {item.badges.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {item.badges.map((b) => (
                                <span
                                  key={b}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/5 text-white/70"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Contact */}
        {menu.restaurant.contact.phone && (
          <div className="p-3 border-t border-white/5 bg-[#0e1117] flex justify-between items-center text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              {menu.restaurant.contact.phone}
            </span>
            <span className="text-[10px] text-white/40">Powered by DZMenu</span>
          </div>
        )}
      </div>
    </div>
  );
}
