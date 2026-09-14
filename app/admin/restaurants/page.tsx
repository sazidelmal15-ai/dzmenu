import React from "react";
import { restaurantQueries, auditLogQueries } from "@/lib/db/queries";
import { SearchFilterFoundation } from "@/components/admin";
import { Store, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantsPage() {
  const [stats, auditCount] = await Promise.all([
    restaurantQueries.getPlatformKpiStats(),
    auditLogQueries.count(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Restaurants Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage all tenant restaurants, monitor subscription health, and execute lifecycle operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
            {stats.totalRestaurants} Total Tenants
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section aria-label="Tenant Search and Filter Bar">
        <SearchFilterFoundation stats={stats} auditCount={auditCount} />
      </section>

      {/* Phase 4 Smart Table Shell Placeholder */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-8 sm:p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 mb-3.5">
          <Store className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
          Restaurants Smart Table & Directory
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-md leading-relaxed">
          The full interactive table with real-time fuzzy search, multi-column sorting, plan indicators, and quick lifecycle actions will be implemented in <span className="font-semibold text-zinc-800">Phase 4</span>.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-600">
          <Layers className="h-3.5 w-3.5 text-zinc-400" />
          <span>Route: /admin/restaurants</span>
        </div>
      </div>
    </div>
  );
}
