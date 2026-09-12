"use client";

import React, { useRef } from "react";
import type { ColorControl } from "@/types/theme-contract";

export interface ColorPickerControlProps {
  control: ColorControl;
  value: unknown;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DEFAULT_SWATCHES = [
  { name: "Amber Gold", hex: "#D97706" },
  { name: "Crimson Red", hex: "#DC2626" },
  { name: "Warm Brown", hex: "#78350F" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Violet Purple", hex: "#7C3AED" },
  { name: "Warm White", hex: "#FAF9F5" },
  { name: "Dark Zinc", hex: "#18181B" },
];

export function ColorPickerControl({
  control,
  value,
  onChange,
  disabled = false,
}: ColorPickerControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const colorStr = typeof value === "string" && value ? value : "#D97706";
  const inputId = `color-input-${control.id}`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-white/80"
        >
          {control.label}
        </label>
        {control.description && (
          <span className="text-[10px] text-white/40">{control.description}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Color Swatch Button with Hidden Native Picker */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label={`Choose custom ${control.label}. Current color is ${colorStr}`}
          className="w-9 h-9 rounded-xl border border-white/20 shadow-inner flex items-center justify-center relative overflow-hidden transition-transform active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none cursor-pointer"
          style={{ backgroundColor: colorStr }}
        >
          <input
            ref={inputRef}
            type="color"
            value={colorStr.startsWith("#") && colorStr.length === 7 ? colorStr : "#D97706"}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-hidden="true"
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-none"
          />
        </button>

        {/* Hex Text Input */}
        <input
          id={inputId}
          type="text"
          value={colorStr}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          aria-label={`${control.label} hex code`}
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-white/30 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus:border-amber-500/50 disabled:opacity-50 uppercase"
        />
      </div>

      {/* Quick Swatches */}
      <div
        className="flex items-center gap-1.5 pt-1 flex-wrap"
        role="group"
        aria-label={`Preset color swatches for ${control.label}`}
      >
        {DEFAULT_SWATCHES.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            disabled={disabled}
            onClick={() => onChange(swatch.hex)}
            aria-label={`Select ${swatch.name} (${swatch.hex})`}
            className={`w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none cursor-pointer ${
              colorStr.toLowerCase() === swatch.hex.toLowerCase()
                ? "ring-2 ring-white/80 scale-110"
                : ""
            }`}
            style={{ backgroundColor: swatch.hex }}
            title={`${swatch.name} (${swatch.hex})`}
          />
        ))}
      </div>
    </div>
  );
}
