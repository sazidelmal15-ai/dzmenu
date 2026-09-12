"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Crop,
} from "lucide-react";
import type { ImageSlotControl, ImageFramingMetadata } from "@/types/theme-contract";
import { ImageFramingModal, type NonDestructiveFramingResult } from "@/components/ui/ImageFramingModal";

export interface ImageSlotUploadControlProps {
  control: ImageSlotControl;
  value: unknown;
  framingValue?: ImageFramingMetadata | null;
  fallbackUrl?: string | null;
  onChange: (url: string | null, file?: File | null, framing?: ImageFramingMetadata | null) => void;
  disabled?: boolean;
}

export function ImageSlotUploadControl({
  control,
  value,
  framingValue = null,
  fallbackUrl = null,
  onChange,
  disabled = false,
}: ImageSlotUploadControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [framingModalOpen, setFramingModalOpen] = useState(false);
  const [activeFileForFraming, setActiveFileForFraming] = useState<File | string | null>(null);

  const imageUrl = typeof value === "string" && value ? value : null;

  const isHero = control.slotId.includes("hero") || control.label.toLowerCase().includes("hero");
  const isSquare = control.slotId === "logo" || control.label.toLowerCase().includes("logo");
  const isPortrait = control.slotId.includes("splash") || control.label.toLowerCase().includes("splash");
  const exactAspectRatio = isSquare ? 1 : isPortrait ? 9 / 16 : isHero ? 1.35 : 16 / 9;
  const ratioLabel = isSquare ? "1:1 Square" : isPortrait ? "9:16 Portrait" : isHero ? "1.35:1 Hero Mobile" : "16:9 Landscape";
  const defaultLabel = isSquare ? "Default Profile Logo" : "Default Profile Cover";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files (PNG, JPG, WebP, SVG) are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image file size exceeds 5MB limit.");
      return;
    }

    setUploadError(null);
    if (file.type === "image/svg+xml") {
      const url = URL.createObjectURL(file);
      onChange(url, file, null);
    } else {
      setActiveFileForFraming(file);
      setFramingModalOpen(true);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFramingSave = (result: NonDestructiveFramingResult) => {
    onChange(result.previewUrl, result.file, result.framing);
    setFramingModalOpen(false);
    setActiveFileForFraming(null);
  };

  const openRecrop = () => {
    if (imageUrl || fallbackUrl) {
      setActiveFileForFraming(imageUrl || fallbackUrl);
      setFramingModalOpen(true);
    }
  };

  const handleResetOverride = () => {
    setUploadError(null);
    onChange(null, null, null);
  };

  return (
    <div className="space-y-2.5">
      {/* 1. Header Label & Status Badge */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`slot-${control.id}`}
            className="text-xs font-semibold text-white/90 truncate"
          >
            {control.label}
          </label>
          {imageUrl ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Custom Override
            </span>
          ) : fallbackUrl ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Profile Default
            </span>
          ) : null}
        </div>
        {control.description && (
          <p className="text-[11px] text-white/40 leading-relaxed">
            {control.description}
          </p>
        )}
      </div>

      {uploadError && (
        <div
          role="alert"
          className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-[11px] text-red-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="truncate">{uploadError}</span>
        </div>
      )}

      {/* STATE 1: Custom Theme Override Uploaded */}
      {imageUrl ? (
        <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] space-y-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl overflow-hidden shrink-0 border border-white/15 bg-black/60 p-1 flex items-center justify-center shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={control.label}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Theme-Specific {control.label}</span>
              </div>
              <p className="text-[10.5px] text-amber-300/70 mt-0.5 truncate">
                Active override for this theme
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={openRecrop}
              className="py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="تعديل التأطير والأبعاد"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>تأطير</span>
            </button>

            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-white/70" />
                  <span>Replace</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={handleResetOverride}
              className="py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 text-red-400 border border-red-500/20 hover:border-red-500/30 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Remove override and revert to profile default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      ) : fallbackUrl ? (
        /* STATE 2: Using Default Profile Fallback */
        <div className="p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.035] transition-all space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40 p-1 flex items-center justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fallbackUrl}
                alt={control.label}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{defaultLabel}</span>
              </div>
              <p className="text-[10.5px] text-white/40 mt-0.5 truncate">
                Inherited from Restaurant Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={openRecrop}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="تعديل وتأطير صورة الملف الشخصي"
            >
              <Crop className="w-3.5 h-3.5 text-amber-400" />
              <span>تأطير</span>
            </button>

            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom {control.label}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STATE 3: No Image Exists Anywhere */
        <button
          id={`slot-${control.id}`}
          type="button"
          disabled={disabled || isProcessing}
          onClick={() => fileInputRef.current?.click()}
          aria-label={`Upload ${control.label}`}
          aria-busy={isProcessing}
          className="w-full h-24 rounded-2xl border-2 border-dashed border-white/10 hover:border-amber-500/40 bg-white/[0.02] hover:bg-amber-500/[0.03] transition-all flex flex-col items-center justify-center gap-1.5 text-white/40 hover:text-amber-400 disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2 text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span className="text-xs font-medium">Processing image...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                <span className="text-xs font-medium">Upload {control.label}</span>
              </div>
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                PNG, JPG, WebP, SVG ({ratioLabel}, Max 5MB)
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Framing Modal */}
      {framingModalOpen && activeFileForFraming && (
        <ImageFramingModal
          isOpen={framingModalOpen}
          imageSource={activeFileForFraming}
          aspectRatio={exactAspectRatio}
          initialFraming={framingValue}
          title={`تأطير وتعديل أبعاد ${control.label}`}
          onClose={() => {
            setFramingModalOpen(false);
            setActiveFileForFraming(null);
          }}
          onSave={handleFramingSave}
        />
      )}
    </div>
  );
}

