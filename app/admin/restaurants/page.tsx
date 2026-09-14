import React from "react";
import { restaurantQueries } from "@/lib/db/queries";
import {
  RestaurantTable,
  RestaurantTableToolbar,
  TablePagination,
} from "@/components/admin";

export const dynamic = "force-dynamic";

interface AdminRestaurantsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    plan?: string;
    sort?: string;
    order?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminRestaurantsPage({
  searchParams,
}: AdminRestaurantsPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const plan = typeof params.plan === "string" ? params.plan : undefined;
  const sort = typeof params.sort === "string" ? (params.sort as "name" | "created" | "expiry" | "status") : undefined;
  const order = typeof params.order === "string" ? (params.order as "asc" | "desc") : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 10;

  const [stats, listResult] = await Promise.all([
    restaurantQueries.getPlatformKpiStats(),
    restaurantQueries.getPaginatedForAdmin({
      search: q,
      status,
      plan,
      sortBy: sort,
      sortOrder: order,
      page,
      pageSize,
    }),
  ]);

  const isFiltered = Boolean(
    q ||
      (status && status.toUpperCase() !== "ALL") ||
      (plan && plan.toUpperCase() !== "ALL") ||
      sort ||
      order
  );

  return (
    <div className="space-y-4 sm:space-y-5">
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

      {/* Interactive Toolbar: Search, Filters, Sorters */}
      <section aria-label="Tenant directory controls">
        <RestaurantTableToolbar stats={stats} totalFiltered={listResult.total} />
      </section>

      {/* Smart Table */}
      <section aria-label="Tenant restaurants table">
        <RestaurantTable
          restaurants={listResult.items}
          isFiltered={isFiltered}
        />
      </section>

      {/* Pagination Bar */}
      <section aria-label="Table pagination">
        <TablePagination
          page={listResult.page}
          pageSize={listResult.pageSize}
          total={listResult.total}
          totalPages={listResult.totalPages}
        />
      </section>
    </div>
  );
}
