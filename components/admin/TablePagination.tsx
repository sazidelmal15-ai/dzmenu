"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  itemLabel?: string;
}

export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  itemLabel = "tenants",
}: TablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  if (total === 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Table pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-zinc-200/80 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs text-zinc-600"
    >
      {/* Showing range summary */}
      <div>
        <span>Showing </span>
        <span className="font-semibold text-zinc-900 font-mono">
          {from}–{to}
        </span>
        <span> of </span>
        <span className="font-semibold text-zinc-900 font-mono">
          {total}
        </span>
        <span> {itemLabel}</span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || isPending}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 py-1 text-xs font-mono text-zinc-500">
          Page <span className="font-semibold text-zinc-900">{page}</span> of{" "}
          <span className="font-semibold text-zinc-900">{Math.max(1, totalPages)}</span>
        </span>

        <button
          type="button"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages || isPending}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}
