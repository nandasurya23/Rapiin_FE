"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function buildPageItems(totalPages: number, currentPage: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export function Pagination({ currentPage, pageSize, totalItems, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);
  const pageItems = buildPageItems(totalPages, currentPage);

  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-[var(--color-text-muted)]">
        Menampilkan <span className="font-medium text-[var(--color-text)]">{startItem}-{endItem}</span> dari{" "}
        <span className="font-medium text-[var(--color-text)]">{totalItems}</span> data
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageItems.map((page, index) => {
          const previousPage = pageItems[index - 1];
          const shouldShowGap = previousPage && page - previousPage > 1;

          return (
            <div key={page} className="flex items-center gap-1.5">
              {shouldShowGap ? <span className="px-1 text-sm text-[var(--color-text-muted)]">...</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                className={cn(
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-md)] border px-3 text-sm font-medium transition-all duration-[var(--transition-fast)]",
                  currentPage === page
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)] text-[var(--color-primary)] font-semibold"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
                )}
              >
                {page}
              </button>
            </div>
          );
        })}

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
