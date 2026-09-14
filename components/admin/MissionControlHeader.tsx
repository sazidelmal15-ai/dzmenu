import React from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { ShieldCheck, Search, LogOut, Terminal } from "lucide-react";
import type { CurrentUser } from "@/types/auth";

interface MissionControlHeaderProps {
  user: CurrentUser;
}

export function MissionControlHeader({ user }: MissionControlHeaderProps) {
  return (
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

          {/* Quick Search Foundation Trigger */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search restaurants by name, slug, or owner..."
                className="w-full pl-9 pr-12 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition"
                readOnly
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Admin Identity & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-zinc-700 truncate max-w-[160px]">
                {user.email}
              </span>
              <span className="text-[10px] font-mono uppercase bg-zinc-200/70 text-zinc-700 px-1.5 py-0.2 rounded font-semibold">
                {user.role}
              </span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
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
  );
}
