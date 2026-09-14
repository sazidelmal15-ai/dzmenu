import React from "react";

export function AuditTableSkeleton() {
  const rows = Array.from({ length: 10 });

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/75">
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Time
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Action
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Actor
              </th>
              <th className="py-3 px-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Summary / Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {/* Time */}
                <td className="py-3.5 px-4 w-32">
                  <div className="h-3.5 bg-zinc-200 rounded-md w-20 mb-1" />
                  <div className="h-2.5 bg-zinc-100 rounded-md w-14" />
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 w-44">
                  <div className="h-5 bg-zinc-200 rounded-full w-28" />
                </td>

                {/* Restaurant */}
                <td className="py-3.5 px-4 w-48">
                  <div className="h-3.5 bg-zinc-200 rounded-md w-32 mb-1" />
                  <div className="h-2.5 bg-zinc-100 rounded-md w-20" />
                </td>

                {/* Actor */}
                <td className="py-3.5 px-4 w-44">
                  <div className="h-3.5 bg-zinc-200 rounded-md w-24 mb-1" />
                  <div className="h-2.5 bg-zinc-100 rounded-md w-36" />
                </td>

                {/* Summary / Reason */}
                <td className="py-3.5 px-4">
                  <div className="h-3.5 bg-zinc-200 rounded-md w-3/4 mb-1" />
                  <div className="h-2.5 bg-zinc-100 rounded-md w-1/2" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
