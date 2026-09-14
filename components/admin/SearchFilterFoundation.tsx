"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { PlatformKpiStats } from "@/lib/db/queries";
import { QuickSearchModal } from "./QuickSearchModal";

interface SearchFilterFoundationProps {
  stats?: PlatformKpiStats;
  auditCount?: number;
  initialFilter?: string;
}

export function SearchFilterFoundation({
  stats,
  auditCount,
  initialFilter,
}: SearchFilterFoundationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeStatus = searchParams.get("status")?.toUpperCase() || initialFilter || "ALL";
  const currentSearch = searchParams.get("q") || "";

  const filterChips = [
    { id: "ALL", label: "All Tenants", count: stats?.totalRestaurants },
    { id: "ACTIVE", label: "Active", count: stats?.activeCount, dot: "bg-emerald-500" },
    { id: "TRIAL", label: "Trial", count: stats?.trialCount, dot: "bg-amber-500" },
    { id: "SUSPENDED", label: "Suspended", count: stats?.suspendedCount, dot: "bg-rose-500" },
    { id: "EXPIRED", label: "Expired", count: stats?.expiredCount, dot: "bg-zinc-400" },
  ];

  const handleFilterClick = (filterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filterId === "ALL") {
      params.delete("status");
    } else {
      params.set("status", filterId);
    }
    
    // If currently on /admin overview, filter takes user directly to /admin/restaurants?status=...
    const targetPath = pathname === "/admin" ? "/admin/restaurants" : pathname;
    const queryString = params.toString();
    router.push(queryString ? `${targetPath}?${queryString}` : targetPath);
  };

  return (
    <>
      <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Trigger Input */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="relative flex-1 cursor-pointer group"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-hover:text-zinc-600 transition">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              readOnly
              value={currentSearch}
              placeholder="Search restaurants by name, slug, or owner (Click or press ⌘K)..."
              className="w-full pl-9 pr-16 py-2 text-xs sm:text-sm bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 cursor-pointer focus:outline-none transition"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Quick Clear Filter if active */}
          {activeStatus !== "ALL" && (
            <button
              type="button"
              onClick={() => handleFilterClick("ALL")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        {/* Filter Chips Bar with Functional URL State */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {filterChips.map((chip) => {
            const isSelected = activeStatus === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleFilterClick(chip.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap border cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200/70 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {chip.dot && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${chip.dot}`}
                    aria-hidden="true"
                  />
                )}
                <span>{chip.label}</span>
                {chip.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isSelected
                        ? "bg-zinc-800 text-zinc-200"
                        : "bg-zinc-200/80 text-zinc-600"
                    }`}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Search Modal */}
      <QuickSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        totalRestaurants={stats?.totalRestaurants}
        auditCount={auditCount}
      />
    </>
  );
}
