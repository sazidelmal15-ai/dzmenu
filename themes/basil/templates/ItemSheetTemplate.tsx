"use client";

import React, { useState, useMemo } from "react";
import { X, Plus, Minus, Check, Flame } from "lucide-react";
import type { ThemeRenderContext, MenuItemView } from "@/types/theme-contract";

export function BasilItemSheetTemplate({
  menu,
  activeView,
  navigation,
}: ThemeRenderContext) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedItem: MenuItemView | null = useMemo(() => {
    if (!activeView.itemId) return null;
    for (const cat of menu.categories) {
      const found = cat.items.find((i) => i.id === activeView.itemId);
      if (found) return found;
    }
    return menu.featuredItems.find((i) => i.id === activeView.itemId) || null;
  }, [menu, activeView.itemId]);

  if (!selectedItem) return null;

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      navigation.closeModal();
    }, 600);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div
        className="absolute inset-0"
        onClick={navigation.closeModal}
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-[430px] max-h-[85%] overflow-y-auto rounded-t-[32px] bg-[var(--dz-theme-surface)] border-t border-[var(--dz-theme-border)] text-[var(--dz-theme-text)] p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="w-12 h-1.5 rounded-full bg-black/15 mx-auto mb-4" />

        <button
          type="button"
          onClick={navigation.closeModal}
          className="absolute right-4 top-4 p-2 rounded-full bg-[var(--dz-theme-surface-raised)] hover:opacity-80 text-[var(--dz-theme-text)] transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {selectedItem.imageUrl && (
          <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-[var(--dz-theme-border)] mb-4 bg-[var(--dz-theme-surface-raised)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              className="w-full h-full object-cover"
            />
            {selectedItem.isFeatured && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--dz-theme-primary)] text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                <Flame className="w-3 h-3" />
                Woodfired Special
              </div>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-xl font-black tracking-tight text-[var(--dz-theme-text)]">
            {selectedItem.name}
          </h2>
          <span className="text-lg font-black text-[var(--dz-theme-primary)] whitespace-nowrap">
            {(Number(selectedItem.price) * quantity).toLocaleString()} {menu.restaurant.currency}
          </span>
        </div>

        {selectedItem.description && (
          <p className="text-xs text-[var(--dz-theme-muted)] leading-relaxed mb-6 font-normal">
            {selectedItem.description}
          </p>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-[var(--dz-theme-border)]">
          <div className="flex items-center gap-2 bg-[var(--dz-theme-surface-raised)] border border-[var(--dz-theme-border)] rounded-2xl p-1.5 px-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1 text-[var(--dz-theme-text)] hover:text-[var(--dz-theme-primary)] disabled:opacity-30 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-[var(--dz-theme-text)]">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 text-[var(--dz-theme-text)] hover:text-[var(--dz-theme-primary)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 py-3.5 px-5 rounded-2xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-[var(--dz-theme-primary)] text-white hover:opacity-95 active:scale-98"
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Basket</span>
              </>
            ) : (
              <span>Add to Basket — {(Number(selectedItem.price) * quantity).toLocaleString()} {menu.restaurant.currency}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
