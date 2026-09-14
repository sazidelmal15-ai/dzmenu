import React from "react";
import { auditLogQueries } from "@/lib/db/queries";
import { ShieldAlert, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const auditCount = await auditLogQueries.count();

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {auditCount} Total Entries
          </span>
        </div>
      </div>

      {/* Phase 6 Audit Log Shell Placeholder */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-8 sm:p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 mb-3.5">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
          Audit Log Explorer & Timeline
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-md leading-relaxed">
          The full audit log explorer with before/after state diffs, actor attribution, filtering by action, and JSON snapshot inspection will be implemented in <span className="font-semibold text-zinc-800">Phase 6</span>.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-600">
          <History className="h-3.5 w-3.5 text-zinc-400" />
          <span>Route: /admin/audit</span>
        </div>
      </div>
    </div>
  );
}
