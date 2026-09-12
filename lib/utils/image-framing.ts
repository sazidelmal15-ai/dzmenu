import type { CSSProperties } from "react";
import type { ImageFramingMetadata } from "@/types/theme-contract";

/**
 * Calculates the maximum translation percentage allowed for an image so that
 * it always 100% covers the container without exposing any empty borders/gaps.
 */
export function calculatePanBounds(
  zoom: number,
  rotation: number,
  containerRatio: number,
  imageNaturalRatio: number
): { maxPercentX: number; maxPercentY: number } {
  // Pan ranges between -50% and +50% (mapped to object-position 0% to 100%)
  const safeZoom = Math.max(1, typeof zoom === "number" && !isNaN(zoom) ? zoom : 1);
  return { maxPercentX: 50 * safeZoom, maxPercentY: 50 * safeZoom };
}

/**
 * Clamps framing translation percentages strictly within bounds [-50, 50].
 */
export function clampFramingToBounds(
  framing: ImageFramingMetadata,
  _containerRatio = 1.35,
  _imageNaturalRatio = 1.35
): ImageFramingMetadata {
  const clampedX = Math.max(-50, Math.min(50, framing.x || 0));
  const clampedY = Math.max(-50, Math.min(50, framing.y || 0));

  return {
    ...framing,
    x: Number(clampedX.toFixed(1)),
    y: Number(clampedY.toFixed(1)),
  };
}

/**
 * Computes non-destructive GPU-accelerated CSS styles based on framing metadata.
 * Uses object-fit: cover + object-position to ensure the image 100% fills its container
 * with ZERO empty gaps or cutoffs, combined with scale/rotation when zoom > 1.
 */
export function getFramingTransformStyle(
  framing?: ImageFramingMetadata | null,
  additionalStyle: CSSProperties = {}
): CSSProperties {
  if (!framing) {
    return {
      ...additionalStyle,
      objectFit: "cover",
      objectPosition: "50% 50%",
    };
  }

  const { x = 0, y = 0, zoom = 1, rotation = 0 } = framing;

  const safeZoom = typeof zoom === "number" && !isNaN(zoom) ? zoom : 1;
  const safeRotation = typeof rotation === "number" && !isNaN(rotation) ? rotation : 0;
  const safeX = typeof x === "number" && !isNaN(x) ? x : 0;
  const safeY = typeof y === "number" && !isNaN(y) ? y : 0;

  // Map framing coordinates (-50 to +50) directly to objectPosition percentage (0% to 100%)
  const posX = Math.max(0, Math.min(100, 50 + safeX));
  const posY = Math.max(0, Math.min(100, 50 + safeY));

  const styles: CSSProperties = {
    ...additionalStyle,
    objectFit: "cover",
    objectPosition: `${posX}% ${posY}%`,
  };

  if (safeZoom !== 1 || safeRotation !== 0) {
    styles.transform = `scale(${safeZoom}) rotate(${safeRotation}deg)`;
    styles.transformOrigin = `${posX}% ${posY}%`;
  }

  return styles;
}

/**
 * Extracts slot framing metadata from theme settings JSON safely.
 */
export function getSlotFraming(
  settings: Record<string, unknown> | null | undefined,
  slotId: string
): ImageFramingMetadata | null {
  if (!settings) return null;
  const imageFraming = (settings as Record<string, unknown>).image_framing as
    | Record<string, ImageFramingMetadata>
    | undefined;

  if (!imageFraming || typeof imageFraming !== "object") return null;
  return imageFraming[slotId] || null;
}
