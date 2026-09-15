"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  // BarChart2, // Analytics — hidden for now, re-enable when ready
  HelpCircle,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import {
  StreamlineMenuSolid,
  StreamlineThemesSolid,
  StreamlineQRSolid,
  StreamlineProfileSolid,
} from "@/components/icons/StreamlineIcons";
import { logoutAction } from "@/lib/auth/actions";
import type { Restaurant } from "@/types/restaurant";
import type { CurrentUser } from "@/types/auth";

interface SidebarProps {
  restaurant: Restaurant | null;
  user: CurrentUser;
}

export function Sidebar({ restaurant, user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    // Analytics — hidden from sidebar for now. Route, DB tables, and implementation intact.
    // {
    //   label: "Analytics",
    //   href: "/analytics",
    //   icon: BarChart2,
    //   active: pathname === "/analytics" || pathname.startsWith("/analytics"),
    // },
    {
      label: "Menu",
      href: "/menu",
      icon: StreamlineMenuSolid,
      active: pathname === "/menu" || pathname.startsWith("/menu"),
    },
    {
      label: "Themes & Design",
      href: "/themes",
      icon: StreamlineThemesSolid,
      active: pathname === "/themes" || pathname.startsWith("/themes") || pathname.startsWith("/design"),
    },
    {
      label: "QR Code Studio",
      href: "/qr",
      icon: StreamlineQRSolid,
      active: pathname === "/qr" || pathname.startsWith("/qr"),
    },
    {
      label: "Restaurant Profile",
      href: "/profile",
      icon: StreamlineProfileSolid,
      active: pathname === "/profile" || pathname.startsWith("/profile"),
    },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{
        duration: 0.42,
        ease: [0.16, 1, 0.3, 1], // Apple's signature fluid cubic-bezier
      }}
      className="sticky top-0 h-screen z-40 bg-white border-r border-[#F3F0E6] flex flex-col justify-between shrink-0 select-none will-change-[width]"
    >
      {/* Interactive Toggle Button with Apple Fluid Motion & Crisp Haptic Bounce */}
      <motion.button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{
          scale: 1.08,
          boxShadow: "0 6px 16px -2px rgba(217, 119, 6, 0.25)",
        }}
        whileTap={{ scale: 0.92 }}
        transition={{
          type: "spring",
          stiffness: 550,
          damping: 28,
        }}
        className="absolute -right-3.5 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-[#F3F0E6] bg-white text-[#D97706] shadow-md hover:border-amber-400 hover:bg-[#FEF9EE] cursor-pointer transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{
            duration: 0.38,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex items-center justify-center"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      <div>
        {/* Brand Header */}
        <div className="flex h-[72px] shrink-0 items-center border-b border-[#F3F0E6] px-5 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md shadow-amber-500/25 cursor-pointer"
          >
            <StreamlineMenuSolid size={19} />
          </motion.div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="ml-3 min-w-0"
              >
                <p className="text-[14px] font-bold tracking-tight text-gray-900 uppercase truncate">
                  {restaurant?.name || "DZMenu"}
                </p>
                <p className="text-[11px] text-amber-700/60 font-medium truncate">
                  Restaurant OS
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items (Only Overview & Menu) */}
        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] rounded-xl transition-all relative ${
                  collapsed ? "justify-center px-2" : ""
                } ${
                  isActive
                    ? "bg-[#FEF9EE] text-[#D97706] font-bold shadow-sm border border-amber-200/60"
                    : "text-gray-600 hover:bg-[#FEF9EE]/60 hover:text-[#D97706] border border-transparent"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  className={`shrink-0 ${
                    isActive ? "text-[#D97706]" : "text-gray-400 group-hover:text-[#D97706]"
                  }`}
                />

                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer (Clean Help & Support and User/Sign Out) */}
      <div className="shrink-0 border-t border-[#F3F0E6] px-3 pb-4 pt-3 space-y-2 overflow-hidden">
        <div
          className={`w-full flex items-center gap-3 border border-[#F3F0E6] bg-white rounded-xl py-2.5 px-3.5 shadow-sm text-gray-700 hover:bg-[#FAF9F5] transition ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600">
            <HelpCircle size={14} />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[13px] font-semibold text-gray-700"
              >
                Help & Support
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* User profile & Logout */}
        <div className={`flex items-center justify-between px-2 pt-1 ${collapsed ? "justify-center" : ""}`}>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 flex-1"
              >
                <div className="text-xs font-bold text-gray-900 truncate">
                  {user.fullName || "Restaurant Owner"}
                </div>
                <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </motion.aside>
  );
}
