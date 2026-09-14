'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Plus,
  GripVertical,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { processAndConvertToWebP } from '@/lib/utils/image-optimizer';
import IconLibraryModal from './IconLibraryModal';

export interface Category {
  id: string;
  name: string;
  shortName?: string;
  icon?: string;
  description?: string;
  imageUrl?: string;
  badge?: string;
  sortOrder?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isDeleted?: boolean;
  itemCount?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  existingCategories: Category[];
}

export default function CategoryDrawer({ isOpen, onClose, onSaved, existingCategories }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [initialCategoryIds, setInitialCategoryIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // All categories from DB (including inactive ones)
  const [allDbCategories, setAllDbCategories] = useState<Category[]>(existingCategories);

  // In-Drawer Edit State
  const [editingTarget, setEditingTarget] = useState<Category | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editName, setEditName] = useState('');
  const [editShortName, setEditShortName] = useState('');
  const [editIcon, setEditIcon] = useState('🍽️');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editIsVisible, setEditIsVisible] = useState(true);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [imageOptimizationInfo, setImageOptimizationInfo] = useState<{ originalSize: number; optimizedSize: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Destructive Category Deletion Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Per-category icon histories (scoped per restaurant account)
  const [categoryHistories, setCategoryHistories] = useState<Record<string, string[]>>({});
  const currentRestaurantId = (allDbCategories[0] as any)?.restaurantId || (existingCategories[0] as any)?.restaurantId || 'default';
  const historyStorageKey = `dzmenu_icons_${currentRestaurantId}`;

  // Load persisted per-category histories from localStorage scoped by restaurant
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(historyStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setCategoryHistories(parsed);
          } else {
            setCategoryHistories({});
          }
        } else {
          setCategoryHistories({});
        }
      } catch (e) {
        setCategoryHistories({});
      }
    }
  }, [isOpen, historyStorageKey]);

  // Helper to extract canonical stable keys for a category
  const getCategoryHistoryKeys = (target: any, nameOverride?: string): string[] => {
    const keys: string[] = [];
    const name = (nameOverride || target?.name || target?.shortName || '').trim();
    if (name) {
      const normalizedName = name.toLowerCase().replace(/\s+/g, '_');
      keys.push(normalizedName);
      keys.push(name);
      keys.push(name.toLowerCase());
    }
    if (target?.id && typeof target.id === 'string') {
      keys.push(target.id);
      keys.push(target.id.toLowerCase());
    }
    return Array.from(new Set(keys.filter(Boolean)));
  };

  // Find existing history for current category across all its possible keys
  const activeKeys = getCategoryHistoryKeys(editingTarget, editName);
  let activeRecentIcons: string[] = [];
  for (const k of activeKeys) {
    if (categoryHistories[k] && categoryHistories[k].length > 0) {
      activeRecentIcons = categoryHistories[k];
      break;
    }
  }

  const pushToActiveCategoryHistory = (icon: string) => {
    if (!icon || activeKeys.length === 0) return;
    setCategoryHistories((prev) => {
      let currentList: string[] = [];
      for (const k of activeKeys) {
        if (prev[k] && prev[k].length > 0) {
          currentList = prev[k];
          break;
        }
      }

      const filtered = currentList.filter((i) => i !== icon);
      const updatedList = [icon, ...filtered].slice(0, 13);

      const newHistories = { ...prev };
      for (const k of activeKeys) {
        newHistories[k] = updatedList;
      }

      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(newHistories));
      } catch (e) {}
      return newHistories;
    });
  };

  // Load all categories for this restaurant from PostgreSQL
  const refreshDbCategories = () => {
    apiFetch('/menu/categories?includeDeleted=true')
      .then((res: any) => {
        if (Array.isArray(res)) {
          setAllDbCategories(res);
          const activeIds = res.filter((c: Category) => !c.isDeleted).map((c: Category) => c.id);
          setInitialCategoryIds(activeIds);
          setSelectedCategoryIds(activeIds);
        }
      })
      .catch(() => {
        const activeIds = existingCategories.filter((c) => !c.isDeleted).map((c) => c.id);
        setAllDbCategories(existingCategories);
        setInitialCategoryIds(activeIds);
        setSelectedCategoryIds(activeIds);
      });
  };

  useEffect(() => {
    if (isOpen) {
      refreshDbCategories();
      setEditingTarget(null);
      setIsCreatingNew(false);
      setError('');
    }
  }, [isOpen]);

  const handleCategoryToggle = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      // Preserve the canonical order of allDbCategories so untoggling/re-toggling never moves items to the end
      return allDbCategories.map((c) => c.id).filter((cId) => next.includes(cId));
    });
    setError('');
  };

  const handleOpenEdit = (category: Category) => {
    const targetIcon = category.icon || '🍽️';
    setIsCreatingNew(false);
    setEditingTarget(category);
    setEditName(category.name || '');
    setEditShortName(category.shortName || category.name || '');
    setEditIcon(targetIcon);
    setEditDescription(category.description || '');
    setEditImageUrl(category.imageUrl || '');
    setEditBadge(category.badge || '');
    setEditIsVisible(category.isActive !== undefined ? category.isActive : (category.isAvailable !== undefined ? category.isAvailable : true));
    setEditImageFile(null);
    setImageOptimizationInfo(null);
    setError('');
    setShowDeleteConfirm(false);
    setDeleteError('');
  };

  const handleOpenNewCategory = () => {
    setIsCreatingNew(true);
    setEditingTarget({
      id: `new_${Date.now()}`,
      name: '',
      icon: '🍽️',
      description: '',
      imageUrl: '',
    });
    setEditName('');
    setEditShortName('');
    setEditIcon('🍽️');
    setEditDescription('');
    setEditImageUrl('');
    setEditBadge('');
    setEditIsVisible(true);
    setEditImageFile(null);
    setImageOptimizationInfo(null);
    setError('');
    setShowDeleteConfirm(false);
    setDeleteError('');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setOptimizingImage(true);
        setError('');
        const optimized = await processAndConvertToWebP(file);
        setEditImageFile(optimized.file);
        setEditImageUrl(optimized.previewUrl);
        setImageOptimizationInfo({
          originalSize: optimized.originalSize,
          optimizedSize: optimized.optimizedSize,
        });
      } catch (err: any) {
        setError(err.message || 'Image processing failed');
      } finally {
        setOptimizingImage(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setEditImageFile(null);
    setEditImageUrl('');
    setImageOptimizationInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'categories');

    const res = await fetch('/api/menu/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload category image');
    }

    const json = await res.json();
    return json.data?.url || '';
  };

  const handleSaveEditedCategory = async () => {
    if (!editName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      let finalImageUrl = editImageUrl;

      // Handle Image Upload if a new file was selected
      if (editImageFile) {
        const formData = new FormData();
        formData.append('file', editImageFile);
        formData.append('folder', 'categories');

        const uploadRes = await fetch('/api/menu/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Image upload failed');
        }

        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url || uploadData.data?.url || '';
      }

      if (editingTarget && !isCreatingNew) {
        // Edit existing category
        await apiFetch(`/menu/categories/${editingTarget.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: editName.trim(),
            shortName: editShortName.trim() || editName.trim(),
            icon: editIcon,
            description: editDescription.trim() || null,
            imageUrl: finalImageUrl || null,
            badge: editBadge || null,
            isAvailable: editIsVisible,
          }),
        });
      } else {
        // Create new category
        const res: any = await apiFetch('/menu/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: editName.trim(),
            shortName: editShortName.trim() || editName.trim(),
            icon: editIcon,
            description: editDescription.trim() || null,
            imageUrl: finalImageUrl || null,
            badge: editBadge || null,
            isAvailable: editIsVisible,
            sortOrder: allDbCategories.length,
          }),
        });

        if (res && res.id) {
          setSelectedCategoryIds((prev) => [...prev, res.id]);
        }
      }

      if (editIcon && editIcon !== '🍽️') {
        pushToActiveCategoryHistory(editIcon);
      }

      refreshDbCategories();
      onSaved();
      setEditingTarget(null);
      setIsCreatingNew(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = () => {
    if (!editingTarget) return;
    setShowDeleteConfirm(true);
    setDeleteError('');
  };

  const handleConfirmDeleteCategory = async () => {
    if (!editingTarget) return;

    try {
      setIsDeletingCategory(true);
      setDeleteError('');

      await apiFetch(`/menu/categories/${editingTarget.id}`, {
        method: 'DELETE',
      });

      setSelectedCategoryIds((prev) => prev.filter((id) => id !== editingTarget.id));
      setAllDbCategories((prev) => prev.filter((c) => c.id !== editingTarget.id));
      refreshDbCategories();
      onSaved();
      setShowDeleteConfirm(false);
      setEditingTarget(null);
      setIsCreatingNew(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete category');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const getActivePreviews = () => {
    return selectedCategoryIds
      .map((id) => allDbCategories.find((c) => c.id === id))
      .filter(Boolean) as Category[];
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError('');

      const promises: Promise<any>[] = [];

      // 1. Maintain active categories order
      selectedCategoryIds.forEach((id, index) => {
        promises.push(
          apiFetch(`/menu/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              orderIndex: index,
              isDeleted: false,
              isAvailable: true,
            }),
          })
        );
      });

      // 2. Soft-delete unselected categories, positioning them after active ones
      const unselectedCats = allDbCategories.filter((c) => !selectedCategoryIds.includes(c.id));
      unselectedCats.forEach((c, i) => {
        promises.push(
          apiFetch(`/menu/categories/${c.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              orderIndex: selectedCategoryIds.length + i,
              isDeleted: true,
            }),
          })
        );
      });

      await Promise.all(promises);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const previews = getActivePreviews();

  // Categories displayed in the drawer (from PostgreSQL)
  const isExpandable = allDbCategories.length > 11;
  const visibleCategories = showAllCategories || !isExpandable
    ? allDbCategories
    : allDbCategories.slice(0, 11);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]" onClick={onClose} />

      {/* Right Slide-over Drawer */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-[110] flex flex-col overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!editingTarget ? (
            /* ========================================================================= */
            /* VIEW 1: CATEGORY SELECTION & PREVIEW (100% DATABASE DRIVEN)              */
            /* ========================================================================= */
            <motion.div
              key="category-list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manage Categories</h2>
                  <p className="text-[13px] font-medium text-gray-500 mt-0.5">Select, reorder, or create menu categories</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {error && (
                  <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">
                    {error}
                  </div>
                )}

                {/* Section 1: Categories Grid (4 Columns) */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[15px] font-bold text-gray-900">1. Menu Categories</h3>
                    <span className="text-[11px] font-bold text-gray-400">
                      {allDbCategories.length} Categories
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 mb-4">Click to enable or disable categories in your menu</p>

                  <div className="grid grid-cols-4 gap-3">
                    {visibleCategories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      const displayIcon = cat.icon || '🍽️';
                      const displayName = cat.name;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryToggle(cat.id)}
                          className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer select-none ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                              : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          {/* Circular Edit Icon */}
                          <div
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(cat);
                            }}
                            className="absolute top-1.5 right-1.5 w-[22px] h-[22px] rounded-full bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center text-gray-400 hover:text-amber-600 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all duration-150 sm:opacity-0 sm:scale-90 group-hover:opacity-100 group-hover:scale-100 opacity-100 scale-100 z-10 cursor-pointer"
                            title={`Edit ${displayName}`}
                          >
                            <Edit3 size={13} strokeWidth={2.2} />
                          </div>

                          <div className="text-3xl mb-2 flex items-center justify-center h-9 w-9">
                            {displayIcon.startsWith('http') || displayIcon.startsWith('blob:') || displayIcon.startsWith('data:') || displayIcon.startsWith('/') ? (
                              displayIcon.includes('high_contrast.svg') ? (
                                <div
                                  className="w-7 h-7"
                                  style={{
                                    backgroundColor: '#D97706',
                                    WebkitMaskImage: `url("${displayIcon}")`,
                                    WebkitMaskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center',
                                    maskImage: `url("${displayIcon}")`,
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                  }}
                                />
                              ) : (
                                <img src={displayIcon} alt={displayName} className="w-7 h-7 object-contain" />
                              )
                            ) : (
                              displayIcon
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-gray-700 text-center leading-tight truncate w-full px-1">
                            {displayName}
                          </span>
                          {isSelected && (
                            <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full">
                              <CheckCircle2 size={16} className="text-amber-500 fill-amber-500/20" />
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* More / Less Option (when more than 11 categories exist) */}
                    {isExpandable && (
                      <button
                        type="button"
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer select-none"
                      >
                        <div className="text-3xl mb-2 text-gray-400">{showAllCategories ? '↑' : '⋯'}</div>
                        <span className="text-[11px] font-bold text-gray-500 text-center leading-tight">
                          {showAllCategories ? 'Less' : 'More'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-8 opacity-50">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                {/* Section 2: Create Category */}
                <div className="mb-8">
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1">2. Create New Category</h3>
                  <p className="text-[13px] text-gray-500 mb-3">Add a custom category to your restaurant menu</p>

                  <button
                    type="button"
                    onClick={handleOpenNewCategory}
                    className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus size={18} /> Create Category
                  </button>
                </div>

                {/* Section 3: Preview & Reorder */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-bold text-gray-900">Preview & Reorder</h3>
                    {previews.length > 0 && (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                        {previews.length} Selected
                      </span>
                    )}
                  </div>

                  {previews.length > 0 ? (
                    <Reorder.Group
                      axis="y"
                      values={selectedCategoryIds}
                      onReorder={setSelectedCategoryIds}
                      className="space-y-3"
                    >
                      {selectedCategoryIds.map((id) => {
                        const p = allDbCategories.find((c) => c.id === id);
                        if (!p) return null;

                        const displayIcon = p.icon || '🍽️';
                        const displayName = p.name;
                        const displayDescription = p.description || '';

                        return (
                          <Reorder.Item
                            key={p.id}
                            value={p.id}
                            className="p-4 bg-white border border-gray-100 shadow-sm rounded-[20px] flex items-center gap-4 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
                          >
                            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-3xl shrink-0 border border-gray-100 pointer-events-none overflow-hidden">
                              {displayIcon.startsWith('http') || displayIcon.startsWith('blob:') || displayIcon.startsWith('data:') || displayIcon.startsWith('/') ? (
                                displayIcon.includes('high_contrast.svg') ? (
                                  <div
                                    className="w-8 h-8"
                                    style={{
                                      backgroundColor: '#D97706',
                                      WebkitMaskImage: `url("${displayIcon}")`,
                                      WebkitMaskSize: 'contain',
                                      WebkitMaskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'center',
                                      maskImage: `url("${displayIcon}")`,
                                      maskSize: 'contain',
                                      maskRepeat: 'no-repeat',
                                      maskPosition: 'center',
                                    }}
                                  />
                                ) : (
                                  <img src={displayIcon} alt={displayName} className="w-8 h-8 object-contain" />
                                )
                              ) : (
                                displayIcon
                              )}
                            </div>
                            <div className="pointer-events-none flex-1">
                              <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{displayName}</h4>
                              <p className="text-[13px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                                {displayDescription}
                              </p>
                            </div>
                            <div className="text-gray-300 ml-auto cursor-grab active:cursor-grabbing">
                              <GripVertical size={20} />
                            </div>
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>
                  ) : (
                    <div className="p-4 border border-dashed border-gray-200 rounded-[20px] flex items-center justify-center text-[13px] font-medium text-gray-400 h-24 bg-gray-50">
                      Select categories above to see preview and reorder
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={
                      saving ||
                      (selectedCategoryIds.length === initialCategoryIds.length &&
                        selectedCategoryIds.every((id, i) => initialCategoryIds[i] === id))
                    }
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: IN-DRAWER EDIT / CREATE CATEGORY VIEW                            */
            /* ========================================================================= */
            <motion.div
              key="category-edit-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Header with Back Arrow Button */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (editIcon && editIcon !== '🍽️') {
                        pushToActiveCategoryHistory(editIcon);
                      }
                      setEditingTarget(null);
                      setIsCreatingNew(false);
                    }}
                    className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
                    title="Back to category list"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {isCreatingNew ? 'Create Category' : `Edit: ${editName || 'Category'}`}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isCreatingNew ? 'Configure category name, icon, and cover photo' : 'Customize name, icon, and cover photo'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Edit / Create Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">
                    {error}
                  </div>
                )}

                {/* 1. GENERAL INFORMATION SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-1">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">General</h3>
                      <p className="text-[11px] text-gray-500 leading-tight">Basic information about this category</p>
                    </div>
                  </div>

                  {/* Category Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <FileText size={16} />
                      </div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-xs"
                        placeholder="e.g. Desserts"
                        autoFocus={isCreatingNew}
                      />
                    </div>
                  </div>

                  {/* Short Name (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Short Name <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <FileText size={16} />
                      </div>
                      <input
                        type="text"
                        value={editShortName}
                        onChange={(e) => setEditShortName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-xs"
                        placeholder="e.g. Desserts"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Used in small spaces (e.g. mobile, cards)</p>
                  </div>

                  {/* Description (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Description <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      maxLength={160}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition resize-none shadow-xs"
                      placeholder="Cakes, pastries, and sweet treats"
                    />
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span>A short description about this category</span>
                      <span>{editDescription.length}/160</span>
                    </div>
                  </div>
                </div>

                {/* 2. MEDIA SECTION (ICON & IMAGE) */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-2.5 pb-1">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">Media</h3>
                      <p className="text-[11px] text-gray-500 leading-tight">Icon and cover image for this category</p>
                    </div>
                  </div>

                  {/* Category Icon */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700">
                        Category Icon / Emoji <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsIconModalOpen(true)}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles size={12} className="text-amber-500" />
                        <span>Browse Libraries</span>
                      </button>
                    </div>

                    {/* Dynamic History Grid */}
                    <div className="grid grid-cols-7 gap-1.5 p-2 bg-[#FAF9F5] border border-gray-200/80 rounded-2xl transition-all">
                      <button
                        type="button"
                        onClick={() => setIsIconModalOpen(true)}
                        className="aspect-square rounded-xl border-2 border-dashed border-amber-400/80 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-500 text-amber-700 hover:scale-105 transition-all shadow-2xs cursor-pointer group flex items-center justify-center"
                        title="Browse all icon libraries"
                      >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
                      </button>

                      {editIcon && !activeRecentIcons.includes(editIcon) && (
                        <button
                          key={`current-${editIcon}`}
                          type="button"
                          onClick={() => setEditIcon(editIcon)}
                          className="aspect-square rounded-xl flex items-center justify-center text-lg transition-all duration-150 cursor-pointer relative bg-white border-2 border-amber-500 shadow-sm shadow-amber-500/15 scale-105 ring-2 ring-amber-500/20 z-10"
                          title={`Current: ${editIcon}`}
                        >
                          {editIcon.startsWith('http') || editIcon.startsWith('blob:') || editIcon.startsWith('data:') || editIcon.startsWith('/') ? (
                            editIcon.includes('high_contrast.svg') ? (
                              <div
                                className="w-5 h-5"
                                style={{
                                  backgroundColor: '#D97706',
                                  WebkitMaskImage: `url("${editIcon}")`,
                                  WebkitMaskSize: 'contain',
                                  WebkitMaskRepeat: 'no-repeat',
                                  WebkitMaskPosition: 'center',
                                  maskImage: `url("${editIcon}")`,
                                  maskSize: 'contain',
                                  maskRepeat: 'no-repeat',
                                  maskPosition: 'center',
                                }}
                              />
                            ) : (
                              <img src={editIcon} alt="icon" className="w-5 h-5 object-contain" />
                            )
                          ) : (
                            <span className="text-lg leading-none">{editIcon}</span>
                          )}
                        </button>
                      )}

                      {(() => {
                        const currentIconSlot = editIcon && !activeRecentIcons.includes(editIcon) ? 1 : 0;
                        const totalSlots = activeRecentIcons.length > 6 ? 13 : 6;
                        const remainingSlots = totalSlots - currentIconSlot;
                        return Array.from({ length: remainingSlots }).map((_, index) => {
                          const icon = activeRecentIcons[index];
                          if (icon) {
                            const isSelected = editIcon === icon;
                            return (
                              <button
                                key={`${icon}-${index}`}
                                type="button"
                                onClick={() => setEditIcon(icon)}
                                className={`aspect-square rounded-xl flex items-center justify-center text-lg transition-all duration-150 cursor-pointer relative ${
                                  isSelected
                                    ? 'bg-white border-2 border-amber-500 shadow-sm shadow-amber-500/15 scale-105 ring-2 ring-amber-500/20 z-10'
                                    : 'bg-white/90 border border-gray-200/70 hover:bg-white hover:border-gray-300 hover:scale-105'
                                }`}
                                title={icon}
                              >
                                {icon.startsWith('http') || icon.startsWith('blob:') || icon.startsWith('data:') || icon.startsWith('/') ? (
                                  icon.includes('high_contrast.svg') ? (
                                    <div
                                      className="w-5 h-5"
                                      style={{
                                        backgroundColor: '#D97706',
                                        WebkitMaskImage: `url("${icon}")`,
                                        WebkitMaskSize: 'contain',
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskPosition: 'center',
                                        maskImage: `url("${icon}")`,
                                        maskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                      }}
                                    />
                                  ) : (
                                    <img src={icon} alt="icon" className="w-5 h-5 object-contain" />
                                  )
                                ) : (
                                  <span className="text-lg leading-none">{icon}</span>
                                )}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={`empty-${index}`}
                              type="button"
                              onClick={() => setIsIconModalOpen(true)}
                              className="aspect-square rounded-xl border border-dashed border-gray-200/80 bg-white/40 hover:bg-white/80 hover:border-amber-300 transition-all flex items-center justify-center cursor-pointer group"
                              title="Empty slot - Click to pick icon"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-amber-400 transition-colors" />
                            </button>
                          );
                        });
                      })()}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Category icon history (click + to browse all libraries)
                    </p>
                  </div>

                  {/* Cover Photo Upload with WebP Auto-Converter */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700">Cover Photo</label>
                      <span className="text-[11px] font-medium text-amber-700/80">Max 5MB • WebP</span>
                    </div>

                    <div
                      onClick={() => !optimizingImage && fileInputRef.current?.click()}
                      className="w-full aspect-[16/9] bg-[#FAF9F5] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#FEF9EE]/40 transition overflow-hidden group relative"
                    >
                      {optimizingImage ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-semibold text-amber-700">Compressing image to WebP...</span>
                        </div>
                      ) : editImageUrl ? (
                        <>
                          <img src={editImageUrl} alt="Category cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                              Change Photo
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditImageUrl('');
                                setEditImageFile(null);
                                setImageOptimizationInfo(null);
                              }}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                              title="Delete Photo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <ImageIcon size={24} className="text-gray-400 mb-1.5" />
                          <span className="text-xs font-bold text-gray-700">Upload Cover Photo</span>
                          <span className="text-[11px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</span>
                        </div>
                      )}
                    </div>

                    {imageOptimizationInfo && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/50">
                        <span className="font-semibold flex items-center gap-1">
                          <Sparkles size={13} /> Compressed to WebP
                        </span>
                        <span className="font-bold">
                          {(imageOptimizationInfo.optimizedSize / 1024).toFixed(0)} KB (Saved{' '}
                          {Math.round((1 - imageOptimizationInfo.optimizedSize / imageOptimizationInfo.originalSize) * 100)}%)
                        </span>
                      </div>
                    )}

                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                  </div>
                </div>

                {/* 3. OPTIONS SECTION (BADGE & VISIBILITY) */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-2.5 pb-1">
                    <div className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">Options</h3>
                      <p className="text-[11px] text-gray-500 leading-tight">Badges and menu visibility settings</p>
                    </div>
                  </div>

                  {/* Badge Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Badge <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={editBadge}
                        onChange={(e) => setEditBadge(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-xs appearance-none cursor-pointer pr-10"
                      >
                        <option value="">None (No badge)</option>
                        <option value="⭐ Popular">⭐ Popular</option>
                        <option value="🔥 Hot">🔥 Hot</option>
                        <option value="✨ New">✨ New</option>
                        <option value="👨‍🍳 Chef's Choice">👨‍🍳 Chef's Choice</option>
                        <option value="🏷️ Special Offer">🏷️ Special Offer</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Display a promotional badge on this category in your menu
                    </p>
                  </div>

                  {/* Visibility Toggle Card */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Visibility
                    </label>
                    <div
                      onClick={() => setEditIsVisible(!editIsVisible)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        editIsVisible
                          ? 'bg-[#FAF9F5] border-amber-200/80 shadow-xs'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                            editIsVisible ? 'bg-amber-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                              editIsVisible ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {editIsVisible ? 'Visible in Menu' : 'Hidden from Menu'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {editIsVisible ? 'Show or hide this category in live menu' : 'Hidden from customer menu'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          editIsVisible
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {editIsVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Footer Actions */}
              <div className="p-5 border-t border-gray-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={handleDeleteCategory}
                    disabled={saving || isDeletingCategory}
                    className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Delete this category"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                )}
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (editIcon && editIcon !== '🍽️') {
                        pushToActiveCategoryHistory(editIcon);
                      }
                      setEditingTarget(null);
                      setIsCreatingNew(false);
                      setShowDeleteConfirm(false);
                    }}
                    disabled={saving || isDeletingCategory}
                    className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedCategory}
                    disabled={saving || optimizingImage || isDeletingCategory}
                    className="flex-1 max-w-[200px] flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isCreatingNew ? (
                      'Create Category'
                    ) : (
                      'Save Details'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* DESTRUCTIVE CATEGORY DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && editingTarget && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 flex flex-col"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
                <Trash2 size={24} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Delete Category?
              </h3>
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <span>{editingTarget.icon || '🍽️'}</span>
                <span>{editName || editingTarget.name}</span>
              </p>

              <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-100 text-xs text-red-900 mb-4 leading-relaxed">
                {typeof editingTarget.itemCount === 'number' && editingTarget.itemCount > 0 ? (
                  <>
                    <p className="font-bold mb-1">
                      This category contains {editingTarget.itemCount} menu item{editingTarget.itemCount > 1 ? 's' : ''}.
                    </p>
                    <p className="text-red-800">
                      Deleting this category will permanently delete:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 font-medium text-red-800">
                      <li>The category ({editName || editingTarget.name})</li>
                      <li>All {editingTarget.itemCount} menu item{editingTarget.itemCount > 1 ? 's' : ''} inside it</li>
                    </ul>
                  </>
                ) : (
                  <p className="text-red-800">
                    This category contains no menu items. Deleting it will permanently remove the category.
                  </p>
                )}
                <p className="font-bold mt-2.5 text-red-900">
                  This action cannot be undone.
                </p>
              </div>

              {deleteError && (
                <p className="text-xs text-red-600 font-semibold mb-3">
                  {deleteError}
                </p>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteError('');
                  }}
                  disabled={isDeletingCategory}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  disabled={isDeletingCategory}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isDeletingCategory ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : typeof editingTarget.itemCount === 'number' && editingTarget.itemCount > 0 ? (
                    'Delete Category & Items'
                  ) : (
                    'Delete Category'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ICON LIBRARY MODAL SHELL */}
      <IconLibraryModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        onSelectIcon={(icon) => {
          setEditIcon(icon);
          pushToActiveCategoryHistory(icon);
        }}
        currentIcon={editIcon}
      />
    </>
  );
}
