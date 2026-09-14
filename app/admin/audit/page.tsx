import React from "react";
import { auditLogQueries } from "@/lib/db/queries";
import { requireRole } from "@/lib/permissions/guards";
import { PLATFORM_ADMIN_ROLES } from "@/constants/roles";
import { TablePagination } from "@/components/admin";
import { AuditFilters, AuditTable } from "@/components/admin/audit";
import type { AuditDateRangePreset } from "@/types/audit";

export const dynamic = "force-dynamic";

interface AdminAuditPageProps {
  searchParams: Promise<{
    q?: string;
    action?: string;
    restaurant?: string;
    actor?: string;
    date?: string;
    from?: string;
    to?: string;
    sort?: string;
    order?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  // 1. Server-side platform admin authorization guard
  await requireRole(PLATFORM_ADMIN_ROLES);

  // 2. Extract and sanitize search parameters
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : undefined;
  const action = typeof params.action === "string" ? params.action : undefined;
  const restaurant = typeof params.restaurant === "string" ? params.restaurant.trim() : undefined;
  const actor = typeof params.actor === "string" ? params.actor.trim() : undefined;
  const dateRange = (typeof params.date === "string" ? params.date.toLowerCase() : "all") as AuditDateRangePreset;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const sort = typeof params.sort === "string" ? (params.sort as "time" | "action" | "restaurant" | "actor") : "time";
  const order = typeof params.order === "string" ? (params.order.toLowerCase() as "asc" | "desc") : "desc";
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = typeof params.pageSize === "string" ? parseInt(params.pageSize, 10) : 25;

  // 3. Query paginated audit log data from server data layer
  const [totalPlatformAuditCount, listResult] = await Promise.all([
    auditLogQueries.count(),
    auditLogQueries.getPaginatedForAdmin({
      search: q,
      action,
      restaurant,
      actor,
      dateRange,
      from,
      to,
      sortBy: sort,
      sortOrder: order,
      page,
      pageSize,
    }),
  ]);

  const isFiltered = Boolean(
    q ||
      (action && action.toUpperCase() !== "ALL") ||
      restaurant ||
      actor ||
      (dateRange && dateRange !== "all") ||
      from ||
      to ||
      sort !== "time" ||
      order !== "desc"
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Security & Audit Log Trail
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Immutable platform record of administrative lifecycle operations and tenant status modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
            {totalPlatformAuditCount} Total Platform Events
          </span>
        </div>
      </div>

      {/* Filter Toolbar: Search, Action, Restaurant, Actor, Date */}
      <section aria-label="Audit log search and filter controls">
        <AuditFilters totalCount={listResult.total} />
      </section>

      {/* Global Audit Data Table */}
      <section aria-label="Audit logs data table">
        <AuditTable
          logs={listResult.items}
          totalCount={listResult.total}
          isFiltered={isFiltered}
        />
      </section>

      {/* Server Pagination Controls */}
      <section aria-label="Audit log pagination">
        <TablePagination
          page={listResult.page}
          pageSize={listResult.pageSize}
          total={listResult.total}
          totalPages={listResult.totalPages}
          itemLabel="events"
        />
      </section>
    </div>
  );
}
