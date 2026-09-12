"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Crop,
  Undo2,
  Loader2,
  Check,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { processAndConvertToWebP } from "@/lib/utils/image-optimizer";
import { calculatePanBounds } from "@/lib/utils/image-framing";
import type { ImageFramingMetadata } from "@/types/theme-contract";

export type AspectRatioPreset = "4:3" | "1:1" | "16:9" | "1.35:1" | "9:16";

export interface NonDestructiveFramingResult {
  file: File | null;
  previewUrl: string;
  framing: ImageFramingMetadata;
}

export interface ImageFramingModalProps {
  isOpen: boolean;
  imageSource: File | string | null;
  aspectRatio?: number | string | AspectRatioPreset;
  initialPreset?: AspectRatioPreset;
  initialFraming?: ImageFramingMetadata | null;
  title?: string;
  onClose: () => void;
  onSave: (result: NonDestructiveFramingResult) => void;
}

function parseAspectRatioInfo(val: number | string | undefined): { ratio: number; label: string; sub: string } {
  if (typeof val === "number" && !isNaN(val) && val > 0) {
    if (Math.abs(val - 4 / 3) < 0.05) return { ratio: 4 / 3, label: "4:3", sub: "بطاقات الأطباق (Dish Card)" };
    if (Math.abs(val - 1) < 0.05) return { ratio: 1, label: "1:1", sub: "مربع / شعار (Square / Logo)" };
    if (Math.abs(val - 16 / 9) < 0.05) return { ratio: 16 / 9, label: "16:9", sub: "غلاف عريض (Banner)" };
    if (Math.abs(val - 1.35) < 0.05) return { ratio: 1.35, label: "1.35:1", sub: "غلاف Hero المتجاوب" };
    if (Math.abs(val - 9 / 16) < 0.05) return { ratio: 9 / 16, label: "9:16", sub: "طولي (Story / Splash)" };
    return { ratio: val, label: `${val.toFixed(2)}:1`, sub: "إطار العرض المخصص" };
  }
  if (typeof val === "string") {
    if (val === "4:3" || val === "4/3") return { ratio: 4 / 3, label: "4:3", sub: "بطاقات الأطباق (Dish Card)" };
    if (val === "1:1" || val === "1/1") return { ratio: 1, label: "1:1", sub: "مربع / شعار (Square / Logo)" };
    if (val === "16:9" || val === "16/9") return { ratio: 16 / 9, label: "16:9", sub: "غلاف عريض (Banner)" };
    if (val.startsWith("1.35") || val.startsWith("1.4")) return { ratio: 1.35, label: "1.35:1", sub: "غلاف Hero المتجاوب" };
    if (val === "9:16" || val === "9/16") return { ratio: 9 / 16, label: "9:16", sub: "طولي (Story / Splash)" };
  }
  return { ratio: 1.35, label: "1.35:1", sub: "غلاف العرض المتجاوب" };
}

export function ImageFramingModal({
  isOpen,
  imageSource,
  aspectRatio = 1.35,
  initialPreset,
  initialFraming = null,
  title = "تأطير وتعديل أبعاد الصورة",
  onClose,
  onSave,
}: ImageFramingModalProps) {
  const targetRatio = initialPreset || aspectRatio;
  const ratioInfo = parseAspectRatioInfo(targetRatio);

  const [zoom, setZoom] = useState<number>(initialFraming?.zoom || 1);
  const [rotation, setRotation] = useState<number>(initialFraming?.rotation || 0);
  const [panPx, setPanPx] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Measure natural dimensions of the image
  useEffect(() => {
    if (!imageObjectUrl) {
      setNaturalSize(null);
      return;
    }
    const img = new Image();
    img.src = imageObjectUrl;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [imageObjectUrl]);

  const naturalRatio = useMemo(() => {
    if (naturalSize && naturalSize.width > 0 && naturalSize.height > 0) {
      return naturalSize.width / naturalSize.height;
    }
    return ratioInfo.ratio;
  }, [naturalSize, ratioInfo.ratio]);

  const effectiveRatio = useMemo(() => {
    let r = naturalRatio;
    if (rotation === 90 || rotation === 270) {
      r = 1 / r;
    }
    return r > 0 ? r : 1;
  }, [naturalRatio, rotation]);

  const frameDimensions = useMemo(() => {
    const maxW = 420;
    const maxH = 280;
    const r = ratioInfo.ratio > 0 ? ratioInfo.ratio : 1.35;

    let width = maxW;
    let height = maxW / r;

    if (height > maxH) {
      height = maxH;
      width = maxH * r;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }, [ratioInfo.ratio]);

  // Calculate base dimensions (to 100% cover the frame at zoom = 1)
  const imageDisplayDimensions = useMemo(() => {
    let baseWidth = frameDimensions.width;
    let baseHeight = frameDimensions.height;

    if (effectiveRatio >= ratioInfo.ratio) {
      // Image is wider than crop frame: height fills 100%, width overflows
      baseHeight = frameDimensions.height;
      baseWidth = frameDimensions.height * effectiveRatio;
    } else {
      // Image is taller than crop frame: width fills 100%, height overflows
      baseWidth = frameDimensions.width;
      baseHeight = frameDimensions.width / effectiveRatio;
    }

    const currentWidth = baseWidth * zoom;
    const currentHeight = baseHeight * zoom;

    const maxShiftX = Math.max(0, (currentWidth - frameDimensions.width) / 2);
    const maxShiftY = Math.max(0, (currentHeight - frameDimensions.height) / 2);

    return {
      width: Math.round(currentWidth),
      height: Math.round(currentHeight),
      maxShiftX,
      maxShiftY,
    };
  }, [frameDimensions, effectiveRatio, ratioInfo.ratio, zoom]);

  // Sync initial framing ONLY when opening modal or image source changes
  useEffect(() => {
    if (!isOpen) return;

    const z = initialFraming?.zoom || 1;
    const rot = initialFraming?.rotation || 0;
    setZoom(z);
    setRotation(rot);

    let r = naturalRatio;
    if (rot === 90 || rot === 270) r = 1 / r;

    let baseW = frameDimensions.width;
    let baseH = frameDimensions.height;
    if (r >= ratioInfo.ratio) {
      baseH = frameDimensions.height;
      baseW = frameDimensions.height * r;
    } else {
      baseW = frameDimensions.width;
      baseH = frameDimensions.width / r;
    }
    const curW = baseW * z;
    const curH = baseH * z;
    const maxSX = Math.max(0, (curW - frameDimensions.width) / 2);
    const maxSY = Math.max(0, (curH - frameDimensions.height) / 2);

    const initX = typeof initialFraming?.x === "number" ? initialFraming.x : 0;
    const initY = typeof initialFraming?.y === "number" ? initialFraming.y : 0;

    setPanPx({
      x: maxSX > 0 ? Math.max(-maxSX, Math.min(maxSX, -(initX / 50) * maxSX)) : 0,
      y: maxSY > 0 ? Math.max(-maxSY, Math.min(maxSY, -(initY / 50) * maxSY)) : 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, imageSource]);

  // Create clean object URL if imageSource is a File
  useEffect(() => {
    if (!imageSource) {
      setImageObjectUrl(null);
      return;
    }
    if (typeof imageSource === "string") {
      setImageObjectUrl(imageSource);
    } else {
      const url = URL.createObjectURL(imageSource);
      setImageObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageSource]);

  // Reset transforms
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPanPx({ x: 0, y: 0 });
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
  };

  // Zoom changes with smooth anchor preservation
  const handleZoomChange = (newZoom: number) => {
    const safeZ = Math.max(1, Math.min(3, Number(newZoom.toFixed(2))));
    
    setZoom((prevZoom) => {
      const scaleFactor = prevZoom > 0 ? safeZ / prevZoom : 1;

      let baseWidth = frameDimensions.width;
      let baseHeight = frameDimensions.height;
      if (effectiveRatio >= ratioInfo.ratio) {
        baseHeight = frameDimensions.height;
        baseWidth = frameDimensions.height * effectiveRatio;
      } else {
        baseWidth = frameDimensions.width;
        baseHeight = frameDimensions.width / effectiveRatio;
      }

      const newWidth = baseWidth * safeZ;
      const newHeight = baseHeight * safeZ;
      const newMaxSX = Math.max(0, (newWidth - frameDimensions.width) / 2);
      const newMaxSY = Math.max(0, (newHeight - frameDimensions.height) / 2);

      setPanPx((prevPan) => ({
        x: Math.max(-newMaxSX, Math.min(newMaxSX, prevPan.x * scaleFactor)),
        y: Math.max(-newMaxSY, Math.min(newMaxSY, prevPan.y * scaleFactor)),
      }));

      return safeZ;
    });
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  const touchPinchDistRef = useRef<number | null>(null);

  // Pointer / Touch drag gestures
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const maxSX = imageDisplayDimensions.maxShiftX;
    const maxSY = imageDisplayDimensions.maxShiftY;

    setPanPx((prev) => ({
      x: Math.max(-maxSX, Math.min(maxSX, prev.x + deltaX)),
      y: Math.max(-maxSY, Math.min(maxSY, prev.y + deltaY)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    setIsDragging(false);
  };

  // Multi-touch 2-finger pinch zoom on mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchPinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchPinchDistRef.current;
      touchPinchDistRef.current = dist;
      handleZoomChange(zoom * factor);
    }
  };

  const handleTouchEnd = () => {
    touchPinchDistRef.current = null;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    handleZoomChange(zoom + delta);
  };

  // Confirm Non-Destructive Framing
  const handleConfirmFraming = async () => {
    if (!imageSource) return;
    try {
      setIsExporting(true);

      const maxSX = imageDisplayDimensions.maxShiftX;
      const maxSY = imageDisplayDimensions.maxShiftY;

      // Convert pixel offset back to normalized framing percentages [-50, +50]
      const framingX = maxSX > 0 ? Number((-(panPx.x / maxSX) * 50).toFixed(1)) : 0;
      const framingY = maxSY > 0 ? Number((-(panPx.y / maxSY) * 50).toFixed(1)) : 0;

      const framingMetadata: ImageFramingMetadata = {
        x: framingX,
        y: framingY,
        zoom: Number(zoom.toFixed(2)),
        rotation,
        aspectRatio: ratioInfo.ratio,
      };

      let fileToSave: File | null = null;
      let previewUrl = imageObjectUrl || "";

      if (typeof imageSource === "object" && imageSource instanceof File) {
        // Optimize original image to lightweight WebP without destructive clipping
        if (imageSource.type !== "image/svg+xml") {
          try {
            const opt = await processAndConvertToWebP(imageSource, 1400, 1400, 0.82);
            fileToSave = opt.file;
            previewUrl = opt.previewUrl;
          } catch {
            fileToSave = imageSource;
          }
        } else {
          fileToSave = imageSource;
        }
      }

      onSave({
        file: fileToSave,
        previewUrl,
        framing: framingMetadata,
      });

      onClose();
    } catch (err) {
      console.error("[ImageFramingModal] Framing save error:", err);
      alert("حدث خطأ أثناء حفظ التأطير، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !imageObjectUrl) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none touch-none">
      <div className="relative w-full max-w-2xl bg-[#141416] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* 1. Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#1A1A1E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                {title}
              </h2>
              <p className="text-[11px] text-white/50">
                اسحب الصورة لتحديد المشهد الذي تريده داخل الإطار المضيء
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Target Fixed Frame Info Banner with Cover Lock Indicator */}
        <div className="px-5 py-2.5 bg-[#121214] border-b border-white/5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-black flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5" />
              <span>إطار المينيو: {ratioInfo.label}</span>
            </span>
            <span className="text-[11px] text-white/60 font-medium hidden sm:inline">
              {ratioInfo.sub}
            </span>
          </div>

          <span className="text-[10.5px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>تغطية 100% بدون فراغات</span>
          </span>
        </div>

        {/* 3. Interactive Crop Viewport Canvas: Single Continuous Image + Cutout Overlay Mask */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onWheel={handleWheel}
          style={{ touchAction: "none" }}
          className={`relative flex-1 min-h-[320px] sm:min-h-[380px] bg-[#070709] flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none ${
            isDragging ? "ring-2 ring-amber-500/40" : ""
          }`}
        >
          {/* A. Single Continuous Image (Renders once, perfectly continuous under the mask) */}
          <div
            className="absolute pointer-events-none transition-transform duration-75 ease-out flex items-center justify-center"
            style={{
              width: `${imageDisplayDimensions.width}px`,
              height: `${imageDisplayDimensions.height}px`,
              transform: `translate(${panPx.x}px, ${panPx.y}px) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageObjectUrl}
              alt="Cropping Target"
              onLoad={handleImageLoad}
              className="w-full h-full object-fill select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* B. Illuminated Cutout Window Mask (Dims outside to 72% black, leaves inside 100% clear) */}
          <div
            style={{
              width: `${frameDimensions.width}px`,
              height: `${frameDimensions.height}px`,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
            }}
            className="relative pointer-events-none rounded-2xl border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.25)] z-20"
          >
            {/* 3x3 Rule of Thirds Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Corner Alignment Indicators */}
            <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
            <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
            <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />
          </div>

          {/* Floating Pan Indicator helper */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10.5px] text-white/90 font-medium pointer-events-none flex items-center gap-2 shadow-xl whitespace-nowrap z-30">
            <Move className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {imageDisplayDimensions.maxShiftX > 0 && imageDisplayDimensions.maxShiftY > 0
                ? "اسحب بحرية أفقياً وعمودياً لتوسيط المشهد المطلوب داخل الإطار"
                : imageDisplayDimensions.maxShiftX > 0
                ? "اسحب يميناً ويساراً (كبّر الزووم للتحريك للأعلى والأسفل)"
                : imageDisplayDimensions.maxShiftY > 0
                ? "اسحب للأعلى والأسفل (كبّر الزووم للتحريك يميناً ويساراً)"
                : "الصورة تملأ الإطار تماماً (كبّر الزووم للتحريك والتوسيط)"}
            </span>
          </div>
        </div>

        {/* 4. Controls Toolbar (Zoom Slider + Rotation + Reset) */}
        <div className="px-5 py-3.5 bg-[#18181C] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.1)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.1)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-amber-400 w-10 text-center">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Action Helpers: Rotate & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>تدوير 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 hover:text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          </div>
        </div>

        {/* 5. Footer Actions */}
        <div className="px-5 py-4 bg-[#141416] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleConfirmFraming}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:brightness-110 text-black font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>حفظ وتأكيد الإعدادات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


