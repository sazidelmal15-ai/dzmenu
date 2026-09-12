'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageUploader, { ImageFile } from './ImageUploader';
import ModifierBuilder, { ModifierGroup } from './ModifierBuilder';
import { apiFetch } from '@/lib/api';

interface Category {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: any; // If editing an existing item
  onSaved: () => void;
}

export default function MenuItemModal({ isOpen, onClose, categories, initialData, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState<'BASIC' | 'IMAGES' | 'MODIFIERS'>('BASIC');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  const [images, setImages] = useState<ImageFile[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setPrice(initialData.price.toString());
        setCategoryId(initialData.categoryId);
        setStockQuantity(initialData.stockQuantity?.toString() || '');
        setIsAvailable(initialData.isAvailable);
        setImages(initialData.images || []);
        setModifierGroups(initialData.modifierGroups || []);
      } else {
        // Reset form for new item
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setStockQuantity('');
        setIsAvailable(true);
        setImages([]);
        setModifierGroups([]);
      }
      setActiveTab('BASIC');
      setError('');
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      if (!name || !price || !categoryId) {
        throw new Error('Name, Price, and Category are required.');
      }

      const payload = {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        isAvailable,
        modifierGroups,
      };

      let itemId = initialData?.id;

      // 1. Save Basic Data & Modifiers
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

      // 2. Upload New Images (if any)
      const newImages = images.filter(img => img.file);
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach(img => {
          if (img.file) formData.append('images', img.file);
        });

        // Since apiFetch uses application/json by default, we need a custom fetch for FormData
        const token = localStorage.getItem('token');
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/menu/items/${itemId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error('Failed to upload images');
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Edit Menu Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-6 gap-6 bg-gray-900/30">
          {['BASIC', 'IMAGES', 'MODIFIERS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 text-sm font-semibold transition-colors relative ${
                activeTab === tab ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              {activeTab === tab && (
                <motion.div layoutId="modal-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className={activeTab === 'BASIC' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Item Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. Classic Cheeseburger" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Category *</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none appearance-none">
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Base Price *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-white focus:border-blue-500 outline-none" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Stock (Optional)</label>
                    <input type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none" placeholder="Unlimited" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none resize-none" placeholder="Delicious beef patty with..." />
                </div>

                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Availability</h4>
                    <p className="text-xs text-gray-500 mt-1">Is this item currently available to order?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isAvailable} onChange={e => setIsAvailable(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={activeTab === 'IMAGES' ? 'block' : 'hidden'}>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          <div className={activeTab === 'MODIFIERS' ? 'block' : 'hidden'}>
             <ModifierBuilder groups={modifierGroups} onChange={setModifierGroups} />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : (
              <>
                <Save size={18} /> Save Item
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
