"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import type { PlatformKpiStats } from "@/lib/db/queries";
import { QuickSearchModal } from "./QuickSearchModal";

interface RestaurantTableToolbarProps {
  stats?: PlatformKpiStats;
  totalFiltered?: number;
}

export function RestaurantTableToolbar({
  stats,
}: RestaurantTableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL state
  const qParam = searchParams.get("q") || "";
  const statusParam = searchParams.get("status")?.toUpperCase() || "ALL";
  const planParam = searchParams.get("plan")?.toUpperCase() || "ALL";
  const sortParam = searchParams.get("sort") || "created";
  const orderParam = searchParams.get("order")?.toLowerCase() || "desc";
  const pageSizeParam = searchParams.get("pageSize") || "10";

  const [searchInput, setSearchInput] = useState(qParam);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  const updateQuery = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [searchParams, pathname, router]);

  // Sync search input when URL changes (e.g. back/forward navigation)
  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  // Debounced search input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== qParam) {
        updateQuery({ q: searchInput ? searchInput : null, page: null });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, qParam, updateQuery]);


  const statusOptions = [
    { id: "ALL", label: "All Statuses", count: stats?.totalRestaurants },
    { id: "ACTIVE", label: "Active", count: stats?.activeCount, dot: "bg-emerald-500" },
    { id: "TRIAL", label: "Trial", count: stats?.trialCount, dot: "bg-amber-500" },
    { id: "SUSPENDED", label: "Suspended", count: stats?.suspendedCount, dot: "bg-rose-500" },
    { id: "EXPIRED", label: "Expired", count: stats?.expiredCount, dot: "bg-zinc-400" },
  ];

  // Distinct plan identities from registry
  const planOptions = [
    { id: "ALL", label: "All Plans" },
    { id: "STANDARD", label: "Standard" },
    { id: "ECONOMY", label: "Economy" },
    { id: "HIGH", label: "High / Enterprise" },
    { id: "PRO", label: "Pro" },
    { id: "TRIAL", label: "Trial" },
  ];

  const sortOptions = [
    { id: "created-desc", label: "Newest Created", sort: "created", order: "desc" },
    { id: "created-asc", label: "Oldest Created", sort: "created", order: "asc" },
    { id: "name-asc", label: "Name (A → Z)", sort: "name", order: "asc" },
    { id: "name-desc", label: "Name (Z → A)", sort: "name", order: "desc" },
    { id: "expiry-asc", label: "Expiry (Soonest)", sort: "expiry", order: "asc" },
    { id: "expiry-desc", label: "Expiry (Furthest)", sort: "expiry", order: "desc" },
    { id: "status-asc", label: "Status Priority", sort: "status", order: "asc" },
  ];

  const currentSortComposite = `${sortParam}-${orderParam}`;
  const isFiltered =
    qParam !== "" ||
    statusParam !== "ALL" ||
    planParam !== "ALL" ||
    sortParam !== "created" ||
    orderParam !== "desc";

  const handleResetFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-3 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
      {/* Top row: Search input + Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by restaurant name, slug, or owner (Press ⌘K)..."
            className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200 focus:border-zinc-900 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none transition"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateQuery({ q: null, page: null });
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsQuickSearchOpen(true)}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-700 bg-white border border-zinc-200 transition"
              title="Open Command Palette"
            >
              ⌘K
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Sorters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Filter */}
          <div className="relative">
            <select
              aria-label="Filter by subscription plan"
              value={planParam}
              onChange={(e) => updateQuery({ plan: e.target.value, page: null })}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg text-zinc-800 cursor-pointer focus:outline-none focus:border-zinc-900 transition"
            >
              {planOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-zinc-400" />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              aria-label="Sort table rows"
              value={currentSortComposite}
              onChange={(e) => {
                const selected = sortOptions.find((s) => s.id === e.target.value);
                if (selected) {
                  updateQuery({ sort: selected.sort, order: selected.order, page: null });
                }
              }}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg text-zinc-800 cursor-pointer focus:outline-none focus:border-zinc-900 transition"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-zinc-400" />
          </div>

          {/* Page Size Selector */}
          <div className="relative">
            <select
              aria-label="Items per page"
              value={pageSizeParam}
              onChange={(e) => updateQuery({ pageSize: e.target.value, page: null })}
              className="appearance-none pl-3 pr-7 py-2 text-xs font-medium bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 rounded-lg text-zinc-800 cursor-pointer focus:outline-none focus:border-zinc-900 transition"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-zinc-400" />
          </div>

          {/* Reset All Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
              title="Reset all search queries, status filters, plan filters, and custom sorting"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}

          {isPending && (
            <div className="flex items-center text-zinc-400 pl-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-zinc-100">
        {statusOptions.map((chip) => {
          const isSelected = statusParam === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => updateQuery({ status: chip.id, page: null })}
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

      {/* Command Palette Modal */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        totalRestaurants={stats?.totalRestaurants}
      />
    </div>
  );
}
