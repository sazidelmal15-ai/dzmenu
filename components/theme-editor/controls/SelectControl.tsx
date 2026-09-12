"use client";

import React from "react";
import type { SelectControl } from "@/types/theme-contract";

export interface SelectControlProps {
  control: SelectControl;
  value: unknown;
  onChange: (value: string | number | boolean) => void;
  disabled?: boolean;
}

export function SelectControl({
  control,
  value,
  onChange,
  disabled = false,
}: SelectControlProps) {
  const currentValue = value !== undefined && value !== null ? String(value) : "";
  const selectId = `select-${control.id}`;
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
        value={currentValue}
        disabled={disabled}
        aria-label={control.label}
        aria-describedby={control.description ? descId : undefined}
        onChange={(e) => {
          const selectedOption = control.options.find(
            (opt) => String(opt.value) === e.target.value
          );
          if (selectedOption) {
            onChange(selectedOption.value);
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus:border-amber-500/50 disabled:opacity-50 appearance-none cursor-pointer"
      >
        {control.options.map((opt) => (
          <option
            key={String(opt.value)}
            value={String(opt.value)}
            className="bg-[#181c24] text-white py-1"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
