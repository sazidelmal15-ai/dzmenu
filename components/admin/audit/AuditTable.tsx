"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Clock,
  User,
  Store,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { AdminAuditListRow } from "@/types/audit";
import { getAuditActionLabel, getAuditActionBadgeStyle } from "@/constants/audit";
import { AuditDetailDrawer } from "./AuditDetailDrawer";

interface AuditTableProps {
  logs: AdminAuditListRow[];
  totalCount: number;
  isFiltered?: boolean;
  selectedAuditId?: string | null;
  onSelectAudit?: (log: AdminAuditListRow) => void;
}

function formatRelativeTime(date: Date | string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatExactDateTime(date: Date | string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function AuditTable({
  logs,
  totalCount,
  isFiltered = false,
  selectedAuditId,
  onSelectAudit,
}: AuditTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Internal drawer selection state
  const [internalSelectedAuditId, setInternalSelectedAuditId] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const activeSelectedAuditId =
    selectedAuditId !== undefined ? selectedAuditId : internalSelectedAuditId;

  const handleRowClick = (log: AdminAuditListRow) => {
    setInternalSelectedAuditId(log.id);
    setIsDrawerOpen(true);
    onSelectAudit?.(log);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setInternalSelectedAuditId(null);
  };

  const currentSort = searchParams.get("sort") || "time";
  const currentOrder = searchParams.get("order")?.toLowerCase() || "desc";

  const handleSort = (sortKey: "time" | "action" | "restaurant" | "actor") => {
    const params = new URLSearchParams(searchParams.toString());
    let nextOrder = "desc";

    if (currentSort === sortKey) {
      nextOrder = currentOrder === "desc" ? "asc" : "desc";
    }

    params.set("sort", sortKey);
    params.set("order", nextOrder);
    params.delete("page"); // reset to page 1

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const renderSortIndicator = (sortKey: string) => {
    if (currentSort !== sortKey) {
      return <ArrowUpDown className="h-3 w-3 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity ml-1" />;
    }
    return currentOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-zinc-900 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-zinc-900 ml-1" />
    );
  };

  const handleClearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  // 1. Empty State: No logs at all vs Filters returned 0 matches
  if (logs.length === 0) {
    if (isFiltered) {
      return (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center my-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200/80 mb-3 text-zinc-400">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
            No matching audit events
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm leading-relaxed">
            No administrative operations match your search terms or active filters.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center my-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200/80 mb-3 text-zinc-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
          No audit activity yet
        </h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-sm leading-relaxed">
          Administrative lifecycle events performed in Mission Control will automatically be recorded here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-opacity duration-150 ${
        isPending ? "opacity-75 pointer-events-none" : ""
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]" aria-label={`Audit log events list, ${totalCount} records`}>
          <caption className="sr-only">
            Admin audit events table ({totalCount} total results)
          </caption>
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/75">
              {/* Time Column Header */}
              <th
                scope="col"
                onClick={() => handleSort("time")}
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-900 select-none group w-36"
              >
                <div className="flex items-center">
                  <span>Time</span>
                  {renderSortIndicator("time")}
                </div>
              </th>

              {/* Action Column Header */}
              <th
                scope="col"
                onClick={() => handleSort("action")}
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-900 select-none group w-44"
              >
                <div className="flex items-center">
                  <span>Action</span>
                  {renderSortIndicator("action")}
                </div>
              </th>

              {/* Restaurant Column Header */}
              <th
                scope="col"
                onClick={() => handleSort("restaurant")}
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-900 select-none group w-48"
              >
                <div className="flex items-center">
                  <span>Restaurant</span>
                  {renderSortIndicator("restaurant")}
                </div>
              </th>

              {/* Actor Column Header */}
              <th
                scope="col"
                onClick={() => handleSort("actor")}
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-900 select-none group w-44"
              >
                <div className="flex items-center">
                  <span>Actor</span>
                  {renderSortIndicator("actor")}
                </div>
              </th>

              {/* Reason / Summary Column Header */}
              <th
                scope="col"
                className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider"
              >
                Summary / Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {logs.map((log) => {
              const label = getAuditActionLabel(log.action);
              const badgeStyle = getAuditActionBadgeStyle(log.action);
              const isSelected = activeSelectedAuditId === log.id;

              return (
                <tr
                  key={log.id}
                  onClick={() => handleRowClick(log)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(log);
                    }
                  }}
                  className={`transition-colors cursor-pointer group focus:outline-none focus:bg-zinc-50 ${
                    isSelected
                      ? "bg-zinc-100/80 ring-1 ring-inset ring-zinc-300"
                      : "hover:bg-zinc-50/75"
                  }`}
                  aria-label={`Audit event ${label} for ${log.targetRestaurantName}`}
                >
                  {/* 1. Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      <span>{formatRelativeTime(log.createdAt)}</span>
                    </div>
                    <div
                      className="text-[10px] text-zinc-400 font-mono mt-0.5"
                      title={formatExactDateTime(log.createdAt)}
                    >
                      {formatExactDateTime(log.createdAt)}
                    </div>
                  </td>

                  {/* 2. Action */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                    >
                      {label}
                    </span>
                  </td>

                  {/* 3. Restaurant */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-900 group-hover:text-zinc-950 truncate">
                      <Store className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                      <span className="truncate">{log.targetRestaurantName}</span>
                    </div>
                    {log.targetRestaurantSlug && (
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate pl-5">
                        /{log.targetRestaurantSlug}
                      </div>
                    )}
                  </td>

                  {/* 4. Actor */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-zinc-800 font-medium truncate">
                      <User className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                      <span className="truncate">{log.actorName || log.actorEmail}</span>
                    </div>
                    {log.actorName && (
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate pl-5">
                        {log.actorEmail}
                      </div>
                    )}
                  </td>

                  {/* 5. Summary / Reason */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <p className="text-zinc-600 line-clamp-1 italic text-xs">
                        {log.reason ? `“${log.reason}”` : "—"}
                      </p>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phase 6C Audit Detail Drawer */}
      <AuditDetailDrawer
        auditId={activeSelectedAuditId}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
