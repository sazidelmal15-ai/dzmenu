import React from "react";

export function AuditDetailSkeleton() {
  return (
    <div className="p-5 sm:p-6 space-y-6 animate-pulse">
      {/* 1. Action Header Skeleton */}
      <div className="flex items-start gap-3.5 pb-5 border-b border-zinc-100">
        <div className="h-10 w-10 rounded-xl bg-zinc-200 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-zinc-200 rounded-md" />
            <div className="h-4 w-20 bg-zinc-100 rounded" />
          </div>
          <div className="h-3 w-48 bg-zinc-100 rounded" />
        </div>
      </div>

      {/* 2. Event Key Context Grid Skeleton */}
      <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4 space-y-3">
        <div className="h-3 w-28 bg-zinc-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-1.5">
            <div className="h-2.5 w-14 bg-zinc-200 rounded" />
            <div className="h-4 w-32 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-zinc-200 rounded" />
            <div className="h-4 w-36 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-12 bg-zinc-200 rounded" />
            <div className="h-4 w-28 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-zinc-200 rounded" />
            <div className="h-4 w-40 bg-zinc-200 rounded" />
          </div>
        </div>
      </div>

      {/* 3. Reason Callout Skeleton */}
      <div className="p-3.5 bg-zinc-50/60 border border-zinc-200/60 rounded-xl space-y-2">
        <div className="h-3 w-20 bg-zinc-200 rounded" />
        <div className="h-3 w-full bg-zinc-100 rounded" />
      </div>

      {/* 4. State Diff Section Skeleton */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-zinc-200 rounded" />
          <div className="h-4 w-16 bg-zinc-100 rounded-md" />
        </div>

        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-3.5 bg-white border border-zinc-200/80 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 bg-zinc-200 rounded" />
                <div className="h-4 w-16 bg-zinc-100 rounded" />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="h-3.5 flex-1 bg-zinc-100 rounded" />
                <div className="h-3 w-3 bg-zinc-200 rounded" />
                <div className="h-3.5 flex-1 bg-zinc-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Metadata Section Skeleton */}
      <div className="space-y-2 pt-1">
        <div className="h-3 w-24 bg-zinc-200 rounded" />
        <div className="h-16 bg-zinc-50 border border-zinc-200/60 rounded-lg" />
      </div>
    </div>
  );
}
