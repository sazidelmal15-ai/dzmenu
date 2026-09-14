'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Tag,
  Check,
  ChevronUp,
  ChevronDown,
  UtensilsCrossed,
  Calendar,
  Percent,
  Flame,
  Clock,
  AlertCircle,
  Timer,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import {
  type MenuItemBadge,
  type MenuItemTag,
  type MenuItemAvailability,
  MENU_ITEM_BADGES,
  MENU_ITEM_TAGS,
  BADGE_DEFINITIONS,
  TAG_DEFINITIONS,
} from '@/types/menu';
import {
  calculateDiscountState,
  calculateDiscountPercentage,
  calculateSavings,
  sanitizeIngredients,
  formatDateTimeLocal,
  parseDateTimeLocal,
  DEFAULT_RESTAURANT_TIMEZONE,
} from '@/lib/menu/discounts';
import { processAndConvertToWebP } from '@/lib/utils/image-optimizer';
import { getCurrencySymbol } from '@/lib/utils/currency';

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

// Format countdown duration into "01:42:07" or "02d 03h 21m 15s"
function formatCountdown(targetDate: Date, currentDate: Date): string {
  const diffMs = targetDate.getTime() - currentDate.getTime();
  if (diffMs <= 0) return '00:00:00';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Friendly localized date string in Algeria timezone
function formatFriendlyDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DEFAULT_RESTAURANT_TIMEZONE,
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function ItemDrawer({
  isOpen,
  onClose,
  categories,
  initialData,
  onSaved,
  currency = 'DZD',
}: Props) {
  const currencySymbol = getCurrencySymbol(currency);
  const [saving, setSaving] = useState(false);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [imageOptimizationInfo, setImageOptimizationInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
  } | null>(null);
  const [error, setError] = useState('');

  // Basic Information
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // Pricing & Promotion State
  const [regularPrice, setRegularPrice] = useState('');
  const [hasPromotion, setHasPromotion] = useState(false);
  const [promoPrice, setPromoPrice] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [discountStartsAt, setDiscountStartsAt] = useState('');
  const [discountEndsAt, setDiscountEndsAt] = useState('');

  // Live countdown ticker (updates every second)
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!isOpen || !hasPromotion) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, hasPromotion]);

  // Reorderable Ingredients
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredientInput, setNewIngredientInput] = useState('');

  // Badges & Dietary Tags
  const [badge, setBadge] = useState<MenuItemBadge | null>(null);
  const [tags, setTags] = useState<MenuItemTag[]>([]);

  // Image handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sections
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants] = useState<
    { id?: string; name: string; price: string; isDefault: boolean }[]
  >([]);

  const [sizesEnabled, setSizesEnabled] = useState(false);
  const [sizes, setSizes] = useState<{ id?: string; name: string; price: string }[]>([]);

  const [extras, setExtras] = useState<{ id?: string; name: string; price: string }[]>([]);

  // Availability Settings (Single Source of Truth)
  const [availability, setAvailability] = useState<MenuItemAvailability>('AVAILABLE');

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('/uploads/')) return url;
    if (url.startsWith('http')) return url;
    return url;
  };

  // Enforce integer-only, non-negative price input
  const sanitizePrice = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '';
    const n = parseInt(clean, 10);
    if (isNaN(n) || n < 0) return '';
    return String(n);
  };

  // Populate drawer on open / data change
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCategoryId(initialData.categoryId || (categories[0]?.id ?? ''));
        setDescription(initialData.description || '');
        
        let initialAvailability: MenuItemAvailability = 'AVAILABLE';
        if (
          initialData.availability === 'AVAILABLE' ||
          initialData.availability === 'SOLD_OUT' ||
          initialData.availability === 'HIDDEN'
        ) {
          initialAvailability = initialData.availability;
        } else if (initialData.isVisible === false || initialData.isAvailable === false) {
          initialAvailability = 'HIDDEN';
        }
        setAvailability(initialAvailability);
        setImageOptimizationInfo(null);

        // Price & Promotion Mapping:
        // If originalPrice exists and originalPrice > price, this item has a configured promotion.
        // The regular price is originalPrice, and promotional price is price.
        const storedPrice = Number(initialData.price) || 0;
        const storedOriginal =
          initialData.originalPrice !== undefined && initialData.originalPrice !== null
            ? Number(initialData.originalPrice)
            : null;

        if (storedOriginal !== null && storedOriginal > storedPrice) {
          setRegularPrice(String(storedOriginal));
          setPromoPrice(String(storedPrice));
          setHasPromotion(true);
        } else {
          setRegularPrice(storedPrice > 0 ? String(storedPrice) : '');
          setPromoPrice('');
          setHasPromotion(false);
        }

        const hasStarts = Boolean(initialData.discountStartsAt);
        const hasEnds = Boolean(initialData.discountEndsAt);
        setIsScheduled(hasStarts || hasEnds);
        setDiscountStartsAt(
          initialData.discountStartsAt ? formatDateTimeLocal(initialData.discountStartsAt) : ''
        );
        setDiscountEndsAt(
          initialData.discountEndsAt ? formatDateTimeLocal(initialData.discountEndsAt) : ''
        );

        setIngredients(Array.isArray(initialData.ingredients) ? initialData.ingredients : []);
        setNewIngredientInput('');

        if (initialData.images && initialData.images.length > 0) {
          setImagePreview(getImageUrl(initialData.images[0].url));
        } else if (initialData.imageUrl) {
          setImagePreview(getImageUrl(initialData.imageUrl));
        } else {
          setImagePreview('');
        }
        setImageFile(null);

        // Parse modifier groups or direct arrays
        let foundVariants = false;
        let foundSizes = false;
        const v: any[] = [];
        const s: any[] = [];
        const e: any[] = [];

        if (initialData.variants && initialData.variants.length > 0) {
          foundVariants = true;
          initialData.variants.forEach((item: any) => {
            v.push({
              name: item.name,
              price: item.price ? item.price.toString() : '',
              isDefault: Boolean(item.isDefault),
            });
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
              g.modifiers.forEach((m: any) =>
                v.push({
                  id: m.id,
                  name: m.name,
                  price: m.priceModifier?.toString() || '',
                  isDefault: false,
                })
              );
            } else if (g.name === 'Sizes') {
              foundSizes = true;
              g.modifiers.forEach((m: any) =>
                s.push({ id: m.id, name: m.name, price: m.priceModifier?.toString() || '' })
              );
            } else if (g.name === 'Extras / Add-ons') {
              g.modifiers.forEach((m: any) =>
                e.push({ id: m.id, name: m.name, price: m.priceModifier?.toString() || '' })
              );
            }
          });
        }

        setBadge(initialData.badge || null);
        setTags(Array.isArray(initialData.tags) ? initialData.tags : []);

        setVariantsEnabled(foundVariants);
        setSizesEnabled(foundSizes);
        setVariants(v);
        setSizes(s);
        setExtras(e);
      } else {
        // Create new item reset
        setName('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setRegularPrice('');
        setHasPromotion(false);
        setPromoPrice('');
        setIsScheduled(false);
        setDiscountStartsAt('');
        setDiscountEndsAt('');
        setIngredients([]);
        setNewIngredientInput('');
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
        setAvailability('AVAILABLE');
      }
      setError('');
    }
  }, [isOpen, initialData, categories]);

  // Derived promotion metrics using domain rules
  const parsedRegularPrice = parseInt(regularPrice, 10);
  const parsedPromoPrice = parseInt(promoPrice, 10);

  const isRegularPriceValid = !isNaN(parsedRegularPrice) && parsedRegularPrice > 0;
  const isPromoPriceEntered = !isNaN(parsedPromoPrice) && parsedPromoPrice > 0;
  const isPromoLower =
    isRegularPriceValid && isPromoPriceEntered && parsedPromoPrice < parsedRegularPrice;

  // Inline validation checks
  const priceValidationError = useMemo(() => {
    if (!hasPromotion) return null;
    if (!isRegularPriceValid) {
      return 'Please enter a valid regular price first.';
    }
    if (!isPromoPriceEntered) {
      return 'Please enter a promotional price.';
    }
    if (parsedPromoPrice >= parsedRegularPrice) {
      return `Promotional price must be strictly lower than regular price (${parsedRegularPrice.toLocaleString()} ${currencySymbol}).`;
    }
    return null;
  }, [hasPromotion, isRegularPriceValid, isPromoPriceEntered, parsedPromoPrice, parsedRegularPrice, currencySymbol]);

  const scheduleValidationError = useMemo(() => {
    if (!hasPromotion || !isScheduled) return null;
    if (discountStartsAt && discountEndsAt) {
      const startMs = new Date(discountStartsAt).getTime();
      const endMs = new Date(discountEndsAt).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && startMs >= endMs) {
        return 'Promotion end time must be after the start time.';
      }
    }
    return null;
  }, [hasPromotion, isScheduled, discountStartsAt, discountEndsAt]);

  const savingsAmount = isPromoLower ? calculateSavings(parsedPromoPrice, parsedRegularPrice) : null;
  const discountPct = isPromoLower
    ? calculateDiscountPercentage(parsedPromoPrice, parsedRegularPrice)
    : null;

  // Real-time derived state badge & countdown
  const startIso = isScheduled && discountStartsAt ? parseDateTimeLocal(discountStartsAt) : null;
  const endIso = isScheduled && discountEndsAt ? parseDateTimeLocal(discountEndsAt) : null;

  const derivedPromoState = useMemo(() => {
    if (!hasPromotion || !isPromoLower) return 'none';
    if (!isScheduled || (!startIso && !endIso)) return 'active';

    return calculateDiscountState({
      price: parsedPromoPrice,
      originalPrice: parsedRegularPrice,
      discountStartsAt: startIso,
      discountEndsAt: endIso,
      now,
    });
  }, [hasPromotion, isPromoLower, isScheduled, parsedPromoPrice, parsedRegularPrice, startIso, endIso, now]);

  // Countdown timer calculations
  const countdownDisplay = useMemo(() => {
    if (!hasPromotion || !isPromoLower) return null;

    if (derivedPromoState === 'scheduled' && startIso) {
      const target = new Date(startIso);
      return {
        label: 'Starts in',
        time: formatCountdown(target, now),
        targetText: formatFriendlyDate(startIso),
      };
    }

    if (derivedPromoState === 'active' && endIso) {
      const target = new Date(endIso);
      return {
        label: 'Ends in',
        time: formatCountdown(target, now),
        targetText: formatFriendlyDate(endIso),
      };
    }

    return null;
  }, [hasPromotion, isPromoLower, derivedPromoState, startIso, endIso, now]);

  // Quick Presets Handler
  const applyPreset = (presetKey: 'tonight' | 'tomorrow' | 'weekend' | '24h') => {
    const currentNow = new Date();

    const getLocalDateParts = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: DEFAULT_RESTAURANT_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(d);
      const getP = (t: string) => parts.find((p) => p.type === t)?.value || '';
      return {
        year: getP('year'),
        month: getP('month'),
        day: getP('day'),
        hour: getP('hour') === '24' ? '00' : getP('hour'),
        minute: getP('minute'),
      };
    };

    const today = getLocalDateParts(currentNow);

    if (presetKey === 'tonight') {
      const curH = parseInt(today.hour, 10);
      const startH = curH >= 18 ? today.hour : '18';
      const startM = curH >= 18 ? today.minute : '00';
      setDiscountStartsAt(`${today.year}-${today.month}-${today.day}T${startH}:${startM}`);
      setDiscountEndsAt(`${today.year}-${today.month}-${today.day}T23:59`);
    } else if (presetKey === 'tomorrow') {
      const tomorrowDate = new Date(currentNow.getTime() + 24 * 60 * 60 * 1000);
      const tom = getLocalDateParts(tomorrowDate);
      setDiscountStartsAt(`${tom.year}-${tom.month}-${tom.day}T12:00`);
      setDiscountEndsAt(`${tom.year}-${tom.month}-${tom.day}T23:59`);
    } else if (presetKey === 'weekend') {
      // In Algeria, weekend is Friday - Saturday
      const dayOfWeek = currentNow.getDay(); // 0 Sun, 5 Fri, 6 Sat
      let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      if (daysUntilFriday === 0 && parseInt(today.hour, 10) > 22) {
        daysUntilFriday = 7;
      }
      const fridayDate = new Date(currentNow.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
      const saturdayDate = new Date(fridayDate.getTime() + 24 * 60 * 60 * 1000);
      const fri = getLocalDateParts(fridayDate);
      const sat = getLocalDateParts(saturdayDate);
      setDiscountStartsAt(`${fri.year}-${fri.month}-${fri.day}T12:00`);
      setDiscountEndsAt(`${sat.year}-${sat.month}-${sat.day}T23:59`);
    } else if (presetKey === '24h') {
      const start = formatDateTimeLocal(currentNow);
      const end = formatDateTimeLocal(new Date(currentNow.getTime() + 24 * 60 * 60 * 1000));
      setDiscountStartsAt(start);
      setDiscountEndsAt(end);
    }
  };

  // Handle removing / disabling promotion
  const handleRemovePromotion = () => {
    setHasPromotion(false);
    setPromoPrice('');
    setIsScheduled(false);
    setDiscountStartsAt('');
    setDiscountEndsAt('');
  };

  // Ingredient Helpers
  const addIngredient = () => {
    const trimmed = newIngredientInput.trim();
    if (!trimmed) return;
    setIngredients((prev) => [...prev, trimmed]);
    setNewIngredientInput('');
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const moveIngredientUp = (index: number) => {
    if (index === 0) return;
    setIngredients((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveIngredientDown = (index: number) => {
    if (index === ingredients.length - 1) return;
    setIngredients((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const updateIngredient = (index: number, val: string) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const toggleTag = (tag: MenuItemTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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

  const buildModifierGroups = () => {
    const groups = [];
    if (variantsEnabled && variants.length > 0) {
      groups.push({
        name: 'Variants (Flavors)',
        selectionType: 'SINGLE',
        minSelections: 1,
        maxSelections: 1,
        displayOrder: 0,
        modifiers: variants.map((v, i) => ({
          name: v.name,
          priceModifier: parseInt(v.price, 10) || 0,
          displayOrder: i,
        })),
      });
    }
    if (sizesEnabled && sizes.length > 0) {
      groups.push({
        name: 'Sizes',
        selectionType: 'SINGLE',
        minSelections: 1,
        maxSelections: 1,
        displayOrder: 1,
        modifiers: sizes.map((s, i) => ({
          name: s.name,
          priceModifier: parseInt(s.price, 10) || 0,
          displayOrder: i,
        })),
      });
    }
    if (extras.length > 0) {
      groups.push({
        name: 'Extras / Add-ons',
        selectionType: 'MULTI',
        minSelections: 0,
        maxSelections: extras.length,
        displayOrder: 2,
        modifiers: extras.map((ex, i) => ({
          name: ex.name,
          priceModifier: parseInt(ex.price, 10) || 0,
          displayOrder: i,
        })),
      });
    }
    return groups;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (!name.trim()) {
        throw new Error('Item name is required.');
      }
      if (!categoryId) {
        throw new Error('Please select a category.');
      }
      if (!regularPrice || isNaN(parsedRegularPrice) || parsedRegularPrice < 0) {
        throw new Error('Please enter a valid regular selling price.');
      }

      // Promotion validations
      let finalPrice = parsedRegularPrice;
      let finalOriginalPrice: number | null = null;
      let finalStartsAt: string | null = null;
      let finalEndsAt: string | null = null;

      if (hasPromotion) {
        if (!isPromoPriceEntered) {
          throw new Error('Please enter a promotional price.');
        }
        if (parsedPromoPrice >= parsedRegularPrice) {
          throw new Error('Promotional price must be strictly lower than regular price.');
        }

        finalPrice = parsedPromoPrice;
        finalOriginalPrice = parsedRegularPrice;

        if (isScheduled) {
          if (discountStartsAt && discountEndsAt) {
            const sTime = new Date(discountStartsAt).getTime();
            const eTime = new Date(discountEndsAt).getTime();
            if (!isNaN(sTime) && !isNaN(eTime) && sTime >= eTime) {
              throw new Error('Discount start date/time must be before end date/time.');
            }
          }
          finalStartsAt = discountStartsAt ? parseDateTimeLocal(discountStartsAt) : null;
          finalEndsAt = discountEndsAt ? parseDateTimeLocal(discountEndsAt) : null;
        }
      }

      // 1. Upload image if newly selected
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

      // 2. Build payload
      const payload = {
        name: name.trim(),
        description: description?.trim() || null,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        discountStartsAt: finalStartsAt,
        discountEndsAt: finalEndsAt,
        categoryId,
        imageUrl: finalImageUrl,
        badge: badge || null,
        tags,
        ingredients: sanitizeIngredients(ingredients),
        availability,
        isVisible: availability !== 'HIDDEN',
        isAvailable: availability === 'AVAILABLE',
        isFeatured: Boolean(badge !== null),
        variants: variantsEnabled ? variants.filter((v) => v.name.trim()) : [],
        sizes: sizesEnabled ? sizes.filter((s) => s.name.trim()) : [],
        extras: extras.filter((e) => e.name.trim()),
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

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
      />

      <motion.div
        initial={{ x: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0)' }}
        animate={{ x: 0, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}
        exit={{ x: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0)' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white z-50 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Fill in the details to {initialData ? 'update' : 'add a new'} menu item
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION: BASIC INFORMATION                                        */}
          {/* ================================================================= */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-5">Basic Information</h3>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="col-span-2 sm:col-span-1 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-400 font-medium"
                    placeholder="e.g. Royal Truffle Burger"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer font-medium"
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Regular Selling Price */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Regular Price <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 font-normal ml-1.5">
                      (السعر العادي)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(sanitizePrice(e.target.value))}
                      className="w-full pl-11 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-gray-300"
                      placeholder="2000"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Box */}
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-semibold text-gray-700">
                    Image <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-amber-700/70">
                    Max 5MB • WebP
                  </span>
                </div>
                <div
                  onClick={() => !optimizingImage && fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] bg-[#FAF9F5] border border-[#F3F0E6] border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#FEF9EE]/40 transition-colors overflow-hidden group relative"
                >
                  {optimizingImage ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-amber-700">
                        Compressing & converting to WebP...
                      </span>
                    </div>
                  ) : imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                          Change Image
                        </span>
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
                      {(imageOptimizationInfo.optimizedSize / 1024).toFixed(0)} KB (Saved{' '}
                      {Math.round(
                        (1 -
                          imageOptimizationInfo.optimizedSize /
                            imageOptimizationInfo.originalSize) *
                          100
                      )}
                      %)
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none placeholder:text-gray-400"
                placeholder="Delicious description of the dish and ingredients..."
              />
            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* ================================================================= */}
          {/* SECTION: PROMOTION & SCHEDULE BUILDER (COMPLETE REDESIGN)        */}
          {/* ================================================================= */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-[#FAF9F5] border border-amber-200/80 rounded-2xl p-5 shadow-xs transition-all">
              {/* Promotion Header & Main Switch */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>Promotion & Special Offer</span>
                      <span className="text-xs font-normal text-amber-700">
                        (العروض والخصومات)
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Set a promotional price and schedule a temporary discount window
                    </p>
                  </div>
                </div>

                {/* Enable / Disable Promotion Switch */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasPromotion) {
                      handleRemovePromotion();
                    } else {
                      setHasPromotion(true);
                      if (!promoPrice && parsedRegularPrice > 0) {
                        // Helpful suggestion: 20% off
                        const suggested = Math.round(parsedRegularPrice * 0.8);
                        setPromoPrice(String(suggested));
                      }
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                    hasPromotion ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={hasPromotion}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      hasPromotion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Promotion Body (Expanded when Enabled) */}
              <AnimatePresence>
                {hasPromotion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-4 border-t border-amber-200/60 space-y-4">
                      {/* Price Configuration & Comparison Card */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/90 p-4 rounded-xl border border-amber-200/70 shadow-2xs">
                        {/* Promotional Price Input */}
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                            <span>
                              Promotional Price <span className="text-red-500">*</span>
                            </span>
                            <span className="text-[11px] font-normal text-amber-700">
                              (السعر بعد الخصم)
                            </span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 text-sm font-black">
                              {currencySymbol}
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={promoPrice}
                              onChange={(e) => setPromoPrice(sanitizePrice(e.target.value))}
                              placeholder="1500"
                              className="w-full pl-10 pr-3 py-2 bg-amber-50/40 border border-amber-300 rounded-lg text-sm font-black text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-amber-300"
                            />
                          </div>
                        </div>

                        {/* Regular Price Reference & Computed Savings Pill */}
                        <div className="flex flex-col justify-between p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">Regular Base Price:</span>
                            <span className="font-bold text-gray-700">
                              {isRegularPriceValid
                                ? `${parsedRegularPrice.toLocaleString()} ${currencySymbol}`
                                : 'Not set'}
                            </span>
                          </div>

                          {isPromoLower ? (
                            <div className="mt-2 flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <Percent size={13} />
                                <span>You Save {savingsAmount?.toLocaleString()} {currencySymbol}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                                {discountPct}% OFF
                              </span>
                            </div>
                          ) : (
                            <div className="mt-2 text-[11px] text-gray-400 italic">
                              Enter promo price lower than regular price
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price Validation Error Notice */}
                      {priceValidationError && (
                        <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
                          <AlertCircle size={14} className="shrink-0 text-red-500" />
                          <span>{priceValidationError}</span>
                        </div>
                      )}

                      {/* ======================================================= */}
                      {/* SCHEDULE PROMOTION SECTION                              */}
                      {/* ======================================================= */}
                      <div className="bg-white/90 p-4 rounded-xl border border-amber-200/70 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isScheduled}
                              onChange={(e) => setIsScheduled(e.target.checked)}
                              className="rounded border-gray-300 text-amber-500 focus:ring-amber-400 h-4 w-4 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                              <Calendar size={14} className="text-amber-500" />
                              <span>Schedule Promotion Window (جدولة فترة العرض)</span>
                            </span>
                          </label>

                          <span className="text-[11px] font-medium text-gray-400">
                            {isScheduled ? 'Timed Window' : 'Permanent / Ongoing'}
                          </span>
                        </div>

                        {isScheduled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3.5 pt-2"
                          >
                            {/* Quick Scheduling Presets Chips */}
                            <div>
                              <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Quick Presets (خيارات الجدولة السريعة):
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => applyPreset('tonight')}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                                >
                                  🌙 Tonight
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset('tomorrow')}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                                >
                                  ☀️ Tomorrow
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset('weekend')}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                                >
                                  🎉 This Weekend
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPreset('24h')}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                                >
                                  ⏱️ Next 24h
                                </button>
                              </div>
                            </div>

                            {/* Starts & Ends Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                                  <span>Starts At (يبدأ في)</span>
                                  {discountStartsAt && (
                                    <span className="text-[11px] font-semibold text-amber-700">
                                      {formatFriendlyDate(parseDateTimeLocal(discountStartsAt))}
                                    </span>
                                  )}
                                </label>
                                <input
                                  type="datetime-local"
                                  value={discountStartsAt}
                                  onChange={(e) => setDiscountStartsAt(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                                  <span>Ends At (ينتهي في)</span>
                                  {discountEndsAt && (
                                    <span className="text-[11px] font-semibold text-amber-700">
                                      {formatFriendlyDate(parseDateTimeLocal(discountEndsAt))}
                                    </span>
                                  )}
                                </label>
                                <input
                                  type="datetime-local"
                                  value={discountEndsAt}
                                  onChange={(e) => setDiscountEndsAt(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
                                />
                              </div>
                            </div>

                            {scheduleValidationError && (
                              <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0 text-red-500" />
                                <span>{scheduleValidationError}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>

                      {/* ======================================================= */}
                      {/* DYNAMIC PROMOTION STATE & COUNTDOWN INDICATOR           */}
                      {/* ======================================================= */}
                      <div className="p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors bg-white/95">
                        <div className="flex items-center gap-2.5">
                          {derivedPromoState === 'active' ? (
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                          ) : derivedPromoState === 'scheduled' ? (
                            <span className="flex h-3 w-3 relative">
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          ) : derivedPromoState === 'expired' ? (
                            <span className="flex h-3 w-3 relative">
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                          ) : (
                            <span className="flex h-3 w-3 relative">
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                            </span>
                          )}

                          <div>
                            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              {derivedPromoState === 'active' && (
                                <span className="text-emerald-700">🟢 Promotion Active Now</span>
                              )}
                              {derivedPromoState === 'scheduled' && (
                                <span className="text-amber-700">⏳ Scheduled Promotion</span>
                              )}
                              {derivedPromoState === 'expired' && (
                                <span className="text-rose-700">⏸️ Promotion Expired</span>
                              )}
                              {derivedPromoState === 'none' && (
                                <span className="text-gray-500">No Active Promotion</span>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {derivedPromoState === 'active' && isScheduled && endIso
                                ? `Valid until ${formatFriendlyDate(endIso)}`
                                : derivedPromoState === 'active' && !isScheduled
                                ? 'Active until modified or removed'
                                : derivedPromoState === 'scheduled' && startIso
                                ? `Will activate on ${formatFriendlyDate(startIso)}`
                                : derivedPromoState === 'expired' && endIso
                                ? `Ended on ${formatFriendlyDate(endIso)} (Regular price displayed)`
                                : 'Configure prices and schedule above'}
                            </p>
                          </div>
                        </div>

                        {/* Countdown Ticker Box */}
                        {countdownDisplay && (
                          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white flex items-center gap-2 font-mono text-xs font-bold shadow-xs shrink-0">
                            <Timer size={13} className="text-amber-400 animate-pulse" />
                            <span>
                              {countdownDisplay.label} {countdownDisplay.time}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ======================================================= */}
                      {/* LIVE CARD PREVIEW                                       */}
                      {/* ======================================================= */}
                      <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-amber-200/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                            <Sparkles size={12} className="text-amber-600" />
                            <span>Live Customer Menu Preview:</span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Real-time simulation
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200/80 shadow-2xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Item Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon size={18} className="text-gray-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {name || 'Item Name'}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {derivedPromoState === 'active' ? (
                                  <>
                                    <span className="text-xs font-black text-amber-600">
                                      {parsedPromoPrice.toLocaleString()} {currencySymbol}
                                    </span>
                                    <span className="text-[11px] text-gray-400 line-through">
                                      {parsedRegularPrice.toLocaleString()} {currencySymbol}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-black text-gray-900">
                                    {isRegularPriceValid
                                      ? `${parsedRegularPrice.toLocaleString()} ${currencySymbol}`
                                      : `0 ${currencySymbol}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Preview Badge */}
                          {derivedPromoState === 'active' && discountPct ? (
                            <div className="text-right shrink-0">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] shadow-2xs">
                                -{discountPct}% OFF
                              </span>
                            </div>
                          ) : derivedPromoState === 'scheduled' ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                              Starts Soon
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Remove Promotion Action */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleRemovePromotion}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Remove Promotion (حذف الخصم)</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* ================================================================= */}
          {/* SECTION: REORDERABLE INGREDIENTS                                  */}
          {/* ================================================================= */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <UtensilsCrossed size={16} className="text-amber-500" />
              <h3 className="text-base font-bold text-gray-900">
                Ingredients & Components (المقادير والمكونات)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Add ingredients in your preferred order. Use the ⬆️ and ⬇️ buttons to arrange from first to last.
            </p>

            {/* Add Ingredient Input */}
            <div className="flex gap-2 mb-3.5">
              <input
                type="text"
                value={newIngredientInput}
                onChange={(e) => setNewIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="e.g. 180g Angus Beef Patty, Truffle Mayo, Aged Cheddar"
              />
              <button
                type="button"
                onClick={addIngredient}
                disabled={!newIngredientInput.trim()}
                className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            {/* Ingredients Reorderable List */}
            {ingredients.length > 0 ? (
              <div className="space-y-2 bg-gray-50/60 p-3 rounded-2xl border border-gray-100">
                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-2xs hover:border-gray-300 transition-all group"
                  >
                    {/* Index Badge */}
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Editable Name */}
                    <input
                      type="text"
                      value={ing}
                      onChange={(e) => updateIngredient(idx, e.target.value)}
                      className="flex-1 text-xs font-bold text-gray-800 bg-transparent focus:outline-none focus:bg-amber-50/40 px-2 py-1 rounded"
                    />

                    {/* Order Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveIngredientUp(idx)}
                        disabled={idx === 0}
                        title="Move Up (تحريك للأعلى)"
                        className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveIngredientDown(idx)}
                        disabled={idx === ingredients.length - 1}
                        title="Move Down (تحريك للأسفل)"
                        className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        title="Remove Ingredient (حذف)"
                        className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer ml-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/30">
                <p className="text-xs text-gray-400 font-medium">
                  No ingredients added yet. Add recipe ingredients to show customers the components in this dish.
                </p>
              </div>
            )}
          </div>

          <hr className="border-gray-100 my-8" />

          {/* ================================================================= */}
          {/* SECTION: PROMOTIONAL BADGE & DIETARY TAGS                         */}
          {/* ================================================================= */}
          <div className="mb-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Promotional Badge</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3.5">
                Select a promotional badge to highlight this dish on your menu
              </p>

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
              <p className="text-xs text-gray-500 mb-3.5">
                Select all dietary and characteristic tags that apply (multi-select)
              </p>

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

          {/* ================================================================= */}
          {/* SECTION: VARIANTS (FLAVORS)                                       */}
          {/* ================================================================= */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Variants (Flavors)</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={variantsEnabled}
                  onChange={(e) => setVariantsEnabled(e.target.checked)}
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {variantsEnabled && (
              <div className="space-y-3">
                <div className="flex gap-4 px-1">
                  <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Flavor
                  </div>
                  <div className="w-24 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </div>
                  <div className="w-8"></div>
                </div>
                {variants.map((v, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => {
                          const n = [...variants];
                          n[i].name = e.target.value;
                          setVariants(n);
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                        placeholder="Flavor name"
                      />
                      {v.isDefault && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase border border-amber-200/50">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="w-24 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                        {currencySymbol}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.price}
                        onChange={(e) => {
                          const n = [...variants];
                          n[i].price = sanitizePrice(e.target.value);
                          setVariants(n);
                        }}
                        className="w-full pl-9 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                        placeholder="500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setVariants([...variants, { name: '', price: '', isDefault: false }])
                  }
                  className="text-[13px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2 cursor-pointer"
                >
                  <Plus size={14} /> Add Flavor
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100 my-8" />

          {/* ================================================================= */}
          {/* SECTION: SIZES                                                    */}
          {/* ================================================================= */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Sizes</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={sizesEnabled}
                  onChange={(e) => setSizesEnabled(e.target.checked)}
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {sizesEnabled && (
              <div className="space-y-3">
                <div className="flex gap-4 px-1">
                  <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Size
                  </div>
                  <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </div>
                  <div className="w-8"></div>
                </div>
                {sizes.map((s, i) => (
                  <div key={i} className="flex gap-4 items-center group">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => {
                        const n = [...sizes];
                        n[i].name = e.target.value;
                        setSizes(n);
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                      placeholder="Small / Regular / Large"
                    />
                    <div className="w-28 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                        {currencySymbol}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={s.price}
                        onChange={(e) => {
                          const n = [...sizes];
                          n[i].price = sanitizePrice(e.target.value);
                          setSizes(n);
                        }}
                        className="w-full pl-9 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                        placeholder="500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSizes(sizes.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSizes([...sizes, { name: '', price: '' }])}
                  className="text-[13px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2 cursor-pointer"
                >
                  <Plus size={14} /> Add Size
                </button>
              </div>
            )}
          </div>

          <hr className="border-gray-100 my-8" />

          {/* ================================================================= */}
          {/* SECTION: EXTRAS / ADD-ONS                                         */}
          {/* ================================================================= */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Extras / Add-ons</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-4 px-1">
                <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Extra Name
                </div>
                <div className="w-28 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Add Price
                </div>
                <div className="w-8"></div>
              </div>
              {extras.map((ex, i) => (
                <div key={i} className="flex gap-4 items-center group">
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => {
                      const n = [...extras];
                      n[i].name = e.target.value;
                      setExtras(n);
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                    placeholder="Extra Cheese / Sauce"
                  />
                  <div className="w-28 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      +{currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ex.price}
                      onChange={(e) => {
                        const n = [...extras];
                        n[i].price = sanitizePrice(e.target.value);
                        setExtras(n);
                      }}
                      className="w-full pl-10 pr-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                      placeholder="100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtras(extras.filter((_, idx) => idx !== i))}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExtras([...extras, { name: '', price: '' }])}
                className="text-[13px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2 cursor-pointer"
              >
                <Plus size={14} /> Add Extra
              </button>
            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* ================================================================= */}
          {/* SECTION: AVAILABILITY & VISIBILITY SETTINGS                       */}
          {/* ================================================================= */}
          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-1">Item Availability</h3>
            <p className="text-xs text-gray-500 mb-4">
              Control how this item appears to customers scanning your digital menu
            </p>

            <div className="relative">
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as MenuItemAvailability)}
                className="w-full px-4 py-3.5 bg-white border border-[#E5E0D8] rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer pr-10 shadow-xs"
              >
                <option value="AVAILABLE">Available — Visible &amp; orderable in public menu</option>
                <option value="SOLD_OUT">Sold Out — Visible in public menu, marked Sold Out</option>
                <option value="HIDDEN">Hidden — Completely hidden from public menu</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>

            {/* State description banner */}
            <div className="mt-3 p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 transition-colors bg-[#FAF9F5] border-[#E5E0D8]">
              {availability === 'AVAILABLE' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <p className="text-gray-700">
                    <strong className="font-bold text-gray-900">Available:</strong> Customers can view dish details and options normally on your live menu.
                  </p>
                </>
              )}
              {availability === 'SOLD_OUT' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <p className="text-gray-700">
                    <strong className="font-bold text-gray-900">Sold Out:</strong> Customers can still see this dish on your menu, but it will be clearly labeled as &quot;Sold Out&quot;.
                  </p>
                </>
              )}
              {availability === 'HIDDEN' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-400 mt-1 shrink-0" />
                  <p className="text-gray-700">
                    <strong className="font-bold text-gray-900">Hidden:</strong> This dish is completely hidden and will not be displayed anywhere on the public menu.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || Boolean(priceValidationError) || Boolean(scheduleValidationError)}
            className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Plus size={16} /> Save Item
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
