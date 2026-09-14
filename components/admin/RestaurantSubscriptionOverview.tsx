import React from "react";
import { Calendar, Clock } from "lucide-react";

import type { AdminRestaurantDetail } from "@/lib/db/queries";
import { StatusBadge } from "./StatusBadge";
import { getPlanDefinition } from "@/constants/subscriptions";

interface RestaurantSubscriptionOverviewProps {
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

function getExpiryHelper(expiresAt: Date | null, status: string): { label: string; subtext: string; color: string } {
  if (status === "SUSPENDED") {
    return {
      label: "Access Suspended",
      subtext: "Tenant operations frozen",
      color: "text-rose-600 bg-rose-50 border-rose-200",
    };
  }
  if (!expiresAt) {
    return {
      label: "No Subscription",
      subtext: "Inactive record",
      color: "text-zinc-600 bg-zinc-100 border-zinc-200",
    };
  }

  const now = new Date();
  const diffMs = new Date(expiresAt).getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    const pastDays = Math.abs(diffDays);
    return {
      label: pastDays === 0 ? "Expired Today" : `Expired ${pastDays} days ago`,
      subtext: "Action required to reinstate",
      color: "text-zinc-600 bg-zinc-100 border-zinc-200",
    };
  }

  if (diffDays <= 7) {
    return {
      label: `Expires in ${diffDays} days`,
      subtext: "Grace period approaching",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }

  return {
    label: `Expires in ${diffDays} days`,
    subtext: "Subscription in good standing",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
}

export function RestaurantSubscriptionOverview({
  restaurant,
}: RestaurantSubscriptionOverviewProps) {
  const planDef = restaurant.subscriptionPlan
    ? getPlanDefinition(restaurant.subscriptionPlan)
    : null;
  const expiry = getExpiryHelper(
    restaurant.currentPeriodEnd,
    restaurant.effectiveStatus
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
          Subscription Overview
        </h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${expiry.color}`}
        >
          {expiry.label}
        </span>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3.5 text-xs">
        {/* Row 1: Plan & Status */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-zinc-100">
          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Plan</span>
            <p className="font-semibold text-zinc-900 mt-0.5">
              {planDef?.name || restaurant.subscriptionPlan || "No Plan"}
            </p>
            {planDef && (
              <p className="text-[10px] text-zinc-500 font-mono">
                {planDef.price.toLocaleString()} {planDef.currency}
              </p>
            )}
          </div>

          <div>
            <span className="text-[11px] text-zinc-400 font-medium">Status</span>
            <div className="mt-1">
              <StatusBadge status={restaurant.effectiveStatus} size="sm" />
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-zinc-400 font-medium">Type</span>
            <p className="font-semibold text-zinc-900 mt-0.5">
              {restaurant.isTrial ? "Free Trial" : "Paid Tenant"}
            </p>
          </div>
        </div>

        {/* Row 2: Timeline Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
              <Calendar className="h-3 w-3" />
              <span>Started</span>
            </div>
            <p className="font-semibold text-zinc-900 font-mono mt-0.5">
              {formatDate(restaurant.currentPeriodStart)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
              <Clock className="h-3 w-3" />
              <span>Expires</span>
            </div>
            <p className="font-semibold text-zinc-900 font-mono mt-0.5">
              {formatDate(restaurant.currentPeriodEnd)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
