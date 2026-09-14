import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { PlatformKpiStats } from "@/lib/db/queries";

interface SearchFilterFoundationProps {
  stats?: PlatformKpiStats;
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  disabled?: boolean;
}

export function SearchFilterFoundation({
  stats,
  selectedFilter = "ALL",
  disabled = false,
}: SearchFilterFoundationProps) {
  const filterChips = [
    { id: "ALL", label: "All Tenants", count: stats?.totalRestaurants },
    { id: "ACTIVE", label: "Active", count: stats?.activeCount, dot: "bg-emerald-500" },
    { id: "TRIAL", label: "Trial", count: stats?.trialCount, dot: "bg-amber-500" },
    { id: "SUSPENDED", label: "Suspended", count: stats?.suspendedCount, dot: "bg-rose-500" },
    { id: "EXPIRED", label: "Expired", count: stats?.expiredCount, dot: "bg-zinc-400" },
  ];

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-3 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search restaurants by name, slug, or owner email..."
            disabled={disabled}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition"
          />
        </div>

        {/* Filter Trigger / Export Placeholder */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        {filterChips.map((chip) => {
          const isSelected = selectedFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap border ${
                isSelected
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
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
  );
}
