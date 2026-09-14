import React from "react";
import {
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  Edit3,
} from "lucide-react";
import type { AuditDiffSummary, AuditDiffItem } from "@/types/audit";

interface AuditStateDiffViewerProps {
  diff: AuditDiffSummary;
}

function getChangeTypeBadge(type: AuditDiffItem["changeType"]) {
  switch (type) {
    case "ADDED":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <Plus className="h-2.5 w-2.5" />
          <span>ADDED</span>
        </span>
      );
    case "REMOVED":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <Minus className="h-2.5 w-2.5" />
          <span>REMOVED</span>
        </span>
      );
    case "MODIFIED":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
          <Edit3 className="h-2.5 w-2.5" />
          <span>MODIFIED</span>
        </span>
      );
  }
}

export function AuditStateDiffViewer({ diff }: AuditStateDiffViewerProps) {
  // Empty State: No state changes recorded for this event
  if (!diff.hasChanges || diff.items.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-zinc-50 border border-dashed border-zinc-200 text-center flex flex-col items-center justify-center space-y-1.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-zinc-400" />
        </div>
        <p className="text-xs font-medium text-zinc-700">
          No state changes recorded for this event.
        </p>
        <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
          This operation was executed without modifying tenant subscription or operational properties.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
          State Changes
        </h4>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
          {diff.items.length} {diff.items.length === 1 ? "Field Changed" : "Fields Changed"}
        </span>
      </div>

      <div className="space-y-2">
        {diff.items.map((item) => (
          <div
            key={item.field}
            className="p-3.5 bg-white border border-zinc-200/80 rounded-xl space-y-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:border-zinc-300"
          >
            {/* Field Header & Change Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-xs font-semibold text-zinc-900 truncate">
                  {item.label}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono truncate">
                  ({item.field})
                </span>
              </div>
              {getChangeTypeBadge(item.changeType)}
            </div>

            {/* Before vs After Values Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
              {/* Previous Value */}
              <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 font-mono text-[11px] overflow-x-auto min-w-0">
                <div className="text-[9px] font-sans font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
                  Before
                </div>
                <span
                  className={
                    item.changeType === "REMOVED"
                      ? "text-rose-600 line-through font-semibold"
                      : item.changeType === "MODIFIED"
                      ? "text-zinc-500 line-through"
                      : "text-zinc-400 italic"
                  }
                >
                  {item.formattedPrevious}
                </span>
              </div>

              {/* Direction Indicator */}
              <div className="hidden sm:flex items-center justify-center text-zinc-300">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>

              {/* New Value */}
              <div
                className={`p-2 rounded-lg border font-mono text-[11px] overflow-x-auto min-w-0 ${
                  item.changeType === "ADDED"
                    ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-900 font-semibold"
                    : item.changeType === "MODIFIED"
                    ? "bg-sky-50/40 border-sky-200/80 text-zinc-900 font-semibold"
                    : "bg-zinc-50 border-zinc-200/60 text-zinc-400 italic"
                }`}
              >
                <div className="text-[9px] font-sans font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
                  After
                </div>
                <span>{item.formattedNew}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
