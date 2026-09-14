import React from "react";
import { AlertTriangle, ShieldX } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  isAccessDenied?: boolean;
  action?: React.ReactNode;
}

export function ErrorState({
  title = "An error occurred",
  message,
  isAccessDenied = false,
  action,
}: ErrorStateProps) {
  return (
    <div className="bg-white border border-rose-200/80 rounded-xl p-6 sm:p-8 max-w-lg mx-auto my-8 shadow-sm text-center flex flex-col items-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 mb-3.5">
        {isAccessDenied ? (
          <ShieldX className="h-6 w-6" />
        ) : (
          <AlertTriangle className="h-6 w-6" />
        )}
      </div>

      <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
        {title}
      </h3>

      <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-sm">
        {message}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
