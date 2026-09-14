"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  Store,
  FileText,
  Shield,
  Info,
} from "lucide-react";
import { getAuditDetailAction, type AuditDetailData } from "@/lib/admin/actions";
import {
  getAuditActionLabel,
  getAuditActionBadgeStyle,
  getAuditActionDefinition,
} from "@/constants/audit";
import { AuditDetailSkeleton } from "./AuditDetailSkeleton";
import { AuditStateDiffViewer } from "./AuditStateDiffViewer";

interface AuditDetailDrawerProps {
  auditId: string | null;
  isOpen: boolean;
  onClose: () => void;
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

export function AuditDetailDrawer({
  auditId,
  isOpen,
  onClose,
}: AuditDetailDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditDetailData | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAuditDetailAction(id);
      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        setError(res.error || "Unable to load audit event");
      }
    } catch {
      setError("An unexpected error occurred while loading audit event details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && auditId) {
      fetchDetail(auditId);
    } else if (!isOpen) {
      setDetail(null);
      setError(null);
    }
  }, [isOpen, auditId, fetchDetail]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyId = () => {
    if (!detail?.log) return;
    navigator.clipboard.writeText(detail.log.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) {
    return null;
  }

  const log = detail?.log;
  const actionDef = log ? getAuditActionDefinition(log.action) : null;
  const badgeStyle = log ? getAuditActionBadgeStyle(log.action) : null;
  const actionLabel = log ? getAuditActionLabel(log.action) : "";

  // Check if safe metadata has entries
  const metadataEntries = detail?.redactedMetadata
    ? Object.entries(detail.redactedMetadata).filter(
        ([key, val]) => val !== undefined && val !== null && key !== ""
      )
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Audit Event Details"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg sm:max-w-xl bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Top Operational Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200/80 bg-zinc-50/75 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-zinc-500" />
              <span>Event Record</span>
            </span>
            {log && (
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 transition cursor-pointer"
                title="Copy Audit Event ID"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>{log.id.slice(0, 8)}...</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {log && !isLoading && (
              <button
                type="button"
                onClick={() => auditId && fetchDetail(auditId)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-md transition cursor-pointer"
                title="Refresh event detail"
                aria-label="Refresh event detail"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-md transition cursor-pointer"
              title="Close drawer (Esc)"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body with Internal Scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading && <AuditDetailSkeleton />}

          {!isLoading && error && (
            <div className="p-8 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Unable to load audit event
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">{error}</p>
              <button
                type="button"
                onClick={() => auditId && fetchDetail(auditId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {!isLoading && !error && log && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* 1. Event Action Header */}
              <div className="flex items-start gap-3.5 pb-5 border-b border-zinc-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex-shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {badgeStyle && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                      >
                        {actionLabel}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  {actionDef && (
                    <p className="text-xs text-zinc-500 leading-relaxed pt-0.5">
                      {actionDef.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Key Event Context Grid */}
              <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4 space-y-3.5">
                <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Event Context
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Actor */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Executed By</span>
                    </div>
                    <div className="font-semibold text-zinc-900">
                      {log.actorName || log.actorEmail}
                    </div>
                    {log.actorName && (
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {log.actorEmail}
                      </div>
                    )}
                  </div>

                  {/* Target Restaurant */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      <span>Target Tenant</span>
                    </div>
                    <div className="font-semibold text-zinc-900">
                      {log.targetRestaurantName || "Platform Wide"}
                    </div>
                    {log.targetRestaurantSlug && (
                      <div className="text-[11px] text-zinc-500 font-mono">
                        /m/{log.targetRestaurantSlug}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Timestamp</span>
                    </div>
                    <div className="font-mono text-zinc-800 text-[11px]">
                      {formatExactDateTime(log.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Reason / Operator Note Callout */}
              {log.reason && (
                <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1">
                  <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Administrative Reason</span>
                  </div>
                  <p className="text-xs text-zinc-800 font-medium leading-relaxed italic">
                    &ldquo;{log.reason}&rdquo;
                  </p>
                </div>
              )}

              {/* 4. State Diff Section */}
              {detail?.diff && (
                <section aria-label="Before and after state difference">
                  <AuditStateDiffViewer diff={detail.diff} />
                </section>
              )}

              {/* 5. Redacted Metadata / Operational Parameters */}
              {metadataEntries.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Operational Parameters</span>
                    </h4>
                  </div>

                  <div className="p-3.5 bg-zinc-50/75 border border-zinc-200/80 rounded-xl space-y-2 text-xs font-mono text-[11px]">
                    {metadataEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between gap-3 py-1 border-b border-zinc-200/40 last:border-0"
                      >
                        <span className="text-zinc-500 font-sans font-medium text-xs">
                          {key}:
                        </span>
                        <span className="text-zinc-800 text-right max-w-xs break-all">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
