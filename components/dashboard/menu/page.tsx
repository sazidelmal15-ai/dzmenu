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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-[15px] text-gray-500 mt-1">Manage your menu items, categories and options</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F3F0E6] bg-white text-sm font-semibold text-gray-700 hover:bg-[#FAF9F5] hover:text-gray-900 transition-colors shadow-sm">
            <Upload size={16} className="text-gray-400" /> Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#F3F0E6] bg-white text-sm font-semibold text-gray-700 hover:bg-[#FAF9F5] hover:text-gray-900 transition-colors shadow-sm">
            <Download size={16} className="text-gray-400" /> Export
          </button>
          <button
            onClick={() => setIsCategoryDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-500 bg-white text-sm font-bold text-amber-600 hover:bg-[#FEF9EE] transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Category
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-bold transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Item
          </button>
        </div>
      </div>

      {/* Categories Bar Carousel with Arrow Controls */}
      <div className="relative group mb-4">
        {/* Left Scroll Arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#F3F0E6] text-gray-700 shadow-md hover:bg-[#FEF9EE] hover:text-[#D97706] hover:scale-110 active:scale-95 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
        )}

        {/* Categories Bar */}
        <div
          ref={categoriesScrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-none no-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl min-w-max border-2 transition-all duration-150 ${
              activeCategoryId === 'all'
                ? 'bg-white border-amber-500 shadow-md shadow-amber-500/15'
                : 'bg-white border-[#F3F0E6] hover:border-amber-300 shadow-sm opacity-80 hover:opacity-100'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                activeCategoryId === 'all' ? 'bg-[#FEF9EE] text-[#D97706]' : 'bg-gray-50'
              }`}
            >
              <LayoutGrid size={20} className={activeCategoryId === 'all' ? 'text-[#D97706]' : 'text-gray-500'} />
            </div>
            <div className="text-left">
              <div className={`text-[15px] font-bold ${activeCategoryId === 'all' ? 'text-gray-900' : 'text-gray-700'}`}>
                All Categories
              </div>
              <div className="text-[13px] font-medium text-gray-400">{allItemsCount} items</div>
            </div>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl min-w-max border-2 transition-all duration-150 ${
                activeCategoryId === cat.id
                  ? 'bg-white border-amber-500 shadow-md shadow-amber-500/15'
                  : 'bg-white border-[#F3F0E6] hover:border-amber-300 shadow-sm opacity-80 hover:opacity-100'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {cat.icon && cat.icon !== '🍽️' ? (
                  cat.icon.startsWith('http') || cat.icon.startsWith('blob:') || cat.icon.startsWith('data:') || cat.icon.startsWith('/') ? (
                    cat.icon.includes('high_contrast.svg') ? (
                      <div
                        className="w-6 h-6"
                        style={{
                          backgroundColor: '#D97706',
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
                  getCategoryIcon(cat.name)
                )}
              </div>
              <div className="text-left flex-1 pr-2">
                <div className={`text-[15px] font-bold ${activeCategoryId === cat.id ? 'text-gray-900' : 'text-gray-700'}`}>
                  {cat.name}
                </div>
                <div className="text-[13px] font-medium text-gray-400">{cat.items?.length || 0} items</div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Scroll Arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#F3F0E6] text-gray-700 shadow-md hover:bg-[#FEF9EE] hover:text-[#D97706] hover:scale-110 active:scale-95 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="relative w-full lg:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F3F0E6] rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-[#F3F0E6] rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:border-amber-500 shadow-sm cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="hidden">Hidden from Menu</option>
              <option value="unavailable">Unavailable (Out of Stock)</option>
              <option value="featured">⭐ Featured Only</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-white border border-[#F3F0E6] rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:border-amber-500 shadow-sm cursor-pointer"
            >
              <option value="name">Sort by: Name</option>
              <option value="price_asc">Sort by: Price ↑</option>
              <option value="price_desc">Sort by: Price ↓</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Grid / List View Mode Toggle */}
          <div className="flex bg-white border border-[#F3F0E6] rounded-xl p-1 shadow-sm ml-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#FEF9EE] text-[#D97706] shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-[#FEF9EE] text-[#D97706] shadow-sm'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Table / List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Items Display */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-[#F3F0E6] border-dashed">
          <LayoutGrid className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 max-w-sm mb-6">
            There are no menu items in this category. Click the button below to add your first item.
          </p>
          <button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/25"
          >
            Add Item
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* Table / List View */
        <div className="bg-white rounded-3xl border border-[#F3F0E6] shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F3F0E6] text-[11px] font-bold tracking-wider text-gray-400 uppercase bg-[#FAF9F5]/60">
                  <th className="py-4 pl-6 pr-4">ITEM</th>
                  <th className="py-4 px-4">CATEGORY</th>
                  <th className="py-4 px-4">PRICE</th>
                  <th className="py-4 px-4">STATUS</th>
                  <th className="py-4 pr-6 pl-4 text-right">ACTIONS</th>
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
                      {/* Item Image + Title + Description */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-[#F3F0E6]">
                            {item.images?.[0] ? (
                              <img src={getImageUrl(item.images[0].url)} alt={item.name} className="w-full h-full object-cover" />
                            ) : item.imageUrl ? (
                              <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ImageIcon size={20} className="opacity-40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-[14.5px] leading-snug truncate group-hover:text-[#D97706] transition-colors">
                              {item.name}
                            </p>
                            <p className="text-[12px] text-gray-400 truncate max-w-xs">
                              {item.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category with dot */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getCategoryDotColor(item.categoryName)}`} />
                          <span className="text-[13.5px] font-medium text-gray-700">{item.categoryName || "General"}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {discountInfo.isActive ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-amber-600 text-[14.5px]">{formatPrice(item.price, currency)}</span>
                            {discountInfo.originalPrice && (
                              <span className="text-[11px] text-gray-400 line-through font-medium">
                                {formatPrice(discountInfo.originalPrice, currency)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900 text-[14.5px]">{formatPrice(effectivePrice, currency)}</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <td className="py-3.5 pr-6 pl-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-xl border border-[#F3F0E6] text-gray-600 hover:text-[#D97706] hover:border-amber-300 hover:bg-[#FEF9EE] transition shadow-sm cursor-pointer"
                            title="Edit item"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 rounded-xl border border-[#F3F0E6] text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition shadow-sm cursor-pointer"
                            title="Delete item permanently"
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

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#F3F0E6] bg-[#FAF9F5]/40">
            <p className="text-[13px] text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-700">{displayItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
              <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, displayItems.length)}</span> of{' '}
              <span className="font-bold text-gray-700">{displayItems.length}</span> items
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-[#F3F0E6] text-gray-500 hover:bg-[#FEF9EE] hover:text-[#D97706] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[34px] h-[34px] px-2 rounded-xl text-[13px] font-bold transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#FEF9EE] text-[#D97706] border border-amber-300 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-[#F3F0E6] text-gray-500 hover:bg-[#FEF9EE] hover:text-[#D97706] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {displayItems.map((item: any) => {
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
                className="bg-white rounded-[20px] border border-[#F3F0E6] shadow-sm hover:shadow-xl transition-shadow duration-200 flex flex-col overflow-hidden group"
              >
                <div className="relative aspect-[4/3] bg-gray-50 flex-shrink-0 overflow-hidden">
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
                      <ImageIcon size={32} className="opacity-30 mb-2" />
                    </div>
                  )}
                  {discountInfo.isActive && discountInfo.percentage ? (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 z-10">
                      <span>-{discountInfo.percentage}% OFF</span>
                    </div>
                  ) : item.badge && BADGE_DEFINITIONS[item.badge as MenuItemBadge] ? (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 z-10">
                      <span>{BADGE_DEFINITIONS[item.badge as MenuItemBadge].icon}</span>
                      <span>{BADGE_DEFINITIONS[item.badge as MenuItemBadge].label}</span>
                    </div>
                  ) : null}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                    <p className="text-[13px] font-medium text-gray-400 mb-2">{item.categoryName}</p>

                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.map((t: string) => {
                          const def = TAG_DEFINITIONS[t as MenuItemTag];
                          if (!def) return null;
                          return (
                            <span
                              key={t}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#FAF9F5] border border-[#F3F0E6] text-gray-700 rounded-md text-[10px] font-medium"
                            >
                              <span>{def.icon}</span>
                              <span>{def.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    {discountInfo.isActive ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-amber-600 text-lg">{formatPrice(item.price, currency)}</span>
                        {discountInfo.originalPrice && (
                          <span className="text-xs text-gray-400 line-through font-semibold">
                            {formatPrice(discountInfo.originalPrice, currency)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-black text-gray-900 text-lg">{formatPrice(effectivePrice, currency)}</span>
                    )}

                    {item.isVisible === false ? (
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-md">
                        Hidden
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#FEF9EE] text-[#D97706] border border-amber-200/60 rounded-md">
                        Available
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#F3F0E6] hover:border-amber-400 hover:bg-[#FEF9EE]/50 hover:text-[#D97706] text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit3 size={16} className="text-gray-400" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="w-10 flex items-center justify-center border border-[#F3F0E6] hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                      title="Delete item permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
