"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  Calendar,
  Filter,
  User,
  Store,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { getAllAuditActionDefinitions } from "@/constants/audit";
import type { AuditDateRangePreset } from "@/types/audit";

interface AuditFiltersProps {
  totalCount: number;
}

export function AuditFilters({ totalCount }: AuditFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read URL search parameters
  const qParam = searchParams.get("q") || "";
  const actionParam = searchParams.get("action")?.toUpperCase() || "ALL";
  const restaurantParam = searchParams.get("restaurant") || "";
  const actorParam = searchParams.get("actor") || "";
  const dateParam = (searchParams.get("date")?.toLowerCase() || "all") as AuditDateRangePreset;
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";
  const pageSizeParam = searchParams.get("pageSize") || "25";

  // Local state for debounced search and inputs
  const [searchInput, setSearchInput] = useState(qParam);
  const [restaurantInput, setRestaurantInput] = useState(restaurantParam);
  const [actorInput, setActorInput] = useState(actorParam);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(dateParam === "custom");
  const [customFrom, setCustomFrom] = useState(fromParam);
  const [customTo, setCustomTo] = useState(toParam);

  const actions = getAllAuditActionDefinitions();

  // URL Query Updater (resets page on filter change)
  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      // If updating search, filter, or date, always reset page to 1
      if (!("page" in updates)) {
        params.delete("page");
      }

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "ALL" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [searchParams, pathname, router]
  );

  // Sync state when URL changes externally (e.g. back/forward navigation)
  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    setRestaurantInput(restaurantParam);
  }, [restaurantParam]);

  useEffect(() => {
    setActorInput(actorParam);
  }, [actorParam]);

  useEffect(() => {
    setCustomFrom(fromParam);
    setCustomTo(toParam);
    setIsCustomDateOpen(dateParam === "custom");
  }, [fromParam, toParam, dateParam]);

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== qParam) {
        updateQuery({ q: searchInput ? searchInput.trim() : null });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, qParam, updateQuery]);

  // Clear all filters handler
  const handleClearAll = () => {
    setSearchInput("");
    setRestaurantInput("");
    setActorInput("");
    setCustomFrom("");
    setCustomTo("");
    setIsCustomDateOpen(false);

    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(
    qParam ||
      actionParam !== "ALL" ||
      restaurantParam ||
      actorParam ||
      dateParam !== "all" ||
      fromParam ||
      toParam
  );

  return (
    <div className={`space-y-3 transition-opacity duration-150 ${isPending ? "opacity-75" : ""}`}>
      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-white border border-zinc-200/80 rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* 1. Global Search Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search events, restaurants, admins, reasons..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-50/75 hover:bg-zinc-50 focus:bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateQuery({ q: null });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded transition"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 2. Control Pills: Action, Date, Restaurant, Actor, PageSize */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Action Filter */}
          <div className="relative">
            <select
              value={actionParam}
              onChange={(e) => updateQuery({ action: e.target.value })}
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50/75 hover:bg-zinc-100/80 font-medium text-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer transition"
              aria-label="Filter by action"
            >
              <option value="ALL">All Actions</option>
              {actions.map((act) => (
                <option key={act.action} value={act.action}>
                  {act.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* Date Filter Preset */}
          <div className="relative">
            <select
              value={dateParam}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "custom") {
                  setIsCustomDateOpen(true);
                  updateQuery({ date: "custom" });
                } else {
                  setIsCustomDateOpen(false);
                  updateQuery({ date: val, from: null, to: null });
                }
              }}
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50/75 hover:bg-zinc-100/80 font-medium text-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer transition"
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range...</option>
            </select>
            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>

          {/* Page Size Selector */}
          <div className="relative">
            <select
              value={pageSizeParam}
              onChange={(e) => updateQuery({ pageSize: e.target.value, page: null })}
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50/75 hover:bg-zinc-100/80 font-mono text-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer transition"
              aria-label="Rows per page"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Secondary Row: Specific Restaurant / Actor Inputs & Custom Date Pickers if Active */}
      {(isCustomDateOpen || restaurantParam || actorParam) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-zinc-50/75 border border-zinc-200/70 rounded-xl p-3 text-xs animate-in fade-in duration-150">
          {/* Restaurant Filter Input */}
          <div className="relative">
            <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1 flex items-center gap-1">
              <Store className="h-3 w-3" />
              <span>Target Restaurant</span>
            </span>
            <div className="relative">
              <input
                type="text"
                value={restaurantInput}
                onChange={(e) => setRestaurantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateQuery({ restaurant: restaurantInput.trim() || null });
                }}
                onBlur={() => {
                  if (restaurantInput !== restaurantParam) {
                    updateQuery({ restaurant: restaurantInput.trim() || null });
                  }
                }}
                placeholder="Restaurant ID, name, or slug..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
              {restaurantInput && (
                <button
                  type="button"
                  onClick={() => {
                    setRestaurantInput("");
                    updateQuery({ restaurant: null });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Actor Filter Input */}
          <div className="relative">
            <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Admin Actor</span>
            </span>
            <div className="relative">
              <input
                type="text"
                value={actorInput}
                onChange={(e) => setActorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateQuery({ actor: actorInput.trim() || null });
                }}
                onBlur={() => {
                  if (actorInput !== actorParam) {
                    updateQuery({ actor: actorInput.trim() || null });
                  }
                }}
                placeholder="Actor email, name, or ID..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
              {actorInput && (
                <button
                  type="button"
                  onClick={() => {
                    setActorInput("");
                    updateQuery({ actor: null });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Custom Date From */}
          {isCustomDateOpen && (
            <div>
              <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                From Date
              </span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  updateQuery({ from: e.target.value || null });
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
            </div>
          )}

          {/* Custom Date To */}
          {isCustomDateOpen && (
            <div>
              <span className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                To Date
              </span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  updateQuery({ to: e.target.value || null });
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
          <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Active filters ({totalCount} matching):</span>
          </span>

          {qParam && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono text-[11px]">
              <span>Search: &ldquo;{qParam}&rdquo;</span>
              <button
                type="button"
                onClick={() => updateQuery({ q: null })}
                className="hover:text-zinc-950 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {actionParam !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-[11px]">
              <span>Action: {actions.find((a) => a.action === actionParam)?.label || actionParam}</span>
              <button
                type="button"
                onClick={() => updateQuery({ action: null })}
                className="hover:text-zinc-950 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {restaurantParam && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-[11px]">
              <span>Restaurant: {restaurantParam}</span>
              <button
                type="button"
                onClick={() => updateQuery({ restaurant: null })}
                className="hover:text-zinc-950 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {actorParam && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-[11px]">
              <span>Actor: {actorParam}</span>
              <button
                type="button"
                onClick={() => updateQuery({ actor: null })}
                className="hover:text-zinc-950 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {dateParam !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-[11px]">
              <span>
                Date:{" "}
                {dateParam === "custom"
                  ? `${customFrom || "Start"} → ${customTo || "Now"}`
                  : dateParam === "today"
                  ? "Today"
                  : dateParam === "7d"
                  ? "Last 7 days"
                  : "Last 30 days"}
              </span>
              <button
                type="button"
                onClick={() => updateQuery({ date: null, from: null, to: null })}
                className="hover:text-zinc-950 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition ml-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}
    </div>
  );
}
