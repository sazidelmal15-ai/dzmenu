import React from "react";
import Link from "next/link";
import {
  Store,
  ExternalLink,
  User,
  Calendar,
  Layers,
} from "lucide-react";
import type { AdminRestaurantDetail } from "@/lib/db/queries";
import { StatusBadge } from "./StatusBadge";
import { getPlanDefinition } from "@/constants/subscriptions";

interface RestaurantDetailHeaderProps {
  restaurant: AdminRestaurantDetail;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getPlanLabel(planKey: string | null): string {
  if (!planKey) return "No Plan";
  const def = getPlanDefinition(planKey);
  if (def) return def.name;
  const clean = planKey.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function RestaurantDetailHeader({ restaurant }: RestaurantDetailHeaderProps) {
  const planName = getPlanLabel(restaurant.subscriptionPlan);
  const initials = restaurant.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4 pb-4 border-b border-zinc-100">
      {/* Top Banner & Main Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar Monogram */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold text-sm flex-shrink-0 shadow-xs">
            {initials || <Store className="h-6 w-6 text-zinc-400" />}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight truncate">
              {restaurant.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono text-zinc-500">
                /{restaurant.slug}
              </span>
              <Link
                href={`/m/${restaurant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 transition font-medium"
                title="Open public digital menu in new tab"
              >
                <span>Preview</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StatusBadge status={restaurant.effectiveStatus} size="sm" />
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
            {planName}
          </span>
        </div>
      </div>

      {/* Meta Grid: Owner & Catalog Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        {/* Owner */}
        <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 space-y-0.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
            <User className="h-3 w-3" />
            <span>Owner</span>
          </div>
          <p className="font-semibold text-zinc-900 truncate">
            {restaurant.ownerName || "Tenant Owner"}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono truncate">
            {restaurant.ownerEmail || "—"}
          </p>
        </div>

        {/* Catalog Scale */}
        <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 space-y-0.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
            <Layers className="h-3 w-3" />
            <span>Menu Content</span>
          </div>
          <p className="font-semibold text-zinc-900 font-mono">
            {restaurant.totalCategories} Categories
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            {restaurant.totalMenuItems} Menu Items
          </p>
        </div>

        {/* Registered */}
        <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/70 space-y-0.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
            <Calendar className="h-3 w-3" />
            <span>Created</span>
          </div>
          <p className="font-semibold text-zinc-900 font-mono">
            {formatDate(restaurant.createdAt)}
          </p>
          <p className="text-[11px] text-zinc-500 truncate">
            {restaurant.city || "Algeria"}
          </p>
        </div>
      </div>
    </div>
  );
}
