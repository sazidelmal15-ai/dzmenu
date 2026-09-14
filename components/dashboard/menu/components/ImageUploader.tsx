'use client';

import { useState, useRef } from 'react';
import { Upload, X, Crop, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageFramingModal, type AspectRatioPreset, type NonDestructiveFramingResult } from '@/components/ui/ImageFramingModal';
import type { ImageFramingMetadata } from '@/types/theme-contract';
import { getFramingTransformStyle } from '@/lib/utils';

export interface ImageFile {
  id: string;
  url: string;
  file?: File; // Present if it's a new upload not yet saved
  framing?: ImageFramingMetadata;
  displayOrder: number;
}

interface Props {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  preset?: AspectRatioPreset;
}

export default function ImageUploader({ images, onChange, preset = '4:3' }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Framing Modal State
  const [framingModalOpen, setFramingModalOpen] = useState(false);
  const [activeFileForFraming, setActiveFileForFraming] = useState<File | string | null>(null);
  const [activeInitialFraming, setActiveInitialFraming] = useState<ImageFramingMetadata | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setEditingImageId(null);
        setActiveInitialFraming(null);
        setActiveFileForFraming(file);
        setFramingModalOpen(true);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setEditingImageId(null);
        setActiveInitialFraming(null);
        setActiveFileForFraming(file);
        setFramingModalOpen(true);
      }
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFramingSave = (result: NonDestructiveFramingResult) => {
    if (editingImageId) {
      // Update existing image
      const updated = images.map((img) =>
        img.id === editingImageId
          ? { ...img, url: result.previewUrl, file: result.file || undefined, framing: result.framing }
          : img
      );
      onChange(updated);
    } else {
      // Add new framed image
      const newImg: ImageFile = {
        id: Math.random().toString(36).substring(7),
        url: result.previewUrl,
        file: result.file || undefined,
        framing: result.framing,
        displayOrder: images.length,
      };
      onChange([...images, newImg]);
    }
    setFramingModalOpen(false);
    setActiveFileForFraming(null);
    setActiveInitialFraming(null);
    setEditingImageId(null);
  };

  const openRecrop = (img: ImageFile) => {
    setEditingImageId(img.id);
    setActiveInitialFraming(img.framing || null);
    setActiveFileForFraming(img.file || img.url);
    setFramingModalOpen(true);
  };

  const removeImage = (idToRemove: string) => {
    onChange(images.filter((img) => img.id !== idToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Images</h3>
        <span className="text-[11px] text-gray-500 font-medium">
          Auto-framing tool adjusts image dimensions
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {images.map((img, index) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-700 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Menu item ${index}`}
                className="w-full h-full object-cover"
                style={getFramingTransformStyle(img.framing)}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => openRecrop(img)}
                  className="p-2 bg-amber-500/30 text-amber-300 rounded-full hover:bg-amber-500 hover:text-black transition-colors cursor-pointer"
                  title="Edit & Frame Image"
                >
                  <Crop size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="p-2 bg-red-500/30 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800'
          }`}
        >
          <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-500'}`} />
          <span className="text-xs text-gray-400 font-medium">Upload & Frame Image</span>
          <span className="text-[10px] text-gray-500 mt-0.5">Instant crop & compression</span>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
      />

      {/* Interactive Image Framing & Crop Modal */}
      {framingModalOpen && activeFileForFraming && (
        <ImageFramingModal
          isOpen={framingModalOpen}
          imageSource={activeFileForFraming}
          initialPreset={preset}
          initialFraming={activeInitialFraming}
          title="Frame & Adjust Item Image"
          onClose={() => {
            setFramingModalOpen(false);
            setActiveFileForFraming(null);
            setActiveInitialFraming(null);
            setEditingImageId(null);
          }}
          onSave={handleFramingSave}
        />
      )}
    </div>
  );
}

