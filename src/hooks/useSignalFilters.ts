"use client";

import { useQueryState, parseAsString, parseAsInteger } from "nuqs";

export function useSignalFilters() {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all")
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  return {
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    resetFilters,
  };
}
