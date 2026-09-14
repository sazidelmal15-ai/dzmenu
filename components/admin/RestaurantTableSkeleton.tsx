import React from "react";

export function RestaurantTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/75">
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Owner
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Subscription Expiry
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Created
              </th>
              <th className="py-3 px-4 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {[...Array(rowCount)].map((_, i) => (
              <tr key={i} className="hover:bg-zinc-50/50">
                {/* Restaurant */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-200 flex-shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-zinc-200 rounded" />
                      <div className="h-2.5 w-16 bg-zinc-100 rounded" />
                    </div>
                  </div>
                </td>

                {/* Owner */}
                <td className="py-3.5 px-4">
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-zinc-200 rounded" />
                    <div className="h-2.5 w-28 bg-zinc-100 rounded" />
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <div className="h-5 w-16 bg-zinc-200 rounded-md" />
                </td>

                {/* Plan */}
                <td className="py-3.5 px-4">
                  <div className="h-4 w-20 bg-zinc-200 rounded" />
                </td>

                {/* Expiry */}
                <td className="py-3.5 px-4">
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-zinc-200 rounded" />
                    <div className="h-2 w-14 bg-zinc-100 rounded" />
                  </div>
                </td>

                {/* Created */}
                <td className="py-3.5 px-4">
                  <div className="h-3 w-20 bg-zinc-100 rounded" />
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="h-6 w-6 bg-zinc-200 rounded ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
