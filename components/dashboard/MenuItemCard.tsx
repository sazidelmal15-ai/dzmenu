"use client";

import { useState } from "react";
import { Edit3, MoreHorizontal, ImageIcon, Trash2, Eye, EyeOff } from "lucide-react";
import { toggleMenuItemAvailabilityAction, deleteMenuItemAction } from "@/lib/menu/actions";
import { formatPrice } from "@/lib/utils/currency";
import {
  type MenuItem,
  type MenuItemBadge,
  type MenuItemTag,
  BADGE_DEFINITIONS,
  TAG_DEFINITIONS,
} from "@/types/menu";

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
  onEdit: (item: MenuItem) => void;
  onChanged: () => void;
  currency?: string;
}

export function MenuItemCard({
  item,
  restaurantId,
  onEdit,
  onChanged,
  currency = "DZD",
}: MenuItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggleAvailability = async () => {
    setMenuOpen(false);
    await toggleMenuItemAvailabilityAction(item.id, restaurantId, !item.isAvailable);
    onChanged();
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    setMenuOpen(false);
    await deleteMenuItemAction(item.id, restaurantId);
    onChanged();
  };

  const activeBadgeDef = item.badge ? BADGE_DEFINITIONS[item.badge as MenuItemBadge] : null;

  return (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-200 flex flex-col overflow-hidden group">
      {/* Food Image */}
      <div className="relative aspect-[4/3] bg-gray-50 flex-shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <ImageIcon size={36} className="opacity-40 mb-1" />
            <span className="text-[11px] font-medium text-gray-400">No Image</span>
          </div>
        )}

        {/* Floating Promotional Badge */}
        {activeBadgeDef && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500/95 backdrop-blur-sm text-white text-[11px] font-bold rounded-lg shadow-md flex items-center gap-1 z-10">
            <span>{activeBadgeDef.icon}</span>
            <span>{activeBadgeDef.label}</span>
          </div>
        )}

        {/* Floating Quick Action */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-gray-500 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <MoreHorizontal size={18} />
        </button>

        {menuOpen && (
          <div className="absolute right-3 top-11 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 text-xs font-semibold animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={handleToggleAvailability}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-700"
            >
              {item.isAvailable ? (
                <>
                  <EyeOff size={14} className="text-gray-400" /> Mark as Hidden
                </>
              ) : (
                <>
                  <Eye size={14} className="text-[#10B981]" /> Mark as Available
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-600 border-t border-gray-50"
            >
              <Trash2 size={14} /> Delete Item
            </button>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
            {item.name}
          </h3>
          <p className="text-[13px] font-medium text-gray-400 mb-3">
            {item.categoryName || "Uncategorized"}
          </p>
          {item.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          {Array.isArray(item.tags) && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.map((t) => {
                const def = TAG_DEFINITIONS[t as MenuItemTag];
                if (!def) return null;
                return (
                  <span
                    key={t}
                    title={def.label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100/90 text-gray-700 rounded-md text-[10px] font-medium"
                  >
                    <span>{def.icon}</span>
                    <span>{def.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Price & Availability Status */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-black text-gray-900 text-lg">
            {formatPrice(item.price, currency)}
          </span>

          {item.isAvailable ? (
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md">
              AVAILABLE
            </span>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md">
              HIDDEN
            </span>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Edit3 size={16} className="text-gray-400" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 flex items-center justify-center border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 rounded-xl transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
