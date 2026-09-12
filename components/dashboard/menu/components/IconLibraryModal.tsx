'use client';

import { useState, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Search,
  Sparkles,
  Palette,
  Layers,
  Star,
  Plus,
  Check,
  FolderPlus,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Trash2,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Pipette,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FLUENT_FOOD_EMOJIS,
  getFluentEmojiUrl,
  type FluentFoodEmoji,
} from '@/lib/constants/fluent-food-emojis';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (icon: string) => void;
  currentIcon?: string;
}

type LibraryStyle = '3d' | 'color' | 'flat' | 'line';

interface CustomLibrary {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  icons: string[];
  createdAt: number;
}

const FOOD_CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '🍽️' },
  { id: 'fast_food', label: 'Fast Food', icon: '🍔' },
  { id: 'pizza_pasta', label: 'Pizza & Pasta', icon: '🍕' },
  { id: 'drinks', label: 'Cafe & Drinks', icon: '☕' },
  { id: 'desserts', label: 'Desserts & Sweets', icon: '🍰' },
  { id: 'grills', label: 'Grills & Steaks', icon: '🥩' },
  { id: 'salads', label: 'Healthy & Salads', icon: '🥗' },
  { id: 'seafood', label: 'Asian & Seafood', icon: '🍣' },
  { id: 'breakfast', label: 'Breakfast & Bakery', icon: '🥐' },
  { id: 'fruits_veggies', label: 'Fruits & Veggies', icon: '🍓' },
];

const BRAND_PALETTE = [
  { name: 'Warm Amber', hex: '#F59E0B' },
  { name: 'Deep Gold', hex: '#D97706' },
  { name: 'Burgundy Crimson', hex: '#991B1B' },
  { name: 'Ruby Red', hex: '#EF4444' },
  { name: 'Forest Emerald', hex: '#059669' },
  { name: 'Royal Navy', hex: '#1E3A8A' },
  { name: 'Purple Violet', hex: '#7C3AED' },
  { name: 'Onyx Charcoal', hex: '#18181B' },
];

export default function IconLibraryModal({ isOpen, onClose, onSelectIcon, currentIcon }: Props) {
  const [currentView, setCurrentView] = useState<'directory' | 'fluent_details' | 'favorites_details' | 'custom_library_details'>('directory');
  const [activeCustomLibrary, setActiveCustomLibrary] = useState<CustomLibrary | null>(null);

  // Custom User Libraries
  const [customLibraries, setCustomLibraries] = useState<CustomLibrary[]>([]);

  // Pinned Items
  const [pinnedIcons, setPinnedIcons] = useState<string[]>(['🍔', '🍕', '🍰', '☕', '🍣', '🥩']);

  // Create Library Form Modal State
  const [isCreatingLibrary, setIsCreatingLibrary] = useState(false);
  const [newLibName, setNewLibName] = useState('');
  const [newLibDesc, setNewLibDesc] = useState('');

  // Inside Fluent Library Options
  const [activeStyle, setActiveStyle] = useState<LibraryStyle>('3d');
  const [activeColor, setActiveColor] = useState('#F59E0B');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // File upload ref for custom libraries
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectIcon = (icon: string) => {
    onSelectIcon(icon);
    onClose();
  };

  const handleOpenFavorites = () => {
    setCurrentView('favorites_details');
  };

  const handleBackToDirectory = () => {
    setCurrentView('directory');
  };

  const handleCreateNewLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibName.trim()) return;

    const newLib: CustomLibrary = {
      id: `custom_lib_${Date.now()}`,
      name: newLibName.trim(),
      description: newLibDesc.trim() || 'Custom collection for uploaded icons',
      isCustom: true,
      icons: [],
      createdAt: Date.now(),
    };

    setCustomLibraries((prev) => [newLib, ...prev]);
    setNewLibName('');
    setNewLibDesc('');
    setIsCreatingLibrary(false);
    setActiveCustomLibrary(newLib);
    setCurrentView('custom_library_details');
  };

  const handleUploadCustomIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activeCustomLibrary) {
      const files = Array.from(e.target.files);
      const newUrls = files.map((f) => URL.createObjectURL(f));

      setCustomLibraries((prev) =>
        prev.map((lib) =>
          lib.id === activeCustomLibrary.id
            ? { ...lib, icons: [...newUrls, ...lib.icons] }
            : lib
        )
      );

      setActiveCustomLibrary((prev) =>
        prev ? { ...prev, icons: [...newUrls, ...prev.icons] } : null
      );
    }
  };

  const togglePin = (icon: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIcons((prev) =>
      prev.includes(icon) ? prev.filter((i) => i !== icon) : [...prev, icon]
    );
  };

  const filteredFluentIcons = FLUENT_FOOD_EMOJIS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameAr.includes(searchQuery) ||
      item.emoji.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 md:p-8">
        {/* Dark Frosted Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.3)] border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden z-10 font-sans"
        >
          {/* ========================================================================= */}
          {/* CLOSE BUTTON (TOP RIGHT)                                                  */}
          {/* ========================================================================= */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer z-20"
            title="Close"
          >
            <X size={18} />
          </button>

          {/* ========================================================================= */}
          {/* BODY CONTENT                                                              */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin space-y-6">
            {/* ======================================================================= */}
            {/* VIEW 1: DIRECTORY (MICROSOFT FLUENT FOOD + FAVORITES & CUSTOM)          */}
            {/* ======================================================================= */}
            {currentView === 'directory' && (
              <div className="space-y-6">
                {/* TOP ROW: FAVORITES & CREATE LIBRARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD 1: Favorites */}
                  <div
                    onClick={handleOpenFavorites}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100/90 shadow-xs hover:shadow-md hover:border-amber-200 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Star size={22} className="fill-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                          Favorites
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          View your pinned icons in one place ({pinnedIcons.length} icons)
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* CARD 2: Create Library */}
                  <div
                    onClick={() => setIsCreatingLibrary(true)}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100/90 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Plus size={22} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          Create Library
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Build and organize your own icon collection
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* AVAILABLE COLLECTIONS HEADER */}
                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    Available Collections (المكتبات المتاحة)
                  </h3>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                    Official Pack Loaded
                  </span>
                </div>

                {/* AVAILABLE COLLECTIONS GRID (MICROSOFT FLUENT FOOD + USER CUSTOM LIBRARIES) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* CARD: Microsoft Fluent Food Icons (Real Active Pack) */}
                  <div
                    onClick={() => setCurrentView('fluent_details')}
                    className="p-5 rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF9F5] to-[#FEF8EC] border-2 border-amber-500/40 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[220px]"
                  >
                    {/* Top Header with Logo & Bookmark */}
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                          <span className="bg-[#F25022] rounded-xs" />
                          <span className="bg-[#7FBA00] rounded-xs" />
                          <span className="bg-[#00A4EF] rounded-xs" />
                          <span className="bg-[#FFB900] rounded-xs" />
                        </div>
                        <Bookmark size={16} className="fill-amber-500 text-amber-500" />
                      </div>

                      <span className="text-[11px] text-gray-400 font-medium block leading-tight">
                        Microsoft
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-gray-900 group-hover:text-amber-600 transition-colors leading-tight mt-0.5">
                        Fluent Food Emojis
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {FLUENT_FOOD_EMOJIS.length}+ Food Icons • 4 Styles
                      </p>
                    </div>

                    {/* Icon Preview Strip (Loaded with real 3D assets) */}
                    <div className="space-y-3 pt-3 mt-2 border-t border-amber-200/60">
                      <div className="flex items-center justify-between px-1">
                        {FLUENT_FOOD_EMOJIS.slice(0, 5).map((item) => (
                          <img
                            key={item.id}
                            src={getFluentEmojiUrl(item, '3d')}
                            alt={item.name}
                            className="w-7 h-7 object-contain drop-shadow-2xs group-hover:scale-110 transition-transform"
                            onError={(e) => {
                              // Fallback to emoji if CDN fails
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>

                      {/* Bottom Open Link */}
                      <div className="flex items-center justify-between text-xs font-bold text-amber-700 group-hover:text-amber-800">
                        <span>Open Library (فتح الحزمة)</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* USER CUSTOM LIBRARIES (IF CREATED) */}
                  {customLibraries.map((lib) => (
                    <div
                      key={lib.id}
                      onClick={() => {
                        setActiveCustomLibrary(lib);
                        setCurrentView('custom_library_details');
                      }}
                      className="p-5 rounded-3xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[220px]"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                            📁
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            Custom
                          </span>
                        </div>

                        <span className="text-[11px] text-blue-500 font-bold block leading-tight">
                          Custom Collection
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mt-0.5">
                          {lib.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {lib.icons.length} Uploaded Icons
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 mt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 px-1 min-h-[28px]">
                          {lib.icons.length > 0 ? (
                            lib.icons.slice(0, 4).map((ic, i) => (
                              <span key={i} className="text-base">
                                {ic.startsWith('blob:') || ic.startsWith('http') ? (
                                  <img src={ic} alt="icon" className="w-6 h-6 object-contain inline" />
                                ) : (
                                  ic
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-gray-400">Empty Collection</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                          <span>Open Collection</span>
                          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================================= */}
            {/* VIEW 2: INSIDE MICROSOFT FLUENT FOOD (WITH 4 REAL STYLES & ASSETS)      */}
            {/* ======================================================================= */}
            {currentView === 'fluent_details' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackToDirectory}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-gray-900">
                        🌟 Microsoft Fluent Food Emojis
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {FLUENT_FOOD_EMOJIS.length} Food Icons
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      اختر النمط المناسب واضغط على أيقونة الأكلة لتعيينها فوراً للقسم
                    </p>
                  </div>
                </div>

                {/* The 4 Styles Switcher */}
                <div className="p-3.5 rounded-2xl bg-gray-900 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" />
                      Render Style (نمط العرض):
                    </span>
                    <span className="text-amber-400">{activeStyle.toUpperCase()} STYLE</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStyle('3d')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                        activeStyle === '3d'
                          ? 'border-amber-400 bg-amber-500/20 text-white ring-1 ring-amber-400'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>✨ 3D Glossy</span>
                      {activeStyle === '3d' && <Check size={14} className="text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStyle('color')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                        activeStyle === 'color'
                          ? 'border-amber-400 bg-amber-500/20 text-white ring-1 ring-amber-400'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>🌈 Color Vector</span>
                      {activeStyle === 'color' && <Check size={14} className="text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStyle('flat')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                        activeStyle === 'flat'
                          ? 'border-amber-400 bg-amber-500/20 text-white ring-1 ring-amber-400'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>⚡ Flat Clean</span>
                      {activeStyle === 'flat' && <Check size={14} className="text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStyle('line')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                        activeStyle === 'line'
                          ? 'border-amber-400 bg-amber-500/20 text-white ring-1 ring-amber-400'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span>✒️ Line Art</span>
                      {activeStyle === 'line' && <Check size={14} className="text-amber-400" />}
                    </button>
                  </div>
                </div>

                {/* Color Tint Palette & Custom HEX Picker for Line Art */}
                {activeStyle === 'line' && (
                  <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#FFFDF9] via-[#FEFBF4] to-[#FEF8EC] border-2 border-amber-300/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 shadow-2xs">
                    {/* Title & Active Color Dot */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl shadow-xs border border-white flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: activeColor }}
                      >
                        <Palette size={15} className="text-white drop-shadow-xs" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block leading-tight">
                          Brand Tint Color (تخصيص لون هوية المطعم):
                        </span>
                        <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                          اختر لوناً سريعاً، أو من جدول الألوان، أو اكتب كود الـ HEX
                        </span>
                      </div>
                    </div>

                    {/* Quick Swatches + Native Color Picker + Direct HEX Input */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                      {/* Preset Swatches */}
                      <div className="flex items-center gap-1.5 bg-white/90 p-1 rounded-xl border border-amber-200/70 shadow-2xs">
                        {BRAND_PALETTE.map((color) => (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() => setActiveColor(color.hex)}
                            className={`w-6 h-6 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                              activeColor.toLowerCase() === color.hex.toLowerCase()
                                ? 'scale-110 ring-2 ring-amber-500 ring-offset-1 shadow-xs z-10'
                                : 'opacity-85 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          >
                            {activeColor.toLowerCase() === color.hex.toLowerCase() && (
                              <Check size={11} className="text-white drop-shadow-xs" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Custom Color Wheel / Native Picker Trigger */}
                      <div className="relative group" title="فتح جدول الألوان (Color Picker)">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-400 to-indigo-500 p-0.5 shadow-xs cursor-pointer hover:scale-105 transition-transform flex items-center justify-center">
                          <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center hover:bg-transparent transition-colors group-hover:text-white text-gray-700">
                            <Pipette size={14} className="group-hover:text-white" />
                          </div>
                        </div>
                        <input
                          type="color"
                          value={/^#[0-9A-Fa-f]{6}$/.test(activeColor) ? activeColor : '#F59E0B'}
                          onChange={(e) => setActiveColor(e.target.value.toUpperCase())}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                      </div>

                      {/* Direct HEX Input Field */}
                      <div className="flex items-center bg-white border border-gray-200 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-xl px-2.5 py-1 shadow-2xs transition-all">
                        <span className="text-xs font-bold text-gray-400 select-none mr-1">#</span>
                        <input
                          type="text"
                          maxLength={6}
                          value={activeColor.replace('#', '')}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                            setActiveColor('#' + clean);
                          }}
                          placeholder="F59E0B"
                          className="w-16 text-xs font-mono font-bold text-gray-800 uppercase focus:outline-none"
                          title="Enter HEX Color (e.g. F59E0B)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Search & Food Categories */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن أكلة (برجر، بيتزا، قهوة، ستيك، حلويات، شاورما)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {FOOD_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                          activeCategory === cat.id
                            ? 'bg-gray-900 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real Microsoft Fluent Icons Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 p-4 bg-[#FAF9F5] border border-gray-200 rounded-3xl max-h-[340px] overflow-y-auto scrollbar-thin">
                  {filteredFluentIcons.map((item) => {
                    const iconUrl = getFluentEmojiUrl(item, activeStyle);
                    const isSelected = currentIcon === item.emoji || currentIcon === iconUrl || (currentIcon?.includes(item.fileBase) ?? false);
                    const isPinned = pinnedIcons.includes(item.emoji);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectIcon(iconUrl)}
                        className={`aspect-square rounded-2xl bg-white border transition-all duration-200 flex flex-col items-center justify-center p-2 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative group select-none ${
                          isSelected
                            ? 'border-2 border-amber-500 bg-amber-50/40 shadow-md ring-4 ring-amber-500/15'
                            : 'border-gray-200/90 hover:border-amber-400'
                        }`}
                      >
                        {/* Real Fluent Asset: CSS Mask for Line Art, img for 3D/Color/Flat */}
                        {activeStyle === 'line' ? (
                          <div
                            className="w-10 h-10 group-hover:scale-115 transition-transform shrink-0"
                            style={{
                              backgroundColor: activeColor,
                              WebkitMaskImage: `url("${iconUrl}")`,
                              WebkitMaskSize: 'contain',
                              WebkitMaskRepeat: 'no-repeat',
                              WebkitMaskPosition: 'center',
                              maskImage: `url("${iconUrl}")`,
                              maskSize: 'contain',
                              maskRepeat: 'no-repeat',
                              maskPosition: 'center',
                            }}
                          />
                        ) : (
                          <img
                            src={iconUrl}
                            alt={item.name}
                            className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-115 transition-transform"
                            onError={(e) => {
                              // Fallback to emoji glyph
                              (e.target as HTMLElement).style.display = 'none';
                              const fallbackSpan = (e.target as HTMLElement).nextElementSibling;
                              if (fallbackSpan) (fallbackSpan as HTMLElement).style.display = 'block';
                            }}
                          />
                        )}
                        <span className="hidden text-3xl">{item.emoji}</span>

                        <span className="text-[10px] font-semibold text-gray-600 mt-1 line-clamp-1 text-center group-hover:text-gray-900">
                          {item.nameAr || item.name}
                        </span>

                        {/* Star to Pin */}
                        <button
                          type="button"
                          onClick={(e) => togglePin(item.emoji, e)}
                          className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-all ${
                            isPinned
                              ? 'opacity-100 text-amber-500 bg-amber-50'
                              : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          title={isPinned ? 'Unpin' : 'Pin to Favorites'}
                        >
                          <Star size={11} className={isPinned ? 'fill-amber-500' : ''} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======================================================================= */}
            {/* VIEW 3: FAVORITES VIEW                                                  */}
            {/* ======================================================================= */}
            {currentView === 'favorites_details' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackToDirectory}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:text-gray-900 transition shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <h3 className="text-base font-bold text-gray-900">⭐ Favorites ({pinnedIcons.length})</h3>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl min-h-[200px]">
                  {pinnedIcons.map((char, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectIcon(char)}
                      className="aspect-square rounded-2xl bg-white border border-gray-200 hover:border-amber-500 transition flex flex-col items-center justify-center p-2 cursor-pointer relative group"
                    >
                      <span className="text-3xl">{char}</span>
                      <button
                        type="button"
                        onClick={(e) => togglePin(char, e)}
                        className="absolute top-1.5 right-1.5 p-1 text-amber-500 hover:bg-red-50 hover:text-red-500 rounded-md transition"
                        title="Unpin"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================================= */}
            {/* VIEW 4: CUSTOM LIBRARY WITH UPLOAD                                      */}
            {/* ======================================================================= */}
            {currentView === 'custom_library_details' && activeCustomLibrary && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackToDirectory}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:text-gray-900 transition shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">📁 {activeCustomLibrary.name}</h3>
                    <p className="text-xs text-gray-400">{activeCustomLibrary.icons.length} Uploaded Icons</p>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/30 hover:bg-blue-50/60 transition text-center cursor-pointer"
                >
                  <Upload size={20} className="text-blue-500 mx-auto mb-1.5" />
                  <h4 className="text-xs font-bold text-gray-900">Upload Icons to this collection</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Select SVG or PNG from your computer</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadCustomIcon}
                    accept="image/*,.svg"
                    multiple
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl min-h-[160px]">
                  {activeCustomLibrary.icons.map((ic, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectIcon(ic)}
                      className="aspect-square rounded-2xl bg-white border border-gray-200 hover:border-blue-500 transition flex items-center justify-center p-2 cursor-pointer"
                    >
                      {ic.startsWith('blob:') ? (
                        <img src={ic} alt="icon" className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-2xl">{ic}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CREATE NEW LIBRARY MODAL PROMPT                                           */}
          {/* ========================================================================= */}
          {isCreatingLibrary && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">Create Library</h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingLibrary(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateNewLibrary} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Library Name *</label>
                    <input
                      type="text"
                      required
                      value={newLibName}
                      onChange={(e) => setNewLibName(e.target.value)}
                      placeholder="e.g. Burger & Drinks Icons..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingLibrary(false)}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      Create & Upload
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FOOTER BAR                                                                */}
          {/* ========================================================================= */}
          <div className="p-4 px-6 sm:px-8 border-t border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
            {/* Left Status Badge */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-900 leading-tight">
                  {FLUENT_FOOD_EMOJIS.length}+ Microsoft Fluent Food Icons Loaded
                </h5>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">3D Render • Color • Flat • Line</p>
              </div>
            </div>

            {/* Right Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
