"use client";

import { useState, useEffect, useCallback } from "react";
import { getStaticThemePackage } from "@/themes/registry";
import type { ThemePackage } from "@/types/theme-contract";

export interface UseThemePackageResult {
  themePackage: ThemePackage | null;
  error: Error | null;
  isLoading: boolean;
  retry: () => void;
}

/**
 * Loads the ThemePackage for a given theme ID with instant synchronous fallback.
 * Falls back to 'gourmet' if themeId is unrecognized.
 */
export function useThemePackage(themeId: string = "gourmet"): UseThemePackageResult {
  const normalizedId = (themeId || "gourmet").toLowerCase();
  const staticPkg = getStaticThemePackage(normalizedId);

  const [themePackage, setThemePackage] = useState<ThemePackage | null>(staticPkg);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!staticPkg);

  const retry = useCallback(() => {
    const pkg = getStaticThemePackage(normalizedId);
    setThemePackage(pkg);
    setError(null);
    setIsLoading(false);
  }, [normalizedId]);

  useEffect(() => {
    const pkg = getStaticThemePackage(normalizedId);
    setThemePackage(pkg);
    setIsLoading(false);
    setError(null);
  }, [normalizedId]);

  return {
    themePackage,
    error,
    isLoading,
    retry,
  };
}
