"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  LayoutGrid,
  List,
  Upload,
  Download,
  Utensils,
  X,
} from "lucide-react";
import { MenuItemCard } from "./MenuItemCard";
import { ItemDrawer } from "./ItemDrawer";
import { CategoryDrawer } from "./CategoryDrawer";
import type { Category, MenuItem } from "@/types/menu";
import type { Restaurant } from "@/types/restaurant";

interface MenuManagementViewProps {
  restaurant: Restaurant;
  initialCategories: Category[];
  initialItems: MenuItem[];
}

export function MenuManagementView({
  restaurant,
  initialCategories,
  initialItems,
}: MenuManagementViewProps) {
  const [categories] = useState<Category[]>(initialCategories);
  const [items] = useState<MenuItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Drawer states
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  // Total item count across all categories
  const totalItemCount = items.length;

  // Filtered and sorted items
  const displayItems = useMemo(() => {
    let result = [...items];

    // Filter by Category
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    // Filter by Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // Filter by Status
    if (statusFilter === "available") {
      result = result.filter((item) => item.isAvailable);
    } else if (statusFilter === "hidden") {
      result = result.filter((item) => !item.isAvailable);
    }

    // Sort items
    if (sortOrder === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, selectedCategory, searchQuery, statusFilter, sortOrder]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsItemDrawerOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsItemDrawerOpen(true);
  };

  return (
    <div className="flex-1 bg-[#FAFBFD] p-6 sm:p-8 overflow-y-auto min-h-screen">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight">
            Menu Management
          </h2>
          <p className="text-[15px] text-gray-500 mt-1">
            Manage your menu items, categories and options
          </p>
        </div>

        {/* Header Action Buttons matching screenshot */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <Upload size={16} className="text-gray-400" />
            <span>Import</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <Download size={16} className="text-gray-400" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoryDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#10B981] bg-white text-sm font-bold text-[#10B981] hover:bg-[#EBFBF5] transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Category</span>
          </button>

          <button
            type="button"
            onClick={handleAddNewItem}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Category Pills Carousel */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {/* All Categories Pill */}
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl min-w-max transition-all ${
            selectedCategory === "all"
              ? "bg-white border-2 border-[#10B981] shadow-md shadow-emerald-500/10"
              : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm opacity-80 hover:opacity-100"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
              selectedCategory === "all"
                ? "bg-[#EBFBF5] text-[#10B981]"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            <LayoutGrid size={20} className={selectedCategory === "all" ? "text-[#10B981]" : "text-gray-500"} />
          </div>
          <div className="text-left">
            <div className={`text-[15px] font-bold ${selectedCategory === "all" ? "text-gray-900" : "text-gray-700"}`}>
              All Categories
            </div>
            <div className="text-[13px] font-medium text-gray-400">
              {totalItemCount} items
            </div>
          </div>
        </button>

        {/* Dynamic Category Pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = items.filter((i) => i.categoryId === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl min-w-max transition-all ${
                isSelected
                  ? "bg-white border-2 border-[#10B981] shadow-md shadow-emerald-500/10"
                  : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm opacity-80 hover:opacity-100"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {cat.icon ? (
                  cat.icon.startsWith('http') || cat.icon.startsWith('blob:') || cat.icon.startsWith('data:') || cat.icon.startsWith('/') ? (
                    cat.icon.includes('high_contrast.svg') ? (
                      <div
                        className="w-6 h-6"
                        style={{
                          backgroundColor: '#10B981',
                          WebkitMaskImage: `url("${cat.icon}")`,
                          WebkitMaskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskImage: `url("${cat.icon}")`,
                          maskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          maskPosition: 'center',
                        }}
                      />
                    ) : (
                      <img src={cat.icon} alt={cat.name} className="w-6 h-6 object-contain" />
                    )
                  ) : (
                    cat.icon
                  )
                ) : (
                  "🍽️"
                )}
              </div>
              <div className="text-left flex-1 pr-2">
                <div className={`text-[15px] font-bold ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                  {cat.name}
                </div>
                <div className="text-[13px] font-medium text-gray-400">{count} items</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar matching screenshot */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        {/* Search Input */}
        <div className="relative w-full lg:w-[320px]">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all shadow-sm placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#10B981] shadow-sm cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="hidden">Hidden</option>
              <option value="low_stock">Low Stock</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#10B981] shadow-sm cursor-pointer"
            >
              <option value="name">Sort by: Name</option>
              <option value="price_asc">Sort by: Price (Low to High)</option>
              <option value="price_desc">Sort by: Price (High to Low)</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm ml-2">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-[#EBFBF5] text-[#10B981]"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-[#EBFBF5] text-[#10B981]"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200 border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 mb-4">
            <Utensils size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">No items found</h3>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            There are no menu items in this category. Click the button below to add your first item.
          </p>
          <button
            type="button"
            onClick={handleAddNewItem}
            className="flex items-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"
              : "space-y-4 pb-20"
          }
        >
          {displayItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              restaurantId={restaurant.id}
              onEdit={handleEditItem}
              onChanged={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Drawers */}
      <ItemDrawer
        isOpen={isItemDrawerOpen}
        onClose={() => setIsItemDrawerOpen(false)}
        restaurantId={restaurant.id}
        categories={categories}
        initialData={editingItem}
        onSaved={handleRefresh}
      />

      <CategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
        restaurantId={restaurant.id}
        existingCategories={categories}
        onSaved={handleRefresh}
      />
    </div>
  );
}
