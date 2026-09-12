"use client";

import React from "react";
import type { SliderControl } from "@/types/theme-contract";

export interface SliderControlProps {
  control: SliderControl;
  value: unknown;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function SliderControl({
  control,
  value,
  onChange,
  disabled = false,
}: SliderControlProps) {
  const numValue = typeof value === "number" && !isNaN(value) ? value : control.min;
  const unit = control.unit || "px";
  const sliderId = `slider-${control.id}`;
  const descId = `desc-${control.id}`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={sliderId} className="text-xs font-medium text-white/80">
          {control.label}
        </label>
        <span
          className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20"
          aria-hidden="true"
        >
          {numValue}
          {unit}
        </span>
      </div>

      {control.description && (
        <p id={descId} className="text-[10px] text-white/40">
          {control.description}
        </p>
      )}

      <input
        id={sliderId}
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={numValue}
        disabled={disabled}
        aria-label={control.label}
        aria-describedby={control.description ? descId : undefined}
        aria-valuemin={control.min}
        aria-valuemax={control.max}
        aria-valuenow={numValue}
        aria-valuetext={`${numValue} ${unit}`}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      />

      <div className="flex justify-between text-[10px] text-white/30" aria-hidden="true">
        <span>
          {control.min}
          {unit}
        </span>
        <span>
          {control.max}
          {unit}
        </span>
      </div>
    </div>
  );
}
