"use client";

import React from "react";
import type { TextControl as TextControlType } from "@/types/theme-contract";

export interface TextControlProps {
  control: TextControlType;
  value: unknown;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TextControl({
  control,
  value,
  onChange,
  disabled = false,
}: TextControlProps) {
  const textValue = typeof value === "string" ? value : "";
  const textId = `text-${control.id}`;
  const descId = `desc-${control.id}`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={textId} className="text-xs font-medium text-white/80">
          {control.label}
        </label>
        {control.description && (
          <span id={descId} className="text-[10px] text-white/40">
            {control.description}
          </span>
        )}
      </div>

      <input
        id={textId}
        type="text"
        value={textValue}
        disabled={disabled}
        aria-label={control.label}
        aria-describedby={control.description ? descId : undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder={control.placeholder || "Enter text..."}
        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus:border-amber-500/50 disabled:opacity-50"
      />
    </div>
  );
}
