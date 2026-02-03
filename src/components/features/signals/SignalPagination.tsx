"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useSignalFilters } from "@/hooks/useSignalFilters";

interface SignalPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
}

export function SignalPagination({
  currentPage,
  totalPages,
  total,
}: SignalPaginationProps) {
  const { setPage } = useSignalFilters();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t px-4 py-4">
      <p className="text-sm text-muted-foreground">
        {total} signal{total !== 1 ? "s" : ""} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <IconChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <IconChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
