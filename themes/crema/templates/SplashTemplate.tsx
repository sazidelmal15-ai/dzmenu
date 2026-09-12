"use client";

import React, { useEffect } from "react";
import { Heart } from "lucide-react";
import type { ThemeRenderContext } from "@/types/theme-contract";

export function CremaSplashTemplate({
  menu,
  settings,
  imageSlots,
  navigation,
  isEditorPreview = false,
}: ThemeRenderContext) {
  const splash = (settings.splash as Record<string, unknown>) || {};
  const splashTitle = (splash.title as string) || "Sweet Moments";
  const splashSubtitle = (splash.subtitle as string) || "DESSERTS & CAFÉ";
  const autoDismissSec = typeof splash.auto_dismiss_seconds === "number" ? splash.auto_dismiss_seconds : 2.5;

  // Auto-dismiss after timeout (disabled if in editor preview)
  useEffect(() => {
    if (isEditorPreview) return;
    const timer = setTimeout(() => {
      navigation.goToMain();
    }, autoDismissSec * 1000);
    return () => clearTimeout(timer);
  }, [autoDismissSec, isEditorPreview, navigation]);

  const handleEnter = () => {
    navigation.goToMain();
  };

  // Background uploaded by the client in menu customization & Smart Logo Fallback
  const customBackground = imageSlots.splash_background;
  const activeLogo = imageSlots.logo || menu.restaurant.logoUrl;

  return (
    <div
      onClick={handleEnter}
      className="w-full h-full flex-1 flex flex-col items-center justify-center relative select-none cursor-pointer overflow-hidden transition-opacity duration-700 bg-[var(--dz-theme-background,#FFF6F8)] text-white"
    >
      {/* 1. Client-Uploaded Background or Elegant Palette Gradient */}
      {customBackground ? (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customBackground}
            alt="Splash Background"
            className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/45" />
          <div className="absolute inset-0 bg-[var(--dz-theme-accent)]/10 mix-blend-color" />
        </div>
      ) : (
        /* Soft Artisan Fallback Gradient when no image is uploaded */
        <div
          className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          style={{
            background:
              "linear-gradient(to bottom, var(--dz-theme-splash-from), var(--dz-theme-splash-via), var(--dz-theme-splash-to))",
          }}
        >
          <div
            className="absolute w-[450px] h-[450px] rounded-full blur-3xl -top-20 -left-20 animate-pulse"
            style={{ backgroundColor: "var(--dz-theme-splash-glow1)" }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full blur-3xl -bottom-10 -right-10"
            style={{ backgroundColor: "var(--dz-theme-splash-glow2)" }}
          />
          {/* Subtle floral/polka pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(var(--dz-theme-primary) 1.5px, transparent 1.5px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>
      )}

      {/* 2. Centered Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 text-center max-w-sm">
        {/* Store Logo or Heart Emblem */}
        <div className="mb-4 relative group">
          {activeLogo ? (
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 backdrop-blur-md shadow-xl ring-2 flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                borderColor: "var(--dz-theme-border)",
                boxShadow: "0 10px 25px var(--dz-theme-border)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeLogo}
                alt={menu.restaurant.name}
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full backdrop-blur-md border flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
              style={{
                backgroundColor: "var(--dz-theme-surface-raised)",
                borderColor: "var(--dz-theme-border)",
                boxShadow: "0 8px 25px var(--dz-theme-border)",
              }}
            >
              <Heart
                className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm animate-pulse"
                style={{
                  color: customBackground ? "#FFFFFF" : "var(--dz-theme-primary)",
                  fill: customBackground ? "#FFFFFF" : "var(--dz-theme-primary)",
                }}
              />
            </div>
          )}
        </div>

        {/* Small Heart Icon directly above title */}
        {activeLogo && (
          <div className="mb-2">
            <Heart
              className="w-3.5 h-3.5 mx-auto opacity-90"
              style={{
                color: customBackground ? "#FFFFFF" : "var(--dz-theme-primary)",
                fill: customBackground ? "#FFFFFF" : "var(--dz-theme-primary)",
              }}
            />
          </div>
        )}

        {/* Customizable Title (Default: Sweet Moments) */}
        <h1
          className="text-3xl sm:text-4xl font-serif italic font-normal tracking-wide drop-shadow-md"
          style={{
            color: customBackground ? "#FFFFFF" : "var(--dz-theme-text)",
            fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
          }}
        >
          {splashTitle}
        </h1>

        {/* Customizable Subtitle (Default: DESSERTS & CAFÉ) */}
        <p
          className="text-[10px] sm:text-xs font-semibold tracking-[0.32em] uppercase mt-2 drop-shadow-sm"
          style={{
            color: customBackground ? "rgba(255, 255, 255, 0.9)" : "var(--dz-theme-muted)",
          }}
        >
          {splashSubtitle}
        </p>

        {/* Progress Bar / Tap Indicator */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <div
            className="w-24 h-1 rounded-full overflow-hidden"
            style={{
              backgroundColor: customBackground ? "rgba(255, 255, 255, 0.25)" : "var(--dz-theme-surface-raised)",
            }}
          >
            <div
              className="w-full h-full rounded-full animate-[loading_2.5s_ease-in-out_infinite]"
              style={{ backgroundColor: "var(--dz-theme-primary)" }}
            />
          </div>
          <span
            className="text-[10px] tracking-wider uppercase font-medium opacity-75"
            style={{
              color: customBackground ? "rgba(255, 255, 255, 0.85)" : "var(--dz-theme-muted)",
            }}
          >
            Tap to enter
          </span>
        </div>
      </div>
    </div>
  );
}
