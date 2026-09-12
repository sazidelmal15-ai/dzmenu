"use client";

import React from "react";
import type { ToggleControl } from "@/types/theme-contract";

export interface ToggleControlProps {
  control: ToggleControl;
  value: unknown;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleControl({
  control,
  value,
  onChange,
  disabled = false,
}: ToggleControlProps) {
  const isChecked =
    value !== undefined
      ? Boolean(value)
      : (control.defaultValue ?? true);

  const toggleId = `toggle-${control.id}`;
  const descId = `desc-${control.id}`;
  const isIndented = Boolean(control.indent);

  return (
    <div className={`flex items-center justify-between gap-3 ${isIndented ? "py-0.5" : "py-1"}`}>
      <div className="flex-1 min-w-0">
        <label
          htmlFor={toggleId}
          className={`${
            isIndented
              ? "text-[11.5px] font-normal text-white/75"
              : "text-xs font-medium text-white/90"
          } block cursor-pointer select-none transition-colors hover:text-white`}
        >
          {control.label}
        </label>
        {control.description && (
          <p id={descId} className="text-[10px] text-white/40 mt-0.5">
            {control.description}
          </p>
        )}
      </div>

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={control.label}
        aria-describedby={control.description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!isChecked)}
        className={`${
          isIndented ? "w-8 h-4.5 p-0.5" : "w-10 h-6 p-1"
        } flex items-center rounded-full transition-colors duration-200 ease-in-out shrink-0 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none cursor-pointer ${
          isChecked ? "bg-amber-500" : "bg-white/10"
        }`}
      >
        <div
          className={`bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
            isIndented
              ? `w-3.5 h-3.5 ${isChecked ? "translate-x-3.5" : "translate-x-0"}`
              : `w-4 h-4 ${isChecked ? "translate-x-4" : "translate-x-0"}`
          }`}
        />
      </button>
    </div>
  );
}
