'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Trash2,
  Download,
  Upload,
  Edit3,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/utils/currency';
import { evaluateItemDiscount } from '@/lib/menu/discounts';
import {
  type MenuItemBadge,
  type MenuItemTag,
  BADGE_DEFINITIONS,
  TAG_DEFINITIONS,
} from '@/types/menu';
import ItemDrawer from './components/ItemDrawer';
import CategoryDrawer from './components/CategoryDrawer';

// Global in-memory cache for instant 0ms page transitions
let inMemoryCategoriesCache: any[] | null = null;

export default function MenuPage({ initialCategories = [] }: { initialCategories?: any[] }) {
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [currency, setCurrency] = useState<string>('DZD');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(initialCategories.length === 0);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name');

  // Delete confirmation modal state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');


  // View Mode: Grid Cards or Clean Table List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Horizontal category carousel scrolling
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (categoriesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const scrollAmount = 320;
      categoriesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  const fetchMenu = async (showSpinner = false) => {
    try {
      if (showSpinner && categories.length === 0) {
        setLoading(true);
      }
      const res = await fetch('/api/menu/categories');
      const json = await res.json();
      const categoriesData = Array.isArray(json.data) ? json.data : [];
      setCategories(categoriesData);
      if (json.currency) {
        setCurrency(json.currency);
      }
      inMemoryCategoriesCache = categoriesData;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('dzmenu_categories_cache', JSON.stringify(categoriesData));
          if (json.currency) {
            sessionStorage.setItem('dzmenu_currency_cache', json.currency);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Safely hydrate from client cache after SSR mount (100% Hydration Safe)
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
        if (savedCurr) {
          setCurrency(savedCurr);
        }
      } catch (e) {}
    }

    // Fresh sync in the background
    fetchMenu();
  }, []);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (item: any) => {
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
      await fetchMenu();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };


  const handleAddNew = () => {
    setEditingItem(null);
    setIsDrawerOpen(true);
  };

  // Flatten items based on selected category
  const baseItems =
    activeCategoryId === 'all'
      ? categories.flatMap((c) => (c.items || []).map((i: any) => ({ ...i, categoryName: c.name })))
      : categories
          .find((c) => c.id === activeCategoryId)
          ?.items?.map((i: any) => ({
            ...i,
            categoryName: categories.find((c) => c.id === activeCategoryId)?.name,
          })) || [];

  // Apply search filter
  const searchedItems = searchQuery.trim()
    ? baseItems.filter(
        (item: any) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : baseItems;

  // Apply status filter
  const filteredItems =
    statusFilter === 'all'
      ? searchedItems
      : statusFilter === 'available'
      ? searchedItems.filter((item: any) => item.isAvailable && item.isVisible !== false && !item.isDeleted)
      : statusFilter === 'hidden'
      ? searchedItems.filter((item: any) => item.isVisible === false && !item.isDeleted)
      : statusFilter === 'unavailable'
      ? searchedItems.filter((item: any) => !item.isAvailable && !item.isDeleted)
      : statusFilter === 'featured'
      ? searchedItems.filter((item: any) => item.isFeatured && !item.isDeleted)
      : searchedItems;

  // Apply sort
  const displayItems = [...filteredItems].sort((a: any, b: any) => {
    if (sortOrder === 'price_asc') return a.price - b.price;
    if (sortOrder === 'price_desc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  // Pagination calculation
  const totalPages = Math.ceil(displayItems.length / itemsPerPage) || 1;
  const paginatedItems = displayItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const allItemsCount = categories.reduce((sum, c) => sum + (c.items?.length || 0), 0);

  // Category dot colors for table view
  const getCategoryDotColor = (categoryName: string) => {
    const n = (categoryName || '').toLowerCase();
    if (n.includes('burger') || n.includes('برغر')) return 'bg-amber-500';
    if (n.includes('pizza') || n.includes('بيتزا')) return 'bg-rose-500';
    if (n.includes('drink') || n.includes('juice') || n.includes('عصير') || n.includes('مشروب')) return 'bg-blue-500';
    if (n.includes('dessert') || n.includes('cake') || n.includes('حلو')) return 'bg-purple-500';
    if (n.includes('side') || n.includes('salad') || n.includes('سلط') || n.includes('مقبلات')) return 'bg-emerald-500';
    if (n.includes('breakfast') || n.includes('فطور') || n.includes('egg')) return 'bg-yellow-500';
    if (n.includes('seafood') || n.includes('fish') || n.includes('سمك')) return 'bg-cyan-500';
    if (n.includes('grill') || n.includes('steak') || n.includes('لحم')) return 'bg-orange-600';
    return 'bg-amber-500';
  };

  // Smart category icons mapping for presentation
  const getCategoryIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('burger') || n.includes('برغر')) return '🍔';
    if (n.includes('pizza') || n.includes('بيتزا')) return '🍕';
    if (n.includes('side') || n.includes('salad') || n.includes('مقبلات') || n.includes('سلط')) return '🥗';
    if (n.includes('breakfast') || n.includes('فطور') || n.includes('egg')) return '🍳';
    if (n.includes('seafood') || n.includes('fish') || n.includes('سمك') || n.includes('بحر')) return '🐟';
    if (n.includes('main') || n.includes('رئيسي') || n.includes('طبق')) return '🍲';
    if (n.includes('sandwich') || n.includes('taco') || n.includes('تاكوس') || n.includes('ساندويتش')) return '🌮';
    if (n.includes('grill') || n.includes('steak') || n.includes('bbq') || n.includes('مشاوي') || n.includes('لحم')) return '🥩';
    if (n.includes('pasta') || n.includes('باستا') || n.includes('مكرونة')) return '🍝';
    if (n.includes('chicken') || n.includes('دجاج') || n.includes('poulet')) return '🍗';
    if (n.includes('coffee') || n.includes('tea') || n.includes('قهوة') || n.includes('شاي')) return '☕';
    if (n.includes('drink') || n.includes('beverage') || n.includes('juice') || n.includes('عصير') || n.includes('مشروب')) return '🥤';
    if (n.includes('ice cream') || n.includes('dessert') || n.includes('cake') || n.includes('حلو') || n.includes('كيك')) return '🍰';
    return '🍽️';
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('/uploads/')) return url;
    if (url.startsWith('http')) return url;
    return url;
  };

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">Manage your categories and menu dishes in a split studio view</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-500 bg-white text-sm font-bold text-amber-600 hover:bg-[#FEF9EE] transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Category
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-bold transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Item
          </button>
        </div>
      </div>

      {/* Split-Pane Studio Container */}
      <div className="flex flex-col lg:flex-row-reverse gap-6 items-start flex-1 min-h-[650px]">
        {/* ========================================================================= */}
        {/* RIGHT SIDE: Categories Navigation Sidebar                                  */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-72 xl:w-80 bg-white rounded-3xl border border-[#F3F0E6] p-4 shadow-sm shrink-0 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F3F0E6]">
            <div className="flex items-center gap-2">
              <span className="text-lg">📁</span>
              <h2 className="text-[15px] font-bold text-gray-900">Categories</h2>
            </div>
            <button
              onClick={() => setIsCategoryDrawerOpen(true)}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-[#FEF9EE] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + New
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {/* All Categories Button */}
            <button
              onClick={() => {
                setActiveCategoryId('all');
                setCurrentPage(1);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all text-left cursor-pointer border ${
                activeCategoryId === 'all'
                  ? 'bg-[#FEF9EE] border-amber-400 text-gray-900 shadow-sm'
                  : 'bg-transparent border-transparent hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                    activeCategoryId === 'all' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <LayoutGrid size={17} />
                </div>
                <div className="min-w-0">
                  <div className={`text-[14px] font-bold truncate ${activeCategoryId === 'all' ? 'text-gray-900' : 'text-gray-800'}`}>
                    All Categories
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">{allItemsCount} items</div>
                </div>
              </div>
              {activeCategoryId === 'all' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>

            {/* Specific Category Buttons */}
            {categories.map((cat) => {
              const isActive = activeCategoryId === cat.id;
              const itemCount = cat.items?.length || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all text-left cursor-pointer border ${
                    isActive
                      ? 'bg-[#FEF9EE] border-amber-400 text-gray-900 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base shrink-0 overflow-hidden">
                      {cat.icon && cat.icon !== '🍽️' ? (
                        cat.icon.startsWith('http') || cat.icon.startsWith('blob:') || cat.icon.startsWith('data:') || cat.icon.startsWith('/') ? (
                          <img src={cat.icon} alt={cat.name} className="w-5 h-5 object-contain" />
                        ) : (
                          cat.icon
                        )
                      ) : (
                        getCategoryIcon(cat.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[14px] font-bold truncate ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-gray-400 font-medium">{itemCount} items</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {itemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LEFT SIDE: Category Content & Items Workspace                             */}
        {/* ========================================================================= */}
        <div className="flex-1 w-full flex flex-col min-w-0 bg-white rounded-3xl border border-[#F3F0E6] p-5 sm:p-6 shadow-sm">
          {/* Workspace Header for Selected Category */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 mb-6 border-b border-[#F3F0E6]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FEF9EE] border border-amber-200/80 flex items-center justify-center text-xl shadow-xs">
                {activeCategoryId === 'all' ? (
                  '🍽️'
                ) : (
                  getCategoryIcon(categories.find((c) => c.id === activeCategoryId)?.name || '')
                )}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {activeCategoryId === 'all'
                    ? 'All Dishes'
                    : categories.find((c) => c.id === activeCategoryId)?.name || 'Category Dishes'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {displayItems.length} items in this view
                </p>
              </div>
            </div>

            {/* Filters & View Mode Toggles */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-[#FAF9F5] border border-[#F3F0E6] rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer shadow-xs"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="hidden">Hidden</option>
                  <option value="unavailable">Out of Stock</option>
                  <option value="featured">Featured</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort Order */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="appearance-none bg-[#FAF9F5] border border-[#F3F0E6] rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer shadow-xs"
                >
                  <option value="name">Sort: Name</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Grid / List Mode */}
              <div className="flex bg-[#FAF9F5] border border-[#F3F0E6] rounded-xl p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#D97706] shadow-xs'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-[#D97706] shadow-xs'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  title="Table List View"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Quick Add in Category Button */}
              <button
                onClick={handleAddNew}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm cursor-pointer ml-1"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Dish</span>
              </button>
            </div>
          </div>

          {/* Main Items Display Area */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed border-[#F3F0E6] p-6">
              <div className="w-14 h-14 rounded-2xl bg-[#FEF9EE] flex items-center justify-center text-2xl mb-3">
                🍽️
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No items in this category</h3>
              <p className="text-xs text-gray-400 max-w-xs mb-5">
                Add your first delicious item to this section to showcase it in your digital menu.
              </p>
              <button
                onClick={handleAddNew}
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Item to This Category</span>
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* Table / List View */
            <div className="border border-[#F3F0E6] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#F3F0E6] text-[11px] font-bold tracking-wider text-gray-400 uppercase bg-[#FAF9F5]/60">
                      <th className="py-3.5 pl-5 pr-4">ITEM</th>
                      <th className="py-3.5 px-4">CATEGORY</th>
                      <th className="py-3.5 px-4">PRICE</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 pr-5 pl-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F0E6]/60">
                    {paginatedItems.map((item: any) => {
                      const discountInfo = evaluateItemDiscount({
                        price: Number(item.price) || 0,
                        originalPrice: item.originalPrice,
                        discountStartsAt: item.discountStartsAt,
                        discountEndsAt: item.discountEndsAt,
                      });
                      const effectivePrice = discountInfo.isActive
                        ? Number(item.price)
                        : (discountInfo.originalPrice != null && discountInfo.originalPrice > Number(item.price)
                            ? discountInfo.originalPrice
                            : Number(item.price));

                      return (
                        <tr key={item.id} className="hover:bg-[#FEF9EE]/30 transition-colors group">
                          {/* Image + Title */}
                          <td className="py-3 pl-5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-[#F3F0E6]">
                                {item.images?.[0] ? (
                                  <img src={getImageUrl(item.images[0].url)} alt={item.name} className="w-full h-full object-cover" />
                                ) : item.imageUrl ? (
                                  <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon size={18} className="opacity-40" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-[14px] truncate group-hover:text-[#D97706] transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate max-w-xs">
                                  {item.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${getCategoryDotColor(item.categoryName)}`} />
                              <span className="text-[13px] font-medium text-gray-700">{item.categoryName || "General"}</span>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {discountInfo.isActive ? (
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-amber-600 text-[14px]">{formatPrice(item.price, currency)}</span>
                                {discountInfo.originalPrice && (
                                  <span className="text-[11px] text-gray-400 line-through font-medium">
                                    {formatPrice(discountInfo.originalPrice, currency)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900 text-[14px]">{formatPrice(effectivePrice, currency)}</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {item.isVisible === false ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Hidden
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 pr-5 pl-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 rounded-lg border border-[#F3F0E6] text-gray-600 hover:text-[#D97706] hover:border-amber-300 hover:bg-[#FEF9EE] transition shadow-2xs cursor-pointer"
                                title="Edit item"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item)}
                                className="p-1.5 rounded-lg border border-[#F3F0E6] text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition shadow-2xs cursor-pointer"
                                title="Delete item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F0E6] bg-[#FAF9F5]/40 text-xs text-gray-500">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded-lg border border-[#F3F0E6] hover:bg-white disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-lg border border-[#F3F0E6] hover:bg-white disabled:opacity-40"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Grid Cards View */
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedItems.map((item: any) => {
                  const discountInfo = evaluateItemDiscount({
                    price: Number(item.price) || 0,
                    originalPrice: item.originalPrice,
                    discountStartsAt: item.discountStartsAt,
                    discountEndsAt: item.discountEndsAt,
                  });
                  const effectivePrice = discountInfo.isActive
                    ? Number(item.price)
                    : (discountInfo.originalPrice != null && discountInfo.originalPrice > Number(item.price)
                        ? discountInfo.originalPrice
                        : Number(item.price));

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-[#F3F0E6] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group hover:border-amber-300"
                    >
                      <div className="relative aspect-[16/10] bg-gray-50 shrink-0 overflow-hidden">
                        {item.images?.[0] ? (
                          <img
                            src={getImageUrl(item.images[0].url)}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon size={28} className="opacity-30" />
                          </div>
                        )}

                        {discountInfo.isActive && discountInfo.percentage ? (
                          <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                            -{discountInfo.percentage}% OFF
                          </div>
                        ) : item.badge && BADGE_DEFINITIONS[item.badge as MenuItemBadge] ? (
                          <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            <span>{BADGE_DEFINITIONS[item.badge as MenuItemBadge].icon}</span>
                            <span>{BADGE_DEFINITIONS[item.badge as MenuItemBadge].label}</span>
                          </div>
                        ) : null}

                        <div className="absolute top-2.5 right-2.5">
                          {item.isVisible === false ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-900/80 backdrop-blur-xs text-white rounded-md shadow-xs">
                              Hidden
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white rounded-md shadow-xs">
                              Available
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-[15px] leading-tight mb-1 truncate">{item.name}</h3>
                          <p className="text-xs text-gray-400 line-clamp-1 mb-2 font-normal">
                            {item.description || "No description provided"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#F3F0E6] mt-2">
                          <div>
                            {discountInfo.isActive ? (
                              <div className="flex items-baseline gap-1">
                                <span className="font-black text-amber-600 text-base">{formatPrice(item.price, currency)}</span>
                                {discountInfo.originalPrice && (
                                  <span className="text-[10px] text-gray-400 line-through">
                                    {formatPrice(discountInfo.originalPrice, currency)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-black text-gray-900 text-base">{formatPrice(effectivePrice, currency)}</span>
                            )}
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEdit(item)}
                              className="px-3 py-1.5 border border-[#F3F0E6] hover:border-amber-400 hover:bg-[#FEF9EE] hover:text-[#D97706] text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="w-8 h-8 flex items-center justify-center border border-[#F3F0E6] hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination for Grid */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 mt-4 border-t border-[#F3F0E6] text-xs text-gray-500">
                  <span>Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-[#F3F0E6] hover:bg-white disabled:opacity-40 cursor-pointer font-bold"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-[#F3F0E6] hover:bg-white disabled:opacity-40 cursor-pointer font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <ItemDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            categories={categories}
            initialData={editingItem}
            currency={currency}
            onSaved={() => {
              setIsDrawerOpen(false);
              fetchMenu();
            }}
          />
        )}
        {isCategoryDrawerOpen && (
          <CategoryDrawer
            isOpen={isCategoryDrawerOpen}
            onClose={() => setIsCategoryDrawerOpen(false)}
            existingCategories={categories}
            onSaved={() => {
              setIsCategoryDrawerOpen(false);
              fetchMenu();
            }}
          />
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* PERMANENT DELETE CONFIRMATION MODAL                                */}
      {/* ================================================================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteConfirmItem(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Red top bar */}
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-600 w-full" />

            <div className="p-6">
              {/* Icon + Title */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Delete Item Permanently
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">
                    This action <span className="font-bold text-red-600">cannot be undone</span>. The item and all its data will be permanently removed from the database.
                  </p>
                </div>
              </div>

              {/* Item preview */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 mb-5 flex items-center gap-3">
                {deleteConfirmItem.imageUrl ? (
                  <img src={deleteConfirmItem.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0 flex items-center justify-center">
                    <ImageIcon size={18} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-sm">{deleteConfirmItem.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {deleteConfirmItem.categoryName} · {formatPrice(deleteConfirmItem.price, currency)}
                  </p>
                </div>
              </div>

              {/* Name confirmation input */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">{deleteConfirmItem.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmDelete()}
                  placeholder={`Type "${deleteConfirmItem.name}" here...`}
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition"
                />
                {deleteError && (
                  <p className="text-xs text-red-600 font-medium mt-1.5">{deleteError}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting || deleteInput.trim().toLowerCase() !== deleteConfirmItem.name.trim().toLowerCase()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-600/25 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
