import type { MenuVisitSource } from "@/types/analytics";

/**
 * Constructs a standardized, tracked restaurant menu URL.
 * Used across QR generation, table stands, and in-app sharing buttons.
 */
export function buildTrackedMenuUrl(options: {
  baseUrl?: string;
  slug?: string;
  source?: MenuVisitSource;
  table?: string | null;
  additionalParams?: Record<string, string>;
}): string {
  let base = options.baseUrl;

  if (!base) {
    if (typeof window !== "undefined") {
      base = window.location.origin + window.location.pathname;
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      base = options.slug ? `${appUrl}/m/${options.slug}` : appUrl;
    }
  }

  try {
    const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    if (options.source && options.source !== "direct") {
      url.searchParams.set("src", options.source);
    } else {
      url.searchParams.delete("src");
    }

    if (options.table && options.table.trim()) {
      url.searchParams.set("table", options.table.trim());
    } else {
      url.searchParams.delete("table");
    }

    if (options.additionalParams) {
      Object.entries(options.additionalParams).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
      });
    }

    return url.toString();
  } catch {
    return base;
  }
}

/**
 * Strips tracking parameters (src, table, utm_*) from the current URL for clean display in browser history.
 * Preserves other functional query parameters (e.g., preview_theme, preview_live).
 */
export function getCleanUrlWithoutTracking(currentUrl: string): string {
  try {
    const url = new URL(currentUrl, "http://localhost:3000");
    url.searchParams.delete("src");
    url.searchParams.delete("table");
    
    // Remove standard UTM parameters if present
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    utmKeys.forEach((k) => url.searchParams.delete(k));

    // Return relative path + remaining search params or root
    const search = url.searchParams.toString();
    return url.pathname + (search ? `?${search}` : "") + url.hash;
  } catch {
    return "/";
  }
}
