"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Store, ShieldAlert, LayoutDashboard, CornerDownLeft } from "lucide-react";


interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRestaurants?: number;
  auditCount?: number;
}

export function QuickSearchModal({
  isOpen,
  onClose,
  totalRestaurants = 0,
  auditCount = 0,
}: QuickSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Quick navigation items
  const quickActions = [
    {
      id: "nav-overview",
      title: "Jump to Overview",
      category: "Navigation",
      href: "/admin",
      icon: <LayoutDashboard className="h-4 w-4 text-zinc-500" />,
      badge: "Dashboard",
    },
    {
      id: "nav-restaurants",
      title: "View All Restaurants",
      category: "Navigation",
      href: "/admin/restaurants",
      icon: <Store className="h-4 w-4 text-zinc-500" />,
      badge: `${totalRestaurants} Tenants`,
    },
    {
      id: "nav-audit",
      title: "Review Audit Log Trail",
      category: "Navigation",
      href: "/admin/audit",
      icon: <ShieldAlert className="h-4 w-4 text-zinc-500" />,
      badge: `${auditCount} Records`,
    },
    {
      id: "filter-active",
      title: "Filter Active Paid Restaurants",
      category: "Quick Filters",
      href: "/admin/restaurants?status=ACTIVE",
      icon: <div className="h-2 w-2 rounded-full bg-emerald-500" />,
      badge: "Status: Active",
    },
    {
      id: "filter-trial",
      title: "Filter Free Trial Restaurants",
      category: "Quick Filters",
      href: "/admin/restaurants?status=TRIAL",
      icon: <div className="h-2 w-2 rounded-full bg-amber-500" />,
      badge: "Status: Trial",
    },
    {
      id: "filter-suspended",
      title: "Filter Suspended Restaurants",
      category: "Quick Filters",
      href: "/admin/restaurants?status=SUSPENDED",
      icon: <div className="h-2 w-2 rounded-full bg-rose-500" />,
      badge: "Status: Suspended",
    },
  ];

  const filteredActions = query.trim()
    ? quickActions.filter((a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase()) ||
        a.badge.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation inside search palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredActions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredActions.length - 1
        );
      } else if (e.key === "Enter" && filteredActions[selectedIndex]) {
        e.preventDefault();
        router.push(filteredActions[selectedIndex].href);
        onClose();
      }
    },
    [filteredActions, selectedIndex, onClose, router]
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mission Control Command Palette"
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Card */}
      <div className="relative w-full max-w-xl bg-white border border-zinc-200/90 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-zinc-200/80">
          <Search className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search navigation, filters, or restaurants..."
            className="w-full px-3 py-3.5 text-sm text-zinc-900 placeholder-zinc-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd
            onClick={onClose}
            className="ml-2 cursor-pointer px-1.5 py-0.5 text-[11px] font-mono text-zinc-400 bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-200"
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-100">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching actions or commands found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredActions.map((action, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={() => {
                      router.push(action.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-xs transition ${
                      isSelected
                        ? "bg-zinc-100 text-zinc-900 font-medium"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-zinc-200/80 shadow-xs">
                        {action.icon}
                      </div>
                      <div>
                        <span className="text-zinc-900">{action.title}</span>
                        <span className="ml-2 text-[10px] text-zinc-400 font-mono">
                          {action.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded font-mono">
                        {action.badge}
                      </span>
                      {isSelected && (
                        <CornerDownLeft className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 bg-zinc-50/80 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>DZMenu Mission Control</span>
        </div>
      </div>
    </div>
  );
}
