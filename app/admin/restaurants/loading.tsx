import React from "react";
import { RestaurantTableSkeleton } from "@/components/admin";

export default function AdminRestaurantsLoading() {
  return (
    <div className="space-y-4 sm:space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/60">
        <div className="space-y-1.5">
          <div className="h-6 w-48 bg-zinc-200 rounded" />
          <div className="h-3.5 w-80 bg-zinc-100 rounded" />
        </div>
        <div className="h-7 w-28 bg-zinc-100 rounded-md" />
      </div>

      {/* Toolbar skeleton */}
      <div className="h-20 bg-white border border-zinc-200/80 rounded-xl" />

      {/* Table skeleton */}
      <RestaurantTableSkeleton rowCount={6} />

      {/* Pagination skeleton */}
      <div className="h-12 bg-white border border-zinc-200/80 rounded-xl" />
    </div>
  );
}
