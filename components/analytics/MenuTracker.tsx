"use client";

import { useEffect, useRef } from "react";
import { getCleanUrlWithoutTracking } from "@/lib/analytics/urls";
import type { DeviceType, MenuVisitSource } from "@/types/analytics";

interface MenuTrackerProps {
  restaurantSlug: string;
}

/**
 * Anonymous Client Session ID generator.
 * Stored in localStorage so a returning customer on the same device maintains their session identifier.
 */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr_placeholder";
  try {
    const key = "dz_analytics_session_id";
    let sid = localStorage.getItem(key);
    if (!sid || sid.length < 10) {
      sid = "sid_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return "sid_ephemeral_" + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Detects device category.
 */
function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "mobile";
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || window.innerWidth < 768) {
    return "mobile";
  }
  return "desktop";
}

export function MenuTracker({ restaurantSlug }: MenuTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || !restaurantSlug || typeof window === "undefined") return;
    hasTracked.current = true;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const rawSrc = (searchParams.get("src") || "").toLowerCase().trim();
      const rawTable = (searchParams.get("table") || "").trim() || null;

      // Validate allowed source
      let source: MenuVisitSource = "direct";
      if (rawSrc === "qr") {
        source = "qr";
      } else if (rawSrc === "share") {
        source = "share";
      }

      const sessionId = getOrCreateSessionId();
      const deviceType = getDeviceType();
      const rawReferrer = typeof document !== "undefined" ? document.referrer || null : null;

      // 1. Non-blocking asynchronous event ingestion
      const payload = {
        restaurantSlug,
        source,
        tableNumber: rawTable,
        sessionId,
        deviceType,
        referrer: rawReferrer ? rawReferrer.substring(0, 500) : null,
      };

      // Use keepalive fetch or sendBeacon for maximum resilience
      fetch("/api/m/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((err) => {
        // Analytics failure must NEVER break user menu experience
        if (process.env.NODE_ENV !== "production") {
          console.debug("[MenuTracker] Non-fatal tracking beacon error:", err);
        }
      });

      // 2. Immediate Address Bar URL Cleansing
      // If ?src=qr or ?src=share or ?table= was present, strip it from the URL bar
      if (rawSrc || rawTable) {
        const cleanRelativeUrl = getCleanUrlWithoutTracking(window.location.href);
        window.history.replaceState(null, "", cleanRelativeUrl);
      }
    } catch (err) {
      // Non-fatal safety guard
      if (process.env.NODE_ENV !== "production") {
        console.debug("[MenuTracker] Client tracker error:", err);
      }
    }
  }, [restaurantSlug]);

  return null;
}
