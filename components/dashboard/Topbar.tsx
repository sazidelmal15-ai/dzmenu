"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";
import type { CurrentUser } from "@/types/auth";
import type { Restaurant } from "@/types/restaurant";

interface TopbarProps {
  user: CurrentUser;
  restaurant?: Restaurant | null;
  title?: string;
}

export function Topbar({ user, restaurant, title }: TopbarProps) {
  const pathname = usePathname();
  const firstName = user.fullName ? user.fullName.split(" ")[0] : "System";
  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "S";

  // Dynamic route-aware title
  const getDynamicTitle = () => {
    if (title) return title;
    if (pathname.startsWith("/analytics") || pathname.startsWith("/dashboard/overview")) return "Analytics";
    if (pathname.startsWith("/profile") || pathname.startsWith("/dashboard/restaurant")) return "Restaurant Profile";
    if (pathname.startsWith("/design") || pathname.startsWith("/themes") || pathname.startsWith("/dashboard/themes")) return "Themes & Design";
    if (pathname.startsWith("/qr") || pathname.startsWith("/dashboard/qr")) return "QR Code Studio";
    if (pathname.startsWith("/settings") || pathname.startsWith("/dashboard/settings")) return "Settings";
    return "Menu";
  };

  const pageTitle = getDynamicTitle();
  const isOnline = restaurant?.status === "ACTIVE";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-6 px-8 py-4 bg-white border-b border-[#F3F0E6]">
      {/* Title & Welcome back */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-gray-900">
            {pageTitle}
          </h1>
          {restaurant && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{isOnline ? "Online" : "Paused"}</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[13px] text-gray-500">
          Welcome back,{" "}
          <span className="text-[#D97706] font-bold">{firstName}</span>{" "}
          <span>👋</span>
        </p>
      </div>

      {/* Bell + User Avatar */}
      <div className="flex items-center gap-5 shrink-0">
        <button
          type="button"
          className="relative text-gray-400 hover:text-gray-700 transition"
        >
          <Bell size={20} strokeWidth={1.75} />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer pl-2">
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center text-[13px] font-bold text-white bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-md shadow-amber-500/20">
            {initial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[13px] font-bold text-gray-900 leading-tight">
              {user.fullName || "System Admin"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {user.role === "SUPER_OWNER" ? "ADMIN" : "OWNER"}
            </p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
}
