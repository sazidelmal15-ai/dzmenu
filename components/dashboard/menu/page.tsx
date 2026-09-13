'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus,
  LayoutGrid,
  List,
  Trash2,
  Edit3,
  Image as ImageIcon,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  FolderPlus,
  Layers,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/utils/currency';
import { evaluateItemDiscount } from '@/lib/menu/discounts';
import {
  type MenuItemBadge,
  type MenuItemTag,
  BADGE_DEFINITIONS,
  TAG_DEFINITIONS,
} from '@/types/menu';

// Code-split heavy drawers to keep initial bundle ultra-light and fast
const ItemDrawer = dynamic(() => import('./components/ItemDrawer'), { ssr: false });
const CategoryDrawer = dynamic(() => import('./components/CategoryDrawer'), { ssr: false });

// Global in-memory cache for instant 0ms page transitions
let inMemoryCategoriesCache: any[] | null = null;

// Smart category icon mapper
function getCategoryIcon(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('burger') || n.includes('برغر') || n.includes('برجر')) return '🍔';
  if (n.includes('pizza') || n.includes('بيتزا')) return '🍕';
  if (n.includes('side') || n.includes('salad') || n.includes('مقبلات') || n.includes('سلط')) return '🥗';
  if (n.includes('breakfast') || n.includes('فطور') || n.includes('egg') || n.includes('بيض')) return '🍳';
  if (n.includes('seafood') || n.includes('fish') || n.includes('سمك') || n.includes('بحر')) return '🐟';
  if (n.includes('main') || n.includes('رئيسي') || n.includes('طبق')) return '🍲';
  if (n.includes('sandwich') || n.includes('taco') || n.includes('تاكوس') || n.includes('ساندويتش') || n.includes('شاورما')) return '🌮';
  if (n.includes('grill') || n.includes('steak') || n.includes('bbq') || n.includes('مشاوي') || n.includes('لحم')) return '🥩';
  if (n.includes('pasta') || n.includes('باستا') || n.includes('مكرونة')) return '🍝';
  if (n.includes('chicken') || n.includes('دجاج') || n.includes('poulet')) return '🍗';
  if (n.includes('coffee') || n.includes('tea') || n.includes('قهوة') || n.includes('شاي') || n.includes('cafe')) return '☕';
  if (n.includes('drink') || n.includes('beverage') || n.includes('juice') || n.includes('عصير') || n.includes('مشروب')) return '🥤';
  if (n.includes('ice cream') || n.includes('dessert') || n.includes('cake') || n.includes('حلو') || n.includes('كيك') || n.includes('حلويات')) return '🍰';
  return '🍽️';
}

function getImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('/uploads/') || url.startsWith('http')) return url;
  return url;
}

export default function MenuPage({ initialCategories = [] }: { initialCategories?: any[] }) {
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [currency, setCurrency] = useState<string>('DZD');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(initialCategories.length === 0);
  const [, startTransition] = useTransition();

  // Drawer states (loaded lazily)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Filters & View Mode
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'hidden'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Delete item modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch Menu Data
  const fetchMenu = async (silent = false) => {
    try {
      if (!silent && categories.length === 0) setLoading(true);
      const res = await fetch('/api/menu/categories');
      const json = await res.json();
      const categoriesData = Array.isArray(json.data) ? json.data : [];
      setCategories(categoriesData);
      if (json.currency) setCurrency(json.currency);
      inMemoryCategoriesCache = categoriesData;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('dzmenu_categories_cache', JSON.stringify(categoriesData));
          if (json.currency) sessionStorage.setItem('dzmenu_currency_cache', json.currency);
        } catch {}
      }
    } catch (err) {
      console.error('fetchMenu error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 0ms instant hydration from cache
    if (inMemoryCategoriesCache && inMemoryCategoriesCache.length > 0) {
      setCategories(inMemoryCategoriesCache);
      setLoading(false);
    } else if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('dzmenu_categories_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryCategoriesCache = parsed;
            setCategories(parsed);
            setLoading(false);
          }
        }
        const savedCurr = sessionStorage.getItem('dzmenu_currency_cache');
        if (savedCurr) setCurrency(savedCurr);
      } catch {}
    }
    fetchMenu(true);
  }, []);

  // Compute Active Category and Items
  const activeCategory = useMemo(() => {
    if (activeCategoryId === 'all') return null;
    return categories.find((c) => c.id === activeCategoryId) || null;
  }, [categories, activeCategoryId]);

  const allItemsCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.items?.length || 0), 0);
  }, [categories]);

  const rawDisplayItems = useMemo(() => {
    if (activeCategoryId === 'all') {
      return categories.flatMap((c) =>
        (c.items || []).map((i: any) => ({ ...i, categoryName: c.name }))
      );
    }
    const cat = categories.find((c) => c.id === activeCategoryId);
    if (!cat) return [];
    return (cat.items || []).map((i: any) => ({ ...i, categoryName: cat.name }));
  }, [categories, activeCategoryId]);

  const displayItems = useMemo(() => {
    if (statusFilter === 'available') {
      return rawDisplayItems.filter((i: any) => i.isVisible !== false && !i.isDeleted);
    }
    if (statusFilter === 'hidden') {
      return rawDisplayItems.filter((i: any) => i.isVisible === false && !i.isDeleted);
    }
    return rawDisplayItems.filter((i: any) => !i.isDeleted);
  }, [rawDisplayItems, statusFilter]);

  // Instant 0ms Optimistic Visibility Toggle
  const handleToggleVisibility = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newIsVisible = item.isVisible === false ? true : false;

    // 1. Instant local optimistic update
    startTransition(() => {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: (cat.items || []).map((i: any) =>
            i.id === item.id ? { ...i, isVisible: newIsVisible } : i
          ),
        }))
      );
    });

    // 2. Fire background request to persist
    try {
      await apiFetch(`/menu/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isVisible: newIsVisible }),
      });
    } catch (err) {
      console.error('Failed to update visibility:', err);
      // Revert on error
      fetchMenu(true);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleAddNewItem = () => {
    setEditingItem(
      activeCategoryId !== 'all' ? { categoryId: activeCategoryId } : null
    );
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmItem(item);
    setDeleteInput('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    if (deleteInput.trim().toLowerCase() !== deleteConfirmItem.name.trim().toLowerCase()) {
      setDeleteError('Item name does not match. Please try again.');
      return;
    }
    try {
      setDeleting(true);
      setDeleteError('');
      await apiFetch(`/menu/items/${deleteConfirmItem.id}`, { method: 'DELETE' });
      setDeleteConfirmItem(null);
      setDeleteInput('');
      await fetchMenu(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#FAF9F5]">
      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* 1. RIGHT COLUMN: Ultra-fast Categories Navigation Sidebar (Master)        */}
        {/* ========================================================================= */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-white border-b md:border-b-0 md:border-l border-[#EFECE6] flex flex-col min-h-0">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#F3F0E6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#D97706]" />
              <h2 className="font-bold text-gray-900 text-base">الأقسام</h2>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {categories.length}
              </span>
            </div>
            <button
              onClick={() => setIsCategoryDrawerOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FEF9EE] hover:bg-[#FDE68A]/40 text-[#D97706] text-xs font-bold transition cursor-pointer"
            >
              <Plus size={14} /> قسم جديد
            </button>
          </div>

          {/* Categories Scrollable List */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* 'All Items' Tab */}
            <button
              type="button"
              onClick={() => setActiveCategoryId('all')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition text-right cursor-pointer ${
                activeCategoryId === 'all'
                  ? 'bg-[#FEF9EE] text-[#D97706] border border-amber-200/80 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-base">✨</span>
                <span className="truncate">كل الأطباق</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeCategoryId === 'all'
                    ? 'bg-[#D97706] text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {allItemsCount}
              </span>
            </button>

            {/* Individual Categories */}
            {categories.map((cat) => {
              const isActive = activeCategoryId === cat.id;
              const count = cat.items?.length || 0;
              const icon = cat.icon || getCategoryIcon(cat.name);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition text-right cursor-pointer ${
                    isActive
                      ? 'bg-[#FEF9EE] text-[#D97706] border border-amber-200/80 shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#D97706] text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {categories.length === 0 && !loading && (
              <div className="p-6 text-center text-gray-400 text-xs">
                لا توجد أقسام بعد. اضغط على "+ قسم جديد" للبدء.
              </div>
            )}
          </nav>
        </aside>

        {/* ========================================================================= */}
        {/* 2. LEFT COLUMN: Selected Category Items Workspace (Detail)                */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#FAF9F5] min-h-0 overflow-hidden">
          {/* Workspace Action Header */}
          <header className="px-6 py-4 bg-white border-b border-[#EFECE6] flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0">
                {activeCategory ? activeCategory.icon || getCategoryIcon(activeCategory.name) : '✨'}
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">
                  {activeCategory ? activeCategory.name : 'كل الأطباق'}
                </h1>
                <p className="text-xs text-gray-500">
                  {displayItems.length} طبق معروض
                </p>
              </div>
            </div>

            {/* Quick Filter & Actions Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'hover:text-gray-900'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('available')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === 'available' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'hover:text-gray-900'
                  }`}
                >
                  🟢 متوفر
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('hidden')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === 'hidden' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'hover:text-gray-900'
                  }`}
                >
                  ⚫ مخفي
                </button>
              </div>

              {/* View Switcher: Grid / List */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-gray-600">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-[#D97706] shadow-xs' : 'hover:text-gray-900'
                  }`}
                  title="عرض شبكي"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list' ? 'bg-white text-[#D97706] shadow-xs' : 'hover:text-gray-900'
                  }`}
                  title="عرض قائمة"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={handleAddNewItem}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus size={16} /> إضافة طبق
              </button>
            </div>
          </header>

          {/* Items Content Container (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6">
            {displayItems.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-[#E5E0D8]">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <FolderPlus size={28} />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">لا توجد أطباق في هذا العرض</h3>
                <p className="text-xs text-gray-500 max-w-xs mb-4">
                  {statusFilter !== 'all'
                    ? 'لا توجد أطباق تطابق الفلتر المختار حالياً.'
                    : 'ابدأ بإضافة أول طبق في هذا القسم لتظهر للزبائن في المنيو.'}
                </p>
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  + إضافة طبق جديد
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Cards Layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayItems.map((item: any) => {
                  const discountInfo = evaluateItemDiscount({
                    price: Number(item.price) || 0,
                    originalPrice: item.originalPrice,
                    discountStartsAt: item.discountStartsAt,
                    discountEndsAt: item.discountEndsAt,
                  });
                  const isVisible = item.isVisible !== false;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-[#EFECE6] p-4 flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                    >
                      {/* Card Visual & Badge */}
                      <div className="relative aspect-[4/3] rounded-xl bg-gray-50 overflow-hidden mb-3">
                        {item.images?.[0] || item.imageUrl ? (
                          <img
                            src={getImageUrl(item.images?.[0]?.url || item.imageUrl)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={32} />
                          </div>
                        )}

                        {/* Promo / Badge */}
                        {discountInfo.isActive && discountInfo.percentage ? (
                          <span className="absolute top-2.5 right-2.5 bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                            -{discountInfo.percentage}%
                          </span>
                        ) : item.badge && BADGE_DEFINITIONS[item.badge as MenuItemBadge] ? (
                          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                            <span>{BADGE_DEFINITIONS[item.badge as MenuItemBadge].icon}</span>
                            <span>{BADGE_DEFINITIONS[item.badge as MenuItemBadge].label}</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Card Info */}
                      <div className="flex-1 min-w-0 mb-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-sm truncate leading-snug">
                            {item.name}
                          </h3>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 font-normal">
                            {item.description}
                          </p>
                        )}
                        <p className="text-[11px] font-semibold text-gray-400 mt-1">
                          {item.categoryName}
                        </p>
                      </div>

                      {/* Price & Instant Status Toggle */}
                      <div className="pt-2 border-t border-[#F3F0E6] flex items-center justify-between mb-3">
                        <span className="font-black text-gray-900 text-base">
                          {formatPrice(item.price, currency)}
                        </span>

                        {/* 0ms Optimistic Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleVisibility(item, e)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isVisible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title={isVisible ? 'انقر للإخفاء من المنيو' : 'انقر للإظهار في المنيو'}
                        >
                          {isVisible ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>متوفر</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-gray-400" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Actions Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-[#FEF9EE] hover:text-[#D97706] text-gray-700 text-xs font-bold rounded-xl border border-[#EFECE6] transition cursor-pointer"
                        >
                          <Edit3 size={14} /> تعديل
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(item, e)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-[#EFECE6] transition cursor-pointer"
                          title="حذف الطبق"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Clean Table / List Layout */
              <div className="bg-white rounded-2xl border border-[#EFECE6] overflow-hidden shadow-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-[#F3F0E6] bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase">
                      <th className="py-3 px-4">الطبق</th>
                      <th className="py-3 px-4">القسم</th>
                      <th className="py-3 px-4">السعر</th>
                      <th className="py-3 px-4 text-center">الحالة</th>
                      <th className="py-3 px-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F0E6] text-sm">
                    {displayItems.map((item: any) => {
                      const isVisible = item.isVisible !== false;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition">
                          {/* Dish Image & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                {item.images?.[0] || item.imageUrl ? (
                                  <img
                                    src={getImageUrl(item.images?.[0]?.url || item.imageUrl)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                    🍽️
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                {item.description && (
                                  <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-xs font-semibold text-gray-500">
                            {item.categoryName}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 font-black text-gray-900 text-sm">
                            {formatPrice(item.price, currency)}
                          </td>

                          {/* Instant 0ms Status Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleToggleVisibility(item, e)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isVisible
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isVisible ? 'bg-emerald-500' : 'bg-gray-400'
                                }`}
                              />
                              <span>{isVisible ? 'متوفر' : 'مخفي'}</span>
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-gray-600 hover:text-[#D97706] hover:bg-[#FEF9EE] rounded-lg transition cursor-pointer"
                                title="تعديل"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(item, e)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS & DRAWERS (Loaded dynamically on demand)                        */}
      {/* ========================================================================= */}

      {/* Edit / Add Item Drawer */}
      {isDrawerOpen && (
        <ItemDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setEditingItem(null);
          }}
          categories={categories}
          initialData={editingItem}
          onSaved={() => fetchMenu(true)}
          currency={currency}
        />
      )}

      {/* Edit / Add Category Drawer */}
      {isCategoryDrawerOpen && (
        <CategoryDrawer
          isOpen={isCategoryDrawerOpen}
          onClose={() => setIsCategoryDrawerOpen(false)}
          existingCategories={categories}
          onSaved={() => fetchMenu(true)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">تأكيد حذف الطبق</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              هل أنت متأكد من حذف <strong className="text-gray-900">"{deleteConfirmItem.name}"</strong>؟
              للتأكيد، اكتب اسم الطبق أدناه:
            </p>

            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={deleteConfirmItem.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs mb-3 text-right focus:outline-none focus:border-red-500"
              autoFocus
            />

            {deleteError && (
              <p className="text-xs text-red-600 font-semibold mb-3">{deleteError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting || deleteInput.trim() !== deleteConfirmItem.name.trim()}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
              >
                {deleting ? 'جاري الحذف...' : 'حذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
