"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { saveCategoryAction, syncCategoriesAction } from "@/lib/menu/actions";
import type { Category } from "@/types/menu";

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  existingCategories: Category[];
  onSaved: () => void;
}

const CATEGORY_TEMPLATES = [
  { id: "pizza", name: "Pizza", icon: "🍕", description: "Wood-fired, classic & specialty pizzas" },
  { id: "burgers", name: "Burgers", icon: "🍔", description: "Gourmet, smash & classic burger meals" },
  { id: "sandwiches", name: "Sandwiches & Tacos", icon: "🌮", description: "Wraps, paninis & Algerian tacos" },
  { id: "grills", name: "Grills & BBQ", icon: "🥩", description: "Steaks, skewers & mixed meat platters" },
  { id: "appetizers", name: "Appetizers & Salads", icon: "🥗", description: "Starters, fries & fresh salads" },
  { id: "pasta", name: "Pasta & Italian", icon: "🍝", description: "Fresh pasta, lasagna & sauces" },
  { id: "drinks", name: "Drinks & Juices", icon: "🥤", description: "Sodas, fresh smoothies & cold drinks" },
  { id: "coffee", name: "Hot Drinks & Coffee", icon: "☕", description: "Espresso, lattes & traditional tea" },
  { id: "desserts", name: "Desserts & Sweets", icon: "🍰", description: "Cakes, ice cream & pastries" },
  { id: "seafood", name: "Seafood & Fish", icon: "🐟", description: "Fresh fish & seafood specialties" },
];

export function CategoryDrawer({
  isOpen,
  onClose,
  restaurantId,
  existingCategories,
  onSaved,
}: CategoryDrawerProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customIcon, setCustomIcon] = useState("🍽️");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveTemplates = async () => {
    if (selectedTemplateIds.length === 0) return;
    setSaving(true);
    setError(null);

    const categoriesToAdd = selectedTemplateIds.map((id, index) => {
      const template = CATEGORY_TEMPLATES.find((t) => t.id === id)!;
      return {
        name: template.name,
        description: template.description,
        icon: template.icon,
        sortOrder: existingCategories.length + index,
      };
    });

    const result = await syncCategoriesAction(restaurantId, categoriesToAdd);
    setSaving(false);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error || "Failed to save categories");
    }
  };

  const handleSaveCustom = async () => {
    if (!customName.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    setError(null);

    const result = await saveCategoryAction({
      restaurantId,
      name: customName,
      description: customDescription,
      icon: customIcon || "🍽️",
      sortOrder: existingCategories.length,
    });

    setSaving(false);
    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error || "Failed to save category");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Categories</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select popular templates or create custom</p>
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

          {/* Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                !isCustomMode
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Popular Templates
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                isCustomMode
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Custom Category
            </button>
          </div>

          {!isCustomMode ? (
            /* Templates Grid */
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Select Templates ({selectedTemplateIds.length} chosen)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORY_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateIds.includes(tmpl.id);
                  const isAlreadyAdded = existingCategories.some(
                    (c) => c.name.toLowerCase() === tmpl.name.toLowerCase()
                  );

                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => toggleTemplate(tmpl.id)}
                      className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        isAlreadyAdded
                          ? "opacity-40 bg-gray-50 border-gray-100 cursor-not-allowed"
                          : isSelected
                          ? "border-[#10B981] bg-[#EBFBF5] shadow-sm ring-1 ring-[#10B981]"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{tmpl.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-gray-900 truncate">
                          {tmpl.name}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {isAlreadyAdded ? "Already Added" : tmpl.description}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Category Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Traditional Tajines / طواجن تقليدية"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Icon / Emoji
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    maxLength={4}
                    placeholder="🍲"
                    className="w-16 text-center text-xl px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#10B981]"
                  />
                  <span className="text-xs text-gray-400">
                    Type or paste an emoji (e.g. 🍕, 🍔, 🍲, ☕)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={3}
                  placeholder="Short description of items in this category"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition"
                />
              </div>
            </div>
          )}
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
            disabled={saving || (!isCustomMode && selectedTemplateIds.length === 0)}
            onClick={isCustomMode ? handleSaveCustom : handleSaveTemplates}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : isCustomMode ? (
              "Save Category"
            ) : (
              `Add Selected (${selectedTemplateIds.length})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
