import React from "react";
import { MissionControlHeader } from "./MissionControlHeader";
import { MissionControlNav } from "./MissionControlNav";
import type { CurrentUser } from "@/types/auth";
import type { PlatformKpiStats } from "@/lib/db/queries";

interface MissionControlShellProps {
  user: CurrentUser;
  stats?: PlatformKpiStats;
  auditCount?: number;
  children: React.ReactNode;
}

export function MissionControlShell({
  user,
  stats,
  auditCount,
  children,
}: MissionControlShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white flex flex-col">
      {/* Platform Header */}
      <MissionControlHeader user={user} />

      {/* Main Tab Navigation */}
      <MissionControlNav
        totalRestaurants={stats?.totalRestaurants}
        auditCount={auditCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
