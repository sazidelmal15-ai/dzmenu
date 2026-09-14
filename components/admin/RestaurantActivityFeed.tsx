"use client";

import React, { useState } from "react";
import {
  History,
  Zap,
  CalendarPlus,
  Gift,
  Ban,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { AdminAuditLog, AdminAuditAction } from "@/types/audit";

interface RestaurantActivityFeedProps {
  activity: AdminAuditLog[];
}

function getActionMeta(action: AdminAuditAction): {
  label: string;
  icon: React.ReactNode;
  badgeStyle: string;
} {
  switch (action) {
    case "ACTIVATE_PLAN":
    case "ACTIVATE_ANNUAL":
      return {
        label: "Plan Activated",
        icon: <Zap className="h-3.5 w-3.5 text-amber-500" />,
        badgeStyle: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "EXTEND_SUBSCRIPTION":
    case "EXTEND_ANNUAL":
      return {
        label: "Subscription Extended",
        icon: <CalendarPlus className="h-3.5 w-3.5 text-emerald-600" />,
        badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "GRANT_TRIAL":
      return {
        label: "Free Trial Granted",
        icon: <Gift className="h-3.5 w-3.5 text-indigo-600" />,
        badgeStyle: "bg-indigo-50 text-indigo-800 border-indigo-200",
      };
    case "SUSPEND_RESTAURANT":
      return {
        label: "Restaurant Suspended",
        icon: <Ban className="h-3.5 w-3.5 text-rose-600" />,
        badgeStyle: "bg-rose-50 text-rose-800 border-rose-200",
      };
    case "REACTIVATE_RESTAURANT":
      return {
        label: "Restaurant Reactivated",
        icon: <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />,
        badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    default:
      return {
        label: action.replace(/_/g, " ").toLowerCase(),
        icon: <History className="h-3.5 w-3.5 text-zinc-500" />,
        badgeStyle: "bg-zinc-100 text-zinc-700 border-zinc-200",
      };
  }
}

function formatRelativeTime(date: Date | string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "recently";
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
    return "recently";
  }
}

export function RestaurantActivityFeed({ activity }: RestaurantActivityFeedProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
          Recent Activity
        </h3>
        <span className="text-[11px] font-mono text-zinc-400">
          {activity.length} {activity.length === 1 ? "event" : "events"} recorded
        </span>
      </div>

      {activity.length === 0 ? (
        <div className="p-6 rounded-xl bg-zinc-50 border border-zinc-200/70 text-center text-xs text-zinc-500 space-y-1">
          <History className="h-5 w-5 text-zinc-400 mx-auto mb-1.5" />
          <p className="font-medium text-zinc-700">No activity recorded yet</p>
          <p className="text-[11px] text-zinc-400">
            Administrative lifecycle actions performed on this restaurant will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activity.map((log) => {
            const meta = getActionMeta(log.action);
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:border-zinc-300"
              >
                {/* Event Card Header */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-3 cursor-pointer flex items-start justify-between gap-3 text-xs select-none"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1 rounded-md bg-zinc-50 border border-zinc-200 flex-shrink-0 mt-0.5">
                      {meta.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900">
                          {meta.label}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono border ${meta.badgeStyle}`}
                        >
                          {log.action}
                        </span>
                      </div>

                      {/* Reason if present */}
                      {log.reason && (
                        <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-1 italic">
                          &ldquo;{log.reason}&rdquo;
                        </p>
                      )}

                      {/* Actor & Time */}
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-1">
                        <span className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3" />
                          <span>{log.actorEmail}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(log.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-zinc-400 hover:text-zinc-600 rounded transition flex-shrink-0"
                    aria-label={isExpanded ? "Collapse details" : "Expand details"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Expanded State Snapshots */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-zinc-100 bg-zinc-50/50 space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Previous State */}
                      <div className="p-2 rounded-lg bg-white border border-zinc-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Previous State
                        </span>
                        {log.previousState ? (
                          <pre className="text-[10px] font-mono text-zinc-600 overflow-x-auto p-1 bg-zinc-50 rounded">
                            {JSON.stringify(log.previousState, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-[11px] text-zinc-400 font-mono">None</p>
                        )}
                      </div>

                      {/* New State */}
                      <div className="p-2 rounded-lg bg-white border border-zinc-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          New State
                        </span>
                        {log.newState ? (
                          <pre className="text-[10px] font-mono text-zinc-600 overflow-x-auto p-1 bg-zinc-50 rounded">
                            {JSON.stringify(log.newState, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-[11px] text-zinc-400 font-mono">None</p>
                        )}
                      </div>
                    </div>

                    {/* Metadata summary if present */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="text-zinc-400">Metadata:</span>
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <span
                            key={k}
                            className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px]"
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 6 Hook Contract */}
      <div className="pt-2 text-center">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-500 transition font-medium cursor-not-allowed group"
          title="Global audit exploration will be available in Phase 6"
        >
          <span>View full audit history in Phase 6</span>
          <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
