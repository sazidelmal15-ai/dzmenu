"use client";

import React, { useState } from "react";
import {
  Store,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Globe,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Restaurant } from "@/types/restaurant";

interface RestaurantMaintenanceScreenProps {
  restaurant: Restaurant;
  isOwner?: boolean;
}

export function RestaurantMaintenanceScreen({
  restaurant,
  isOwner = false,
}: RestaurantMaintenanceScreenProps) {
  const [activating, setActivating] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  const handleActivate = async () => {
    try {
      setActivating(true);
      const res = await fetch("/api/restaurant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (res.ok) {
        setActivatedSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to activate restaurant:", err);
    } finally {
      setActivating(false);
    }
  };

  const mapsUrl =
    restaurant.googleMapsUrl ||
    (restaurant.address || restaurant.city
      ? `https://maps.google.com/?q=${encodeURIComponent(
          [restaurant.address, restaurant.city].filter(Boolean).join(", ")
        )}`
      : null);

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0E1015] text-white selection:bg-amber-500 selection:text-white font-sans overflow-hidden">
      {/* 1. Ambient Background Layer */}
      {restaurant.coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-3xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${restaurant.coverUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/25 via-[#13161C] to-[#0E1015] pointer-events-none" />
      )}

      {/* Decorative subtle ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 2. Owner Top Warning & Quick-Live Bar */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mb-4 z-20"
        >
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle size={17} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-200">
                  Owner Preview Mode
                </p>
                <p className="text-[11px] text-amber-300/70">
                  Your menu is currently paused for visitors.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href={`/m/${restaurant.slug}?preview_live=true`}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
              >
                <Eye size={13} />
                <span>Preview</span>
              </a>

              <button
                type="button"
                onClick={handleActivate}
                disabled={activating || activatedSuccess}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-950/40 transition active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {activating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : activatedSuccess ? (
                  <CheckCircle2 size={13} className="text-white" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>{activatedSuccess ? "Online!" : "Turn Online"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Main Luxury Maintenance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 rounded-[32px] p-6 sm:p-8 bg-[#151821]/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 flex flex-col items-center text-center"
      >
        {/* Restaurant Logo with glowing gold halo */}
        <div className="relative mb-5">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 opacity-40 blur-md" />
          {restaurant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
            />
          ) : (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center text-3xl font-black border-2 border-white/20 shadow-xl">
              {restaurant.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-3 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Menu Temporarily Paused</span>
        </div>

        {/* Restaurant Title & Tagline */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
          {restaurant.name}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-xs mb-6">
          {restaurant.tagline ||
            restaurant.description ||
            "Artisan Dining & Handcrafted Dishes"}
        </p>

        {/* Friendly Announcement Box */}
        <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 font-normal">
          <p>
            We are currently updating our digital menu to serve you better.
            Please check back shortly or connect with us directly below!
          </p>
        </div>

        {/* Location & Directions Button */}
        {(restaurant.address || restaurant.city || mapsUrl) && (
          <div className="w-full mb-5">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-2.5">
              <MapPin size={13} className="text-amber-400" />
              <span>
                {[restaurant.address, restaurant.city].filter(Boolean).join(", ") ||
                  "Algiers, Algeria"}
              </span>
            </div>

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98"
              >
                <Navigation size={14} className="text-amber-400" />
                <span>Get Directions on Map</span>
              </a>
            )}
          </div>
        )}

        {/* Direct Contact Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap w-full pt-1 border-t border-white/10">
          {/* Phone */}
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              aria-label="Call Restaurant"
              className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400 transition-transform active:scale-95 shadow-xs"
            >
              <Phone size={18} />
            </a>
          )}

          {/* WhatsApp */}
          {restaurant.whatsapp && (
            <a
              href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#25D366] transition-transform active:scale-95 shadow-xs"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
          )}

          {/* Instagram */}
          {restaurant.instagramUrl && (
            <a
              href={
                restaurant.instagramUrl.startsWith("http")
                  ? restaurant.instagramUrl
                  : `https://instagram.com/${restaurant.instagramUrl.replace("@", "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#E1306C] transition-transform active:scale-95 shadow-xs"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          )}

          {/* TikTok */}
          {restaurant.tiktokUrl && (
            <a
              href={
                restaurant.tiktokUrl.startsWith("http")
                  ? restaurant.tiktokUrl
                  : `https://tiktok.com/@${restaurant.tiktokUrl.replace("@", "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-transform active:scale-95 shadow-xs"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          )}

          {/* Facebook */}
          {restaurant.facebookUrl && (
            <a
              href={
                restaurant.facebookUrl.startsWith("http")
                  ? restaurant.facebookUrl
                  : `https://facebook.com/${restaurant.facebookUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-[#1877F2] transition-transform active:scale-95 shadow-xs"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          )}
        </div>
      </motion.div>

      {/* Powered by DZMenu Footer */}
      <p className="mt-8 text-xs text-gray-500 font-medium z-10">
        Powered by{" "}
        <span className="text-amber-400 font-bold">DZMenu</span> • Digital QR
        Experience
      </p>
    </div>
  );
}
