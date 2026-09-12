"use client";

import React from "react";
import { Check } from "lucide-react";
import type { PaletteControl as PaletteControlType } from "@/types/theme-contract";

export interface PaletteControlProps {
  control: PaletteControlType;
  value: unknown;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PaletteControl({
  control,
  value,
  onChange,
  disabled = false,
}: PaletteControlProps) {
  const selectedId = typeof value === "string" ? value : control.options[0]?.id;

  return (
    <div className="space-y-2.5">
      {control.label && (
        <div>
          <label
            id={`label-${control.id}`}
            className="text-xs font-semibold text-white block"
          >
            {control.label}
          </label>
          {control.description && (
            <p id={`desc-${control.id}`} className="text-[10px] text-white/50 mt-0.5">
              {control.description}
            </p>
          )}
        </div>
      )}

      <div
        role="radiogroup"
        aria-labelledby={control.label ? `label-${control.id}` : undefined}
        aria-describedby={control.description ? `desc-${control.id}` : undefined}
        className="grid grid-cols-1 gap-2"
      >
        {control.options.map((option) => {
          const isSelected = option.id === selectedId;
          const { primary, accent, surface, background } = option.colors;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.name}: ${option.description || "Palette option"}`}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`w-full p-2.5 rounded-xl border text-left transition-all relative cursor-pointer select-none group flex items-center justify-between gap-3 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                isSelected
                  ? "bg-white/[0.08] border-white/40 ring-1 ring-white/30 shadow-lg"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white tracking-wide truncate">
                  {option.name}
                </div>

                {option.description && (
                  <p className="text-[10px] text-white/40 truncate mt-0.5 leading-tight font-normal">
                    {option.description}
                  </p>
                )}
              </div>

              {/* Color Swatches */}
              <div
                className="flex items-center gap-1.5 shrink-0 bg-black/40 p-1.5 rounded-lg border border-white/10"
                aria-hidden="true"
              >
                {/* Primary */}
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: primary }}
                  title={`Primary: ${primary}`}
                />
                {/* Accent */}
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: accent }}
                  title={`Accent: ${accent}`}
                />
                {/* Surface */}
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: surface }}
                  title={`Surface: ${surface}`}
                />
                {/* Background */}
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                  style={{ backgroundColor: background }}
                  title={`Background: ${background}`}
                />
              </div>

              {/* Selection Checkmark */}
              {isSelected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-md bg-white text-black"
                  aria-hidden="true"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
