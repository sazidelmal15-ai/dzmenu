"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useThemePackage } from "@/hooks/useThemePackage";
import { resolveActiveTemplate } from "@/lib/themes/resolution";
import { PlatformSafeFallbackMenu } from "@/components/theme-engine/PlatformSafeFallbackMenu";
import { ThemeLoadingSkeleton } from "@/components/theme-engine/ThemeLoadingSkeleton";
import type {
  MenuPresentationModel,
  ActiveThemeViewState,
  ActiveThemeViewType,
  ThemeRenderContext,
} from "@/types/theme-contract";

export interface ThemeDispatcherProps {
  themeId: string;
  rawSettings?: Record<string, unknown>;
  imageSlots?: Record<string, string | null>;
  menu: MenuPresentationModel;
  activeView?: ActiveThemeViewState;
  onNavigate?: (view: ActiveThemeViewType, id?: string) => void;
  isEditorPreview?: boolean;
}

export function ThemeDispatcher({
  themeId,
  rawSettings = {},
  imageSlots = {},
  menu,
  activeView: controlledActiveView,
  onNavigate: externalOnNavigate,
  isEditorPreview = false,
}: ThemeDispatcherProps) {
  // Internal view state if not controlled externally
  const [internalActiveView, setInternalActiveView] = useState<ActiveThemeViewState>({
    view: "main",
  });

  // Live preview settings state
  const [liveSettings, setLiveSettings] = useState<Record<string, unknown>>(rawSettings);

  useEffect(() => {
    setLiveSettings(rawSettings);
  }, [rawSettings]);

  // Centralized, strictly-validated postMessage listener for editor preview
  useEffect(() => {
    if (!isEditorPreview) return;

    // Send handshake with exact origin (NO wildcard "*")
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ type: "DZMENU_PREVIEW_READY" }, window.location.origin);
    }

    const handleMessage = (event: MessageEvent) => {
      // 1. Strict Origin Validation
      if (typeof window !== "undefined" && event.origin !== window.location.origin) {
        return;
      }

      // 2. Strict Sender Validation
      if (event.source !== window.parent) {
        return;
      }

      // 3. Message Type & Payload Shape Validation
      if (
        event.data?.type === "DZMENU_THEME_PREVIEW_UPDATE" &&
        event.data.settings &&
        typeof event.data.settings === "object"
      ) {
        setLiveSettings(event.data.settings);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isEditorPreview]);

  const activeView = controlledActiveView || internalActiveView;

  // Browser back/forward navigation support for customer menu
  useEffect(() => {
    if (isEditorPreview) return;

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (!state || !state.dzmenuView || state.dzmenuView === "main") {
        setInternalActiveView({ view: "main" });
      } else if (state.dzmenuView === "item") {
        setInternalActiveView({ view: "item", itemId: state.id });
      } else if (state.dzmenuView === "category") {
        setInternalActiveView({ view: "category", categoryId: state.id });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isEditorPreview]);

  const handleNavigate = useCallback(
    (view: ActiveThemeViewType, id?: string) => {
      if (typeof window !== "undefined" && !isEditorPreview) {
        if (view !== "main") {
          window.history.pushState({ dzmenuView: view, id }, "");
        }
      }

      if (externalOnNavigate) {
        externalOnNavigate(view, id);
      } else {
        setInternalActiveView({
          view,
          categoryId: view === "category" ? id : undefined,
          itemId: view === "item" ? id : undefined,
        });
      }
    },
    [externalOnNavigate, isEditorPreview]
  );

  // Load theme package dynamically
  const { themePackage, error, isLoading, retry } = useThemePackage(themeId);

  // Validate settings and generate CSS variables
  const { validatedSettings, cssVariables } = useMemo(() => {
    if (!themePackage) {
      return { validatedSettings: liveSettings, cssVariables: {} };
    }
    try {
      const validated = themePackage.validateSettings(liveSettings);
      const vars = themePackage.generateCssVariables(validated);
      return { validatedSettings: validated, cssVariables: vars };
    } catch (err) {
      console.error("[ThemeDispatcher] Settings validation failed:", err);
      return {
        validatedSettings: themePackage.manifest.defaultSettings,
        cssVariables: themePackage.generateCssVariables(themePackage.manifest.defaultSettings),
      };
    }
  }, [themePackage, liveSettings]);

  // Unconditionally compute live image slots before any early returns (Rules of Hooks)
  const resolvedImageSlots = useMemo(() => {
    const fromSettings = (validatedSettings.image_slots as Record<string, string | null>) || {};
    return { ...imageSlots, ...fromSettings };
  }, [validatedSettings.image_slots, imageSlots]);

  // Loading state
  if (isLoading) {
    return <ThemeLoadingSkeleton />;
  }

  // Error / Fallback state
  if (error || !themePackage) {
    return (
      <PlatformSafeFallbackMenu
        menu={menu}
        error={error}
        onRetry={retry}
        isEditorPreview={isEditorPreview}
      />
    );
  }

  const { manifest, templates } = themePackage;
  const resolution = resolveActiveTemplate(manifest.capabilities, activeView.view);

  const context: ThemeRenderContext = {
    menu,
    settings: validatedSettings,
    imageSlots: resolvedImageSlots,
    activeView,
    navigation: {
      goToSplash: () => handleNavigate("splash"),
      goToMain: () => {
        if (typeof window !== "undefined" && !isEditorPreview && window.history.state?.dzmenuView) {
          window.history.back();
        } else {
          handleNavigate("main");
        }
      },
      goToCategory: (id) => handleNavigate("category", id),
      goToItem: (id) => handleNavigate("item", id),
      closeModal: () => {
        if (typeof window !== "undefined" && !isEditorPreview && window.history.state?.dzmenuView) {
          window.history.back();
        } else {
          handleNavigate("main");
        }
      },
    },
    isEditorPreview,
  };

  const MainComponent = templates.main;
  const TargetComponent = templates[resolution.target] || MainComponent;

  const isOverlayMode =
    (resolution.mode === "bottom_sheet" || resolution.mode === "dialog_modal") &&
    resolution.target !== "main";

  return (
    <div
      className={`dzmenu-theme-root theme-${manifest.id} select-none fixed inset-0 md:static md:inset-auto md:min-h-screen w-full font-[family-name:var(--dz-theme-font-family)] bg-[var(--dz-theme-background)] md:bg-[#0e1013] md:flex md:items-center md:justify-center md:py-6 md:px-4 touch-pan-y`}
      style={{
        ...(cssVariables as React.CSSProperties),
        fontSize: "var(--dz-theme-base-font-size, 16px)",
      }}
      data-theme-id={manifest.id}
      data-presentation-mode={resolution.mode}
      data-active-view={activeView.view}
      data-is-preview={isEditorPreview}
    >
      {/* 
        Simulated Mobile Phone Frame on Desktop Screen:
        - Responsive: On mobile devices (<768px), renders full-width native mobile layout filling the viewport.
        - On desktop (>=768px), renders elegant 430px mobile device mockup with metallic border, dark backdrop, and elevation shadow.
        - Establishes positioning context for absolute overlays (ItemSheet) so they remain strictly contained.
      */}
      <div className="w-full h-full md:h-[92vh] md:max-h-[900px] md:max-w-[430px] mx-auto md:rounded-[36px] md:border-2 md:border-[#4e5564] md:ring-1 md:ring-white/20 md:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(0,0,0,0.5)] overflow-hidden relative bg-[var(--dz-theme-background)] text-[var(--dz-theme-text)] flex flex-col transition-all touch-pan-y">
        {isOverlayMode ? (
          <>
            <MainComponent {...context} />
            <TargetComponent {...context} />
          </>
        ) : resolution.target !== "main" ? (
          <>
            <div className="hidden">
              <MainComponent {...context} />
            </div>
            <TargetComponent {...context} />
          </>
        ) : (
          <TargetComponent {...context} />
        )}
      </div>
    </div>
  );
}
