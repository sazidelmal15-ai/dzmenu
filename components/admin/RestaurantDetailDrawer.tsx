"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, RefreshCw, AlertTriangle } from "lucide-react";
import type { AdminRestaurantDetail } from "@/lib/db/queries";
import type { AdminAuditLog } from "@/types/audit";
import { getRestaurantDrawerDataAction } from "@/lib/admin/actions";
import { RestaurantDetailSkeleton } from "./RestaurantDetailSkeleton";
import { RestaurantDetailHeader } from "./RestaurantDetailHeader";
import { RestaurantSubscriptionOverview } from "./RestaurantSubscriptionOverview";
import { RestaurantLifecycleActions } from "./RestaurantLifecycleActions";
import { RestaurantActivityFeed } from "./RestaurantActivityFeed";

interface RestaurantDetailDrawerProps {
  restaurantId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRestaurantUpdated?: () => void;
}

export function RestaurantDetailDrawer({
  restaurantId,
  isOpen,
  onClose,
  onRestaurantUpdated,
}: RestaurantDetailDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminRestaurantDetail | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminAuditLog[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const fetchDrawerData = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRestaurantDrawerDataAction(id);
      if (res.success && res.data) {
        setDetail(res.data.restaurant);
        setRecentActivity(res.data.recentActivity);
      } else {
        setError(res.error || "Unable to load restaurant details");
      }
    } catch {
      setError("An unexpected error occurred while loading details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchDrawerData(restaurantId);
    } else if (!isOpen) {
      setDetail(null);
      setRecentActivity([]);
      setError(null);
    }
  }, [isOpen, restaurantId, fetchDrawerData]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyId = () => {
    if (!detail) return;
    navigator.clipboard.writeText(detail.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleActionSuccess = () => {
    if (restaurantId) {
      fetchDrawerData(restaurantId);
    }
    onRestaurantUpdated?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Restaurant Tenant Details"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg sm:max-w-xl bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Top Operational Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200/80 bg-zinc-50/75 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Tenant Overview
            </span>
            {detail && (
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 transition"
                title="Copy Restaurant ID"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>{detail.id.slice(0, 8)}...</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {detail && !isLoading && (
              <button
                type="button"
                onClick={() => restaurantId && fetchDrawerData(restaurantId)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-md transition"
                title="Refresh details"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-md transition"
              title="Close drawer (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body with Internal Scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading && <RestaurantDetailSkeleton />}

          {!isLoading && error && (
            <div className="p-8 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Failed to load tenant details
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">{error}</p>
              <button
                type="button"
                onClick={() => restaurantId && fetchDrawerData(restaurantId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {!isLoading && !error && detail && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* 1. Header with Identity & Catalog Stats */}
              <RestaurantDetailHeader restaurant={detail} />

              {/* 2. Subscription Overview Box */}
              <RestaurantSubscriptionOverview restaurant={detail} />

              {/* 3. Lifecycle Operational Actions */}
              <RestaurantLifecycleActions
                restaurant={detail}
                onActionSuccess={handleActionSuccess}
              />

              {/* 4. Recent Activity from Audit Trail */}
              <RestaurantActivityFeed activity={recentActivity} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
