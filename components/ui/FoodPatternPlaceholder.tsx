"use client";

import React, { useId } from "react";
import { UtensilsCrossed, Sparkles } from "lucide-react";

export interface FoodPatternPlaceholderProps {
  className?: string;
  iconClassName?: string;
  subtle?: boolean;
  altText?: string;
  showIcon?: boolean;
  badgeText?: string;
}

/**
 * FoodPatternPlaceholder
 * A zero-latency, theme-adaptive SVG culinary pattern placeholder for dishes and items without photos.
 * Automatically harmonizes with active theme CSS variables and dark/light modes.
 */
export function FoodPatternPlaceholder({
  className = "w-full h-full",
  iconClassName = "w-7 h-7 sm:w-8 sm:h-8",
  subtle = false,
  altText,
  showIcon = true,
  badgeText,
}: FoodPatternPlaceholderProps) {
  const rawId = useId();
  const patternId = `food-pat-${rawId.replace(/[^a-zA-Z0-9-_]/g, "")}`;

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none bg-[var(--dz-theme-surface-raised,rgba(0,0,0,0.03))] text-[var(--dz-theme-primary,currentColor)] ${className}`}
      aria-label={altText || "Food item placeholder"}
    >
      {/* Background Micro-Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--dz-theme-primary)]/5 via-transparent to-[var(--dz-theme-accent)]/8" />

      {/* SVG Seamless Food Vector Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.14] dark:opacity-[0.18] transition-opacity duration-300"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id={patternId}
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(18)"
          >
            {/* 1. Cloche Platter */}
            <g
              transform="translate(14, 12) scale(0.65)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <path d="M3 17h18a1 1 0 0 0 1-1 10 10 0 0 0-20 0 1 1 0 0 0 1 1Z" />
              <path d="M1 20h22" />
            </g>

            {/* 2. Fork and Knife crossed */}
            <g
              transform="translate(68, 14) scale(0.6)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 2v8a3 3 0 0 1-3 3h-1v9" />
              <path d="M4 2v5a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" />
              <path d="M6 9v13" />
            </g>

            {/* 3. Coffee / Tea Cup */}
            <g
              transform="translate(16, 62) scale(0.6)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </g>

            {/* 4. Pizza Slice */}
            <g
              transform="translate(66, 64) scale(0.62)"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 3 17 17a2.83 2.83 0 0 0 3-4L7 3a2.83 2.83 0 0 0-4 0Z" />
              <circle cx="10.5" cy="8.5" r="1.5" />
              <circle cx="15.5" cy="13.5" r="1.5" />
            </g>

            {/* 5. Chef Star / Sparkle */}
            <g transform="translate(46, 42) scale(0.55)" fill="currentColor">
              <path d="M12 0l3 9h9l-7.5 5.5 3 9-7.5-5.5-7.5 5.5 3-9L0 9h9z" opacity="0.8" />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Center Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[var(--dz-theme-surface-raised,rgba(0,0,0,0.02))]/40 to-[var(--dz-theme-surface-raised,rgba(0,0,0,0.05))]" />

      {/* Center Emblem Icon with Frosted Aura */}
      {showIcon && (
        <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 p-2 transition-transform duration-300 group-hover:scale-108">
          <div className="relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[var(--dz-theme-surface,#ffffff)]/85 dark:bg-[var(--dz-theme-surface,#18181b)]/80 backdrop-blur-md shadow-xs border border-[var(--dz-theme-border,rgba(0,0,0,0.08))] text-[var(--dz-theme-accent,var(--dz-theme-primary,currentColor))]">
            <UtensilsCrossed className={iconClassName} strokeWidth={1.75} />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-[var(--dz-theme-accent)] animate-pulse opacity-80" />
          </div>

          {badgeText && (
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-[var(--dz-theme-surface,#ffffff)]/90 dark:bg-black/60 border border-[var(--dz-theme-border,rgba(0,0,0,0.08))] text-[var(--dz-theme-muted,currentColor)] shadow-2xs">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default FoodPatternPlaceholder;
