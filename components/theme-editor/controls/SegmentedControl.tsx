"use client";

import React from "react";
import type { SegmentedControl as SegmentedControlType } from "@/types/theme-contract";

export interface SegmentedControlProps {
  control: SegmentedControlType;
  value: unknown;
  onChange: (value: string | number | boolean) => void;
  disabled?: boolean;
}

export function SegmentedControl({
  control,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps) {
  const currentValue = value !== undefined && value !== null ? String(value) : "";
  const labelId = `label-${control.id}`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label id={labelId} className="text-xs font-medium text-white/80">
          {control.label}
        </label>
        {control.description && (
          <span className="text-[10px] text-white/40">{control.description}</span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl border border-white/10"
      >
        {control.options.map((opt) => {
          const isSelected = String(opt.value) === currentValue;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={opt.label}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all truncate text-center focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none cursor-pointer ${
                isSelected
                  ? "bg-amber-500 text-black shadow-md font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
