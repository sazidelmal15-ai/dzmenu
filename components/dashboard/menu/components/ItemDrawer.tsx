'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Plus, GripVertical, Image as ImageIcon, Sparkles, Tag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import {
  type MenuItemBadge,
  type MenuItemTag,
  MENU_ITEM_BADGES,
  MENU_ITEM_TAGS,
  BADGE_DEFINITIONS,
  TAG_DEFINITIONS,
} from '@/types/menu';

interface Category {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: any;
  onSaved: () => void;
  currency?: string;
}

import { processAndConvertToWebP, MAX_FILE_SIZE_BYTES } from '@/lib/utils/image-optimizer';
import { getCurrencySymbol } from '@/lib/utils/currency';

export default function ItemDrawer({ isOpen, onClose, categories, initialData, onSaved, currency = 'DZD' }: Props) {
  const currencySymbol = getCurrencySymbol(currency);
  const [saving, setSaving] = useState(false);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [imageOptimizationInfo, setImageOptimizationInfo] = useState<{ originalSize: number; optimizedSize: number } | null>(null);
  const [error, setError] = useState('');

  // Basic Info
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  
  // Badges & Dietary Tags
  const [badge, setBadge] = useState<MenuItemBadge | null>(null);
  const [tags, setTags] = useState<MenuItemTag[]>([]);

  // Image handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sections
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants] = useState<{ id?: string, name: string, price: string, isDefault: boolean }[]>([]);

  const [sizesEnabled, setSizesEnabled] = useState(false);
  const [sizes, setSizes] = useState<{ id?: string, name: string, price: string }[]>([]);

  const [extras, setExtras] = useState<{ id?: string, name: string, price: string }[]>([]);

  // Visibility Settings
  const [isVisible, setIsVisible] = useState(true);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('blob:')) return url;
    // Use relative path so Next.js proxy rewrites it to backend
    if (url.startsWith('/uploads/')) return url;
    if (url.startsWith('http')) return url;
    return url;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCategoryId(initialData.categoryId || '');
        setPrice(initialData.price !== undefined ? initialData.price.toString() : '');
        setDescription(initialData.description || '');
        setIsVisible(initialData.isVisible !== undefined ? Boolean(initialData.isVisible) : (initialData.isAvailable !== undefined ? Boolean(initialData.isAvailable) : true));
        setImageOptimizationInfo(null);
        
        if (initialData.images && initialData.images.length > 0) {
          setImagePreview(getImageUrl(initialData.images[0].url));
        } else if (initialData.imageUrl) {
          setImagePreview(getImageUrl(initialData.imageUrl));
        } else {
          setImagePreview('');
        }
        
        setImageFile(null);

        // Parse modifier groups or direct arrays into UI sections
        let foundVariants = false;
        let foundSizes = false;
        
        const v: any[] = [];
        const s: any[] = [];
        const e: any[] = [];

        if (initialData.variants && initialData.variants.length > 0) {
          foundVariants = true;
          initialData.variants.forEach((item: any) => {
            v.push({ name: item.name, price: item.price ? item.price.toString() : '', isDefault: Boolean(item.isDefault) });
          });
        }

        if (initialData.sizes && initialData.sizes.length > 0) {
          foundSizes = true;
          initialData.sizes.forEach((item: any) => {
            s.push({ name: item.name, price: item.price ? item.price.toString() : '' });
          });
        }

        if (initialData.extras && initialData.extras.length > 0) {
          initialData.extras.forEach((item: any) => {
            e.push({ name: item.name, price: item.price ? item.price.toString() : '' });
          });
        }

        if (initialData.modifierGroups && v.length === 0 && s.length === 0 && e.length === 0) {
          initialData.modifierGroups.forEach((g: any) => {
            if (g.name === 'Variants (Flavors)') {
              foundVariants = true;
              g.modifiers.forEach((m: any) => v.push({ id: m.id, name: m.name, price: m.priceModifier?.toString() || '', isDefault: false }));
            } else if (g.name === 'Sizes') {
              foundSizes = true;
              g.modifiers.forEach((m: any) => s.push({ id: m.id, name: m.name, price: m.priceModifier?.toString() || '' }));
            } else if (g.name === 'Extras / Add-ons') {
              g.modifiers.forEach((m: any) => e.push({ id: m.id, name: m.name, price: m.priceModifier?.toString() || '' }));
            }
          });
        }

        setBadge(initialData.badge || null);
        setTags(Array.isArray(initialData.tags) ? initialData.tags : []);

        setVariantsEnabled(foundVariants);
        setSizesEnabled(foundSizes);
        setVariants(v as any);
        setSizes(s as any);
        setExtras(e as any);

      } else {
        setName('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setPrice('');
        setDescription('');
        setBadge(null);
        setTags([]);
        setImagePreview('');
        setImageFile(null);
        setImageOptimizationInfo(null);
        setVariantsEnabled(false);
        setSizesEnabled(false);
        setVariants([{ name: 'Vanilla', price: '', isDefault: true }]);
        setSizes([{ name: 'Small', price: '' }]);
        setExtras([]);
        setIsVisible(true);
      }
      setError('');
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const toggleTag = (tag: MenuItemTag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setOptimizingImage(true);
        setError('');
        const optimized = await processAndConvertToWebP(file);
        setImageFile(optimized.file);
        setImagePreview(optimized.previewUrl);
        setImageOptimizationInfo({
          originalSize: optimized.originalSize,
          optimizedSize: optimized.optimizedSize,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to process image');
      } finally {
        setOptimizingImage(false);
      }
    }
  };

  // Enforce integer-only, non-negative price input
  const sanitizePrice = (val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) return '';
    return String(n);
  };

  const buildModifierGroups = () => {
    const groups = [];
    if (variantsEnabled && variants.length > 0) {
      groups.push({
        name: 'Variants (Flavors)',
        selectionType: 'SINGLE',
        minSelections: 1,
        maxSelections: 1,
        displayOrder: 0,
        modifiers: variants.map((v, i) => ({ name: v.name, priceModifier: parseInt(v.price, 10) || 0, displayOrder: i }))
      });
    }
    if (sizesEnabled && sizes.length > 0) {
      groups.push({
        name: 'Sizes',
        selectionType: 'SINGLE',
        minSelections: 1,
        maxSelections: 1,
        displayOrder: 1,
        modifiers: sizes.map((s, i) => ({ name: s.name, priceModifier: parseInt(s.price, 10) || 0, displayOrder: i }))
      });
    }
    if (extras.length > 0) {
      groups.push({
        name: 'Extras / Add-ons',
        selectionType: 'MULTI',
        minSelections: 0,
        maxSelections: extras.length,
        displayOrder: 2,
        modifiers: extras.map((ex, i) => ({ name: ex.name, priceModifier: parseInt(ex.price, 10) || 0, displayOrder: i }))
      });
    }
    return groups;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      if (!name || !price || !categoryId) {
        throw new Error('Name, Price, and Category are required.');
      }

      const parsedPrice = parseInt(price, 10);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new Error('Price must be a valid positive number.');
      }

      // 1. Upload image first (if a new file was selected)
      let finalImageUrl = initialData?.imageUrl || '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'items');

        const uploadRes = await fetch('/api/menu/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadErr.message || 'Failed to upload image');
        }

        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.data?.url || '';
      }

      // 2. Build payload including imageUrl, badge, tags
      const payload = {
        name,
        description,
        price: parsedPrice,
        categoryId,
        imageUrl: finalImageUrl,
        badge: badge || null,
        tags,
        isVisible,
        isAvailable: isVisible,
        isFeatured: Boolean(badge !== null),
        variants: variantsEnabled ? variants.filter(v => v.name.trim()) : [],
        sizes: sizesEnabled ? sizes.filter(s => s.name.trim()) : [],
        extras: extras.filter(e => e.name.trim()),
        modifierGroups: buildModifierGroups(),
      };

      // 3. Save item (create or update)
      let itemId = initialData?.id;
      if (itemId) {
        await apiFetch(`/menu/items/${itemId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const data = await apiFetch(`/menu/items`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        itemId = data.id;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
      />
      
      <motion.div
        initial={{ x: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0)' }}
        animate={{ x: 0, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
        exit={{ x: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] lg:w-[560px] bg-white z-50 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Fill in the details to {initialData ? 'update' : 'add a new'} menu item</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {error}
            </div>
          )}

          {/* Section: Basic Info */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-5">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="col-span-2 sm:col-span-1 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Item Name <span className="text-red-500">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-400" placeholder="Vanilla Ice Cream" />
                </div>
                
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{currencySymbol}</span>
                    <input type="number" step="1" min="0" value={price} onChange={e => setPrice(sanitizePrice(e.target.value))} onKeyDown={e => ['.',',','-','e','E','+'].includes(e.key) && e.preventDefault()} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" placeholder="500" />
                  </div>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-semibold text-gray-700">Image <span className="text-red-500">*</span></label>
                  <span className="text-[11px] font-medium text-amber-700/70">Max 5MB • WebP</span>
                </div>
                <div 
                  onClick={() => !optimizingImage && fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] bg-[#FAF9F5] border border-[#F3F0E6] border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#FEF9EE]/40 transition-colors overflow-hidden group relative"
                >
                  {optimizingImage ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-amber-700">Compressing & converting image to WebP...</span>
                    </div>
                  ) : imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-xs font-semibold text-gray-500">Upload Image</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</span>
                    </>
                  )}
                </div>

                {imageOptimizationInfo && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                    <span className="font-semibold">⚡ Compressed to WebP</span>
                    <span className="font-bold">
                      {(imageOptimizationInfo.optimizedSize / 1024).toFixed(0)} KB (Saved {Math.round((1 - imageOptimizationInfo.optimizedSize / imageOptimizationInfo.originalSize) * 100)}%)
                    </span>
                  </div>
                )}

                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none placeholder:text-gray-400" placeholder="Premium vanilla ice cream made with real vanilla beans." />
            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Section: Promotional Badge & Dietary Tags */}
          <div className="mb-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Promotional Badge</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3.5">Select a promotional badge to highlight this dish on your menu</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBadge(null)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                    badge === null
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm ring-1 ring-amber-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>None</span>
                  {badge === null && <Check size={14} className="text-amber-600 shrink-0" />}
                </button>

                {MENU_ITEM_BADGES.map((b) => {
                  const def = BADGE_DEFINITIONS[b];
                  const isSelected = badge === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBadge(b)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-amber-300 hover:bg-amber-50/40'
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

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Tag size={16} className="text-emerald-500" />
                <h3 className="text-base font-bold text-gray-900">Dietary & Attributes</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3.5">Select all dietary and characteristic tags that apply (multi-select)</p>

              <div className="flex flex-wrap gap-2">
                {MENU_ITEM_TAGS.map((t) => {
                  const def = TAG_DEFINITIONS[t];
                  const isSelected = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span>{def.icon}</span>
                      <span>{def.label}</span>
                      {isSelected && <Check size={13} className="text-white ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Section: Variants */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Variants (Flavors)</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={variantsEnabled} onChange={e => setVariantsEnabled(e.target.checked)} />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            
            {variantsEnabled && (
              <div className="space-y-3">
                <div className="flex gap-4 px-1">
                  <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Flavor</div>
                  <div className="w-24 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</div>
                  <div className="w-8"></div>
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <div className="flex-1 relative">
                      <input type="text" value={v.name} onChange={e => { const n = [...variants]; n[i].name = e.target.value; setVariants(n); }} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="Flavor name" />
                      {v.isDefault && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase border border-amber-200/50">Default</span>}
                    </div>
                    <div className="w-24 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{currencySymbol}</span>
                      <input type="number" step="1" min="0" value={v.price} onChange={e => { const n = [...variants]; n[i].price = sanitizePrice(e.target.value); setVariants(n); }} onKeyDown={e => ['.',',','-','e','E','+'].includes(e.key) && e.preventDefault()} className="w-full pl-9 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="500" />
                    </div>
                    <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setVariants([...variants, { name: '', price: '', isDefault: false }])} className="text-[13px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2 cursor-pointer">
                  <Plus size={14} /> Add Flavor
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Section: Sizes (SKU removed) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Sizes</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={sizesEnabled} onChange={e => setSizesEnabled(e.target.checked)} />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {sizesEnabled && (
              <div className="space-y-3">
                <div className="flex gap-4 px-1">
                  <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</div>
                  <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</div>
                  <div className="w-8"></div>
                </div>
                {sizes.map((s, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <input type="text" value={s.name} onChange={e => { const n = [...sizes]; n[i].name = e.target.value; setSizes(n); }} className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="Small / Regular / Large" />
                    <div className="w-28 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{currencySymbol}</span>
                      <input type="number" step="1" min="0" value={s.price} onChange={e => { const n = [...sizes]; n[i].price = sanitizePrice(e.target.value); setSizes(n); }} onKeyDown={e => ['.',',','-','e','E','+'].includes(e.key) && e.preventDefault()} className="w-full pl-9 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="500" />
                    </div>
                    <button onClick={() => setSizes(sizes.filter((_, idx) => idx !== i))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setSizes([...sizes, { name: '', price: '' }])} className="text-[13px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2 cursor-pointer">
                  <Plus size={14} /> Add Size
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Section: Extras / Add-ons */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Extras / Add-ons</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-4 px-1">
                <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Extra Name</div>
                <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Price</div>
                <div className="w-8"></div>
              </div>
              {extras.map((ex, i) => (
                <div key={i} className="flex gap-4 items-center group">
                  <input type="text" value={ex.name} onChange={e => { const n = [...extras]; n[i].name = e.target.value; setExtras(n); }} className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="Extra Cheese / Sauce" />
                  <div className="w-28 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+{currencySymbol}</span>
                    <input type="number" step="1" min="0" value={ex.price} onChange={e => { const n = [...extras]; n[i].price = sanitizePrice(e.target.value); setExtras(n); }} onKeyDown={e => ['.',',','-','e','E','+'].includes(e.key) && e.preventDefault()} className="w-full pl-10 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="100" />
                  </div>
                  <button onClick={() => setExtras(extras.filter((_, idx) => idx !== i))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => setExtras([...extras, { name: '', price: '' }])} className="text-[13px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2 cursor-pointer">
                <Plus size={14} /> Add Extra
              </button>
            </div>
          </div>

          <hr className="border-gray-100 my-8" />
          
          {/* Section: Visibility Settings */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-1">Visibility Settings</h3>
            <p className="text-xs text-gray-500 mb-4">Control whether this item is visible to customers in your menu</p>

            {/* Visible in Menu */}
            <div
              onClick={() => setIsVisible(!isVisible)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                isVisible ? 'bg-[#FAF9F5] border-amber-200/80 shadow-xs' : 'bg-gray-50/70 border-gray-200'
              }`}
            >
              <div
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                  isVisible ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    isVisible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {isVisible ? 'Visible in Menu' : 'Hidden from Menu'}
                </p>
                <p className="text-xs text-gray-500 leading-snug mt-0.5">
                  {isVisible
                    ? 'This item is visible to customers scanning the QR menu'
                    : 'This item is hidden from customers in the public menu'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white flex items-center justify-between">
          <button onClick={onClose} disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
            {saving ? 'Saving...' : <><Plus size={16} /> Save Item</>}
          </button>
        </div>
      </motion.div>
    </>
  );
}
