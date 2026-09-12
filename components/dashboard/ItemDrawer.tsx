"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Sparkles, Tag, Check } from "lucide-react";
import { saveMenuItemAction } from "@/lib/menu/actions";
import {
  type Category,
  type MenuItem,
  type MenuItemVariant,
  type MenuItemSize,
  type MenuItemExtra,
  type MenuItemBadge,
  type MenuItemTag,
  MENU_ITEM_BADGES,
  MENU_ITEM_TAGS,
  BADGE_DEFINITIONS,
  TAG_DEFINITIONS,
} from "@/types/menu";

interface ItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  categories: Category[];
  initialData?: MenuItem | null;
  onSaved: () => void;
}

export function ItemDrawer({
  isOpen,
  onClose,
  restaurantId,
  categories,
  initialData,
  onSaved,
}: ItemDrawerProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [badge, setBadge] = useState<MenuItemBadge | null>(null);
  const [tags, setTags] = useState<MenuItemTag[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Options
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants] = useState<MenuItemVariant[]>([]);

  const [sizesEnabled, setSizesEnabled] = useState(false);
  const [sizes, setSizes] = useState<MenuItemSize[]>([]);

  const [extrasEnabled, setExtrasEnabled] = useState(false);
  const [extras, setExtras] = useState<MenuItemExtra[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCategoryId(initialData.categoryId || (categories[0]?.id ?? ""));
      setPrice(String(initialData.price || ""));
      setDescription(initialData.description || "");
      setImageUrl(initialData.imageUrl || "");
      setBadge(initialData.badge || null);
      setTags(Array.isArray(initialData.tags) ? initialData.tags : []);
      setIsVisible(initialData.isVisible !== false);
      setIsAvailable(initialData.isAvailable !== false);
      setIsFeatured(Boolean(initialData.isFeatured));

      const v = initialData.variants || [];
      setVariants(v);
      setVariantsEnabled(v.length > 0);

      const s = initialData.sizes || [];
      setSizes(s);
      setSizesEnabled(s.length > 0);

      const ex = initialData.extras || [];
      setExtras(ex);
      setExtrasEnabled(ex.length > 0);
    } else {
      setName("");
      setCategoryId(categories[0]?.id ?? "");
      setPrice("");
      setDescription("");
      setImageUrl("");
      setBadge(null);
      setTags([]);
      setIsVisible(true);
      setIsAvailable(true);
      setIsFeatured(false);
      setVariants([]);
      setVariantsEnabled(false);
      setSizes([]);
      setSizesEnabled(false);
      setExtras([]);
      setExtrasEnabled(false);
    }
  }, [initialData, categories, isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tag: MenuItemTag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Item name is required");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Please enter a valid base price");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await saveMenuItemAction({
      id: initialData?.id,
      restaurantId,
      categoryId: categoryId || null,
      name,
      description,
      price: numPrice,
      imageUrl: imageUrl.trim() || null,
      badge: badge || null,
      tags,
      isVisible,
      isAvailable,
      isFeatured,
      variants: variantsEnabled ? variants.filter((v) => v.name.trim()) : [],
      sizes: sizesEnabled ? sizes.filter((s) => s.name.trim()) : [],
      extras: extrasEnabled ? extras.filter((e) => e.name.trim()) : [],
    });

    setSaving(false);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error || "Failed to save item");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? "Edit Menu Item" : "Add New Menu Item"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Set details, price, sizes, and extras
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Double Cheeseburger"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon || "🍽️"} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Base Price (DZD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    DA
                  </span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="650.00"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Juicy double beef patty, cheddar, caramelized onions and special sauce..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image URL"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition"
              />
              {imageUrl && (
                <div className="mt-2 h-28 w-44 rounded-xl overflow-hidden border border-gray-200 relative bg-gray-50">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Promotional Badge (Single Choice) */}
            <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/80 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Promotional Badge
                  </h4>
                  <p className="text-[11px] text-amber-700/80">
                    Select 1 primary promotional badge to highlight this dish
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBadge(null)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                    badge === null
                      ? "bg-white border-gray-400 text-gray-800 shadow-sm ring-2 ring-gray-200"
                      : "bg-white/60 border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700"
                  }`}
                >
                  <span>None</span>
                  {badge === null && <Check size={14} className="text-gray-600" />}
                </button>

                {MENU_ITEM_BADGES.map((b) => {
                  const def = BADGE_DEFINITIONS[b];
                  const isSelected = badge === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBadge(b)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                        isSelected
                          ? "bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-300"
                          : "bg-white border-amber-200/80 text-amber-900 hover:bg-amber-100/60"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{def.icon}</span>
                        <span className="truncate">{def.label}</span>
                      </span>
                      {isSelected && <Check size={14} className="text-white shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietary & Attribute Tags (Multiple Choice) */}
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 space-y-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Dietary & Attributes
                  </h4>
                  <p className="text-[11px] text-emerald-700/80">
                    Select all applicable dietary and flavor tags (multi-select)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {MENU_ITEM_TAGS.map((t) => {
                  const def = TAG_DEFINITIONS[t];
                  const isSelected = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-700 text-white shadow-sm"
                          : "bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-100/60"
                      }`}
                    >
                      <span>{def.icon}</span>
                      <span>{def.label}</span>
                      {isSelected && <Check size={12} className="text-white ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-xs font-bold text-gray-900">Item Availability</div>
                <div className="text-[11px] text-gray-500">Visible to customers scanning the QR code</div>
              </div>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="h-5 w-5 accent-[#10B981] rounded cursor-pointer"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Sizes / Portion Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Sizes & Portions</h3>
                <p className="text-xs text-gray-400">e.g. Small, Medium, Large with custom prices</p>
              </div>
              <input
                type="checkbox"
                checked={sizesEnabled}
                onChange={(e) => setSizesEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#10B981] rounded cursor-pointer"
              />
            </div>

            {sizesEnabled && (
              <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                {sizes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => {
                        const copy = [...sizes];
                        copy[idx].name = e.target.value;
                        setSizes(copy);
                      }}
                      placeholder="Size (e.g. Large)"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                        DA
                      </span>
                      <input
                        type="number"
                        step="50"
                        min="0"
                        value={s.price}
                        onChange={(e) => {
                          const copy = [...sizes];
                          copy[idx].price = e.target.value;
                          setSizes(copy);
                        }}
                        placeholder="850"
                        className="w-full pl-8 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSizes(sizes.filter((_, i) => i !== idx))}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setSizes([...sizes, { name: "", price: "" }])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#10B981] hover:text-emerald-700"
                >
                  <Plus size={14} /> Add Size
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Extras / Add-ons Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Extras & Add-ons</h3>
                <p className="text-xs text-gray-400">e.g. Extra Cheese (+100 DA), Sauce (+50 DA)</p>
              </div>
              <input
                type="checkbox"
                checked={extrasEnabled}
                onChange={(e) => setExtrasEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#10B981] rounded cursor-pointer"
              />
            </div>

            {extrasEnabled && (
              <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                {extras.map((ex, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => {
                        const copy = [...extras];
                        copy[idx].name = e.target.value;
                        setExtras(copy);
                      }}
                      placeholder="Extra (e.g. Extra Cheese)"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <div className="w-28 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                        +DA
                      </span>
                      <input
                        type="number"
                        step="10"
                        min="0"
                        value={ex.price}
                        onChange={(e) => {
                          const copy = [...extras];
                          copy[idx].price = e.target.value;
                          setExtras(copy);
                        }}
                        placeholder="100"
                        className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setExtras(extras.filter((_, i) => i !== idx))}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setExtras([...extras, { name: "", price: "" }])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#10B981] hover:text-emerald-700"
                >
                  <Plus size={14} /> Add Extra
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : initialData ? (
              "Update Item"
            ) : (
              "Save Item"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
