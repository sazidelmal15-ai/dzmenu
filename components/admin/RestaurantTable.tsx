import React from "react";
import Link from "next/link";
import { Store, RotateCcw } from "lucide-react";
import type { AdminRestaurantRow } from "@/lib/db/queries";
import { StatusBadge } from "./StatusBadge";
import { RestaurantTableActions } from "./RestaurantTableActions";
import { getPlanDefinition } from "@/constants/subscriptions";

interface RestaurantTableProps {
  restaurants: AdminRestaurantRow[];
  isFiltered?: boolean;
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

function getExpiryHelper(expiresAt: Date | null, status: string): { label: string; color: string } {
  if (status === "SUSPENDED") {
    return { label: "Suspended", color: "text-rose-600" };
  }
  if (!expiresAt) {
    return { label: "No subscription", color: "text-zinc-400" };
  }

  const now = new Date();
  const diffMs = new Date(expiresAt).getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    const pastDays = Math.abs(diffDays);
    return {
      label: pastDays === 0 ? "Expired today" : `Expired ${pastDays}d ago`,
      color: "text-zinc-400",
    };
  }

  if (diffDays <= 7) {
    return { label: `${diffDays}d remaining`, color: "text-amber-600 font-semibold" };
  }

  return { label: `${diffDays}d remaining`, color: "text-emerald-600" };
}

function getPlanLabel(planKey: string | null): string {
  if (!planKey) return "No Plan";
  const def = getPlanDefinition(planKey);
  if (def) return def.name;
  
  // Clean format fallback
  const clean = planKey.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function RestaurantTable({
  restaurants,
  isFiltered = false,
}: RestaurantTableProps) {
  if (restaurants.length === 0) {
    return (
      <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center my-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200/80 mb-3 text-zinc-400">
          <Store className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
          {isFiltered ? "No matching restaurants found" : "No restaurants yet"}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-sm leading-relaxed">
          {isFiltered
            ? "No restaurant tenants match your current search, status, or plan filters."
            : "No tenant restaurants have registered on the platform yet."}
        </p>
        {isFiltered && (
          <div className="mt-4">
            <Link
              href="/admin/restaurants"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Search & Filters</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/75">
              <th
                scope="col"
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Restaurant
              </th>
              <th
                scope="col"
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Owner
              </th>
              <th
                scope="col"
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Plan
              </th>
              <th
                scope="col"
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Subscription Expiry
              </th>
              <th
                scope="col"
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Created
              </th>
              <th
                scope="col"
                className="py-3 px-4 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {restaurants.map((restaurant) => {
              const expiryMeta = getExpiryHelper(
                restaurant.subscriptionExpiresAt,
                restaurant.effectiveStatus
              );
              const planName = getPlanLabel(restaurant.subscriptionPlan);
              const initials = restaurant.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <tr
                  key={restaurant.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  {/* 1. Restaurant Name & Slug */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar / Monogram */}
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200/80 text-zinc-700 font-bold text-xs flex-shrink-0 group-hover:border-zinc-300 transition">
                        {initials || <Store className="h-4 w-4 text-zinc-400" />}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900 truncate tracking-tight text-xs sm:text-sm">
                          {restaurant.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[11px] text-zinc-400 font-mono">
                            /{restaurant.slug}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Owner Information */}
                  <td className="py-3.5 px-4">
                    {restaurant.ownerEmail ? (
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-800 truncate">
                          {restaurant.ownerName || "Tenant Owner"}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">
                          {restaurant.ownerEmail}
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-400 font-mono text-xs">—</span>
                    )}
                  </td>

                  {/* 3. Lifecycle Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={restaurant.effectiveStatus} size="sm" />
                  </td>

                  {/* 4. Plan Identity */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/70">
                      {planName}
                    </span>
                  </td>

                  {/* 5. Subscription Expiry */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      <div className="font-mono text-xs text-zinc-800">
                        {formatDate(restaurant.subscriptionExpiresAt)}
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${expiryMeta.color}`}>
                        {expiryMeta.label}
                      </div>
                    </div>
                  </td>

                  {/* 6. Created Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-zinc-500">
                    {formatDate(restaurant.createdAt)}
                  </td>

                  {/* 7. Quick Lifecycle Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <RestaurantTableActions restaurant={restaurant} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
