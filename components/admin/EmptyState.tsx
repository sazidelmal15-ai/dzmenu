import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No data found",
  description = "There are no records matching your criteria yet.",
  icon = <Inbox className="h-8 w-8 text-zinc-400" />,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200/80 mb-3 text-zinc-500">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
