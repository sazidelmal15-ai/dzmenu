/**
 * DZMenu Theme System V2 — Preview Protocol
 *
 * Defines the cross-window / iframe postMessage communication protocol
 * between the Theme Customizer editor parent window and the live preview iframe.
 */

import type { ActiveThemeViewType } from "./theme-contract";

export const PREVIEW_MESSAGE_TYPES = {
  THEME_UPDATE: "DZMENU_THEME_PREVIEW_UPDATE",
  PREVIEW_READY: "DZMENU_PREVIEW_READY",
  NAVIGATE: "DZMENU_PREVIEW_NAVIGATE",
} as const;

export interface PreviewViewContext {
  activeView: ActiveThemeViewType;
  activeCategoryId?: string;
  activeItemId?: string;
}

/**
 * Sent from ThemeEditorClient (parent) to Preview Iframe (child)
 * to push real-time draft settings and active view updates without database saving.
 */
export interface PreviewUpdateMessage {
  type: typeof PREVIEW_MESSAGE_TYPES.THEME_UPDATE;
  themeId: string;
  settings: Record<string, unknown>;
  imageSlots: Record<string, string | null>;
  viewContext?: PreviewViewContext;
}

/**
 * Sent from Preview Iframe (child) to ThemeEditorClient (parent)
 * when the iframe finishes mounting and is ready to receive postMessage events.
 */
export interface PreviewReadyMessage {
  type: typeof PREVIEW_MESSAGE_TYPES.PREVIEW_READY;
}

/**
 * Sent in either direction when navigating between views inside the preview.
 */
export interface PreviewNavigateMessage {
  type: typeof PREVIEW_MESSAGE_TYPES.NAVIGATE;
  viewContext: PreviewViewContext;
}

export type PreviewBridgeMessage =
  | PreviewUpdateMessage
  | PreviewReadyMessage
  | PreviewNavigateMessage;

/**
 * Type guard for preview bridge messages.
 */
export function isPreviewBridgeMessage(data: unknown): data is PreviewBridgeMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as { type?: unknown };
  return (
    msg.type === PREVIEW_MESSAGE_TYPES.THEME_UPDATE ||
    msg.type === PREVIEW_MESSAGE_TYPES.PREVIEW_READY ||
    msg.type === PREVIEW_MESSAGE_TYPES.NAVIGATE
  );
}
