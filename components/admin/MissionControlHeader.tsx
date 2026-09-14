"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { Search, LogOut } from "lucide-react";
import type { CurrentUser } from "@/types/auth";
import { QuickSearchModal } from "./QuickSearchModal";

interface MissionControlHeaderProps {
  user: CurrentUser;
  totalRestaurants?: number;
  auditCount?: number;
}

export function MissionControlHeader({
  user,
  totalRestaurants = 0,
  auditCount = 0,
}: MissionControlHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Detect platform for keyboard shortcut display
  useEffect(() => {
    setIsMac(typeof window !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
  }, []);

  // Global keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Identity & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/admin"
                className="flex items-center gap-2.5 group focus:outline-none"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-sm tracking-tighter shadow-sm transition group-hover:bg-zinc-800">
                  DZ
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 text-base tracking-tight">
                    DZMenu
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                    Mission Control
                  </span>
                </div>
              </Link>
            </div>

            {/* Quick Search Interactive Trigger */}
            <div className="flex-1 max-w-md mx-2 sm:mx-4">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between pl-3 pr-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-500 hover:text-zinc-800 transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="truncate">Search commands, restaurants...</span>
                </div>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-white border border-zinc-200 shadow-2xs">
                  {isMac ? "⌘K" : "Ctrl+K"}
                </kbd>
              </button>
            </div>

            {/* Admin Identity & Real Logout Action */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-zinc-700 truncate max-w-[150px]">
                  {user.email}
                </span>
                <span className="text-[10px] font-mono uppercase bg-zinc-200/70 text-zinc-700 px-1.5 py-0.2 rounded font-semibold">
                  {user.role}
                </span>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign out of Mission Control"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg border border-transparent transition"
                >
                  <LogOut className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        totalRestaurants={totalRestaurants}
        auditCount={auditCount}
      />
    </>
  );
}
