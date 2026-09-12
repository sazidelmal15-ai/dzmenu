"use client";

import React from "react";
import type { FontControl } from "@/types/theme-contract";

export interface FontSelectControlProps {
  control: FontControl;
  value: unknown;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CURATED_FONTS = [
  { label: "Outfit (Modern Clean)", value: "Outfit" },
  { label: "Inter (Tech Minimal)", value: "Inter" },
  { label: "Playfair Display (Luxury Serif)", value: "Playfair Display" },
  { label: "Cairo (Arabic Standard)", value: "Cairo" },
  { label: "Tajawal (Arabic Modern)", value: "Tajawal" },
  { label: "Roboto (Versatile Sans)", value: "Roboto" },
];

export function FontSelectControl({
  control,
  value,
  onChange,
  disabled = false,
}: FontSelectControlProps) {
  const currentFont = typeof value === "string" && value ? value : "Outfit";
  const selectId = `font-select-${control.id}`;
  const descId = `desc-${control.id}`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={selectId} className="text-xs font-medium text-white/80">
          {control.label}
        </label>
        {control.description && (
          <span id={descId} className="text-[10px] text-white/40">
            {control.description}
          </span>
        )}
      </div>

      <select
        id={selectId}
        value={currentFont}
        disabled={disabled}
        aria-label={control.label}
        aria-describedby={control.description ? descId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus:border-amber-500/50 disabled:opacity-50 appearance-none cursor-pointer"
        style={{ fontFamily: currentFont }}
      >
        {CURATED_FONTS.map((font) => (
          <option
            key={font.value}
            value={font.value}
            className="bg-[#181c24] text-white py-1"
            style={{ fontFamily: font.value }}
          >
            {font.label}
          </option>
        ))}
      </select>

      {/* Font specimen preview */}
      <div
        className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/60 truncate"
        style={{ fontFamily: currentFont }}
        aria-hidden="true"
      >
        The quick brown fox jumps • تجربة معاينة الخط
      </div>
    </div>
  );
}
