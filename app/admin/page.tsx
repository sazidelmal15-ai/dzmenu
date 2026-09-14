import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";
import { isPlatformAdminRole } from "@/constants/roles";
import { restaurantQueries, auditLogQueries } from "@/lib/db/queries";
import { ROUTES } from "@/constants/routes";
import {
  MissionControlShell,
  KpiCard,
  SearchFilterFoundation,
  ErrorState,
} from "@/components/admin";
import { Store, ShieldCheck, Clock, ShieldAlert, Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mission Control — DZMenu Platform Administration",
  description: "Operational mission control and tenant lifecycle management for DZMenu.",
};

export default async function AdminMissionControlPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Server-side authorization check
  if (!isPlatformAdminRole(user.role)) {
    return (
      <main className="min-h-screen bg-[#F7F8F5] flex items-center justify-center p-6">
        <ErrorState
          isAccessDenied
          title="Access Denied / غير مصرح"
          message="You do not have platform administrator privileges to access DZMenu Mission Control."
          action={
            <Link
              href={ROUTES.DASHBOARD}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition shadow-sm"
            >
              Back to Restaurant Dashboard
            </Link>
          }
        />
      </main>
    );
  }

  // Fetch authoritative aggregated operational KPIs and audit count
  const [stats, auditCount] = await Promise.all([
    restaurantQueries.getPlatformKpiStats(),
    auditLogQueries.count(),
  ]);

  return (
    <MissionControlShell user={user} stats={stats} auditCount={auditCount}>
      <div className="space-y-6">
        {/* Page Title & Operational Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Live tenant lifecycle metrics and platform operational health.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>

        {/* 1. Operational KPI Summary Grid */}
        <section aria-label="Platform Key Performance Indicators">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <KpiCard
              label="Total Tenants"
              value={stats.totalRestaurants}
              subtext="Registered restaurant accounts"
              indicatorColor="zinc"
              icon={<Store className="h-4 w-4" />}
            />
            <KpiCard
              label="Active Paid"
              value={stats.activeCount}
              subtext="Paid active digital menus"
              indicatorColor="emerald"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <KpiCard
              label="Free Trials"
              value={stats.trialCount}
              subtext="Active exploration period"
              indicatorColor="amber"
              icon={<Clock className="h-4 w-4" />}
            />
            <KpiCard
              label="Expired"
              value={stats.expiredCount}
              subtext="Unpaid or period elapsed"
              indicatorColor="zinc"
              icon={<Activity className="h-4 w-4" />}
            />
            <KpiCard
              label="Suspended"
              value={stats.suspendedCount}
              subtext="Restricted by admin"
              indicatorColor="rose"
              icon={<ShieldAlert className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* 2. Global Search & Filter Foundation */}
        <section aria-label="Tenant Search and Filter Bar">
          <SearchFilterFoundation stats={stats} selectedFilter="ALL" />
        </section>

        {/* 3. Operational Overview & Navigation Bridge */}
        <section aria-label="Quick Actions & Operations Bridge" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-zinc-700" />
                <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
                  Tenant Management (Smart Table)
                </h2>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                Phase 4 Ready
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Explore and manage all {stats.totalRestaurants} restaurants with real-time search, plan statuses, and quick lifecycle actions.
            </p>
            <div className="pt-2">
              <Link
                href="/admin?tab=restaurants"
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition"
              >
                <span>Go to Restaurants Directory</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-zinc-700" />
                <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
                  Security & Audit Log Trail
                </h2>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                {auditCount} Records
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Immutable server-side audit logs capturing every plan activation, extension, trial grant, suspension, and reactivation.
            </p>
            <div className="pt-2">
              <Link
                href="/admin?tab=audit"
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition"
              >
                <span>Review Audit Trail</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MissionControlShell>
  );
}
