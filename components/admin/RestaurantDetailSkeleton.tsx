import React from "react";

export function RestaurantDetailSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start gap-3.5 pb-5 border-b border-zinc-100">
        <div className="h-12 w-12 rounded-xl bg-zinc-200 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 bg-zinc-200 rounded" />
          <div className="h-3 w-28 bg-zinc-100 rounded" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-4 w-16 bg-zinc-200 rounded-md" />
            <div className="h-4 w-20 bg-zinc-100 rounded-md" />
          </div>
        </div>
      </div>

      {/* Subscription Card Skeleton */}
      <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-4 space-y-3">
        <div className="h-3 w-24 bg-zinc-200 rounded" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <div className="h-2.5 w-12 bg-zinc-200 rounded" />
            <div className="h-4 w-20 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-12 bg-zinc-200 rounded" />
            <div className="h-4 w-24 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-16 bg-zinc-200 rounded" />
            <div className="h-4 w-28 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-16 bg-zinc-200 rounded" />
            <div className="h-4 w-24 bg-zinc-200 rounded" />
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="h-9 bg-zinc-200 rounded-lg" />
        <div className="h-9 bg-zinc-200 rounded-lg" />
        <div className="h-9 bg-zinc-200 rounded-lg" />
        <div className="h-9 bg-zinc-200 rounded-lg" />
      </div>

      {/* Activity Feed Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="h-3.5 w-28 bg-zinc-200 rounded" />
        <div className="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-3 bg-white border border-zinc-200/70 rounded-lg space-y-2"
            >
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-32 bg-zinc-200 rounded" />
                <div className="h-2.5 w-16 bg-zinc-100 rounded" />
              </div>
              <div className="h-2.5 w-44 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
