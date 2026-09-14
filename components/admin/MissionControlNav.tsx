"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, ShieldAlert } from "lucide-react";

interface MissionControlNavProps {
  totalRestaurants?: number;
  auditCount?: number;
}

export function MissionControlNav({
  totalRestaurants,
  auditCount,
}: MissionControlNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      href: "/admin",
      icon: <LayoutDashboard className="h-4 w-4" />,
      isActive: pathname === "/admin",
    },
    {
      id: "restaurants",
      label: "Restaurants",
      href: "/admin/restaurants",
      icon: <Store className="h-4 w-4" />,
      count: totalRestaurants,
      isActive: pathname.startsWith("/admin/restaurants"),
    },
    {
      id: "audit",
      label: "Audit Log",
      href: "/admin/audit",
      icon: <ShieldAlert className="h-4 w-4" />,
      count: auditCount,
      isActive: pathname.startsWith("/admin/audit"),
    },
  ];

  return (
    <nav className="border-b border-zinc-200/80 bg-white" aria-label="Mission Control Tabs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-6 sm:space-x-8 -mb-px overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`inline-flex items-center gap-2 py-3.5 px-1 border-b-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                tab.isActive
                  ? "border-zinc-900 text-zinc-900 font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
              }`}
            >
              <span className={tab.isActive ? "text-zinc-900" : "text-zinc-400"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-mono font-medium ${
                    tab.isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-zinc-100/80 text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
