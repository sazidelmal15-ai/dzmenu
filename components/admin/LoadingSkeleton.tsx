import React from "react";

export function KpiCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-4 sm:p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-zinc-200 rounded" />
        <div className="h-2.5 w-2.5 rounded-full bg-zinc-200" />
      </div>
      <div className="h-8 w-16 bg-zinc-200 rounded mt-2" />
      <div className="h-2.5 w-32 bg-zinc-100 rounded" />
    </div>
  );
}

export function MissionControlSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(5)].map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="h-24 bg-white border border-zinc-200/80 rounded-xl" />
      <div className="h-64 bg-white border border-zinc-200/80 rounded-xl" />
    </div>
  );
}
