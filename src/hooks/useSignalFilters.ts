"use client";

import { useCallback } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";

export function useSignalFilters() {
  const [search, setSearchRaw] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      limitUrlUpdates: { method: "debounce", timeMs: 300 },
    })
  );
  const [status, setStatusRaw] = useQueryState(
    "status",
    parseAsString.withDefault("all").withOptions({ shallow: false })
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  const setSearch = useCallback(
    (value: string | ((prev: string) => string)) => {
      setSearchRaw(value);
      setPage(1);
    },
    [setSearchRaw, setPage]
  );

  const setStatus = useCallback(
    (value: string | ((prev: string) => string)) => {
      setStatusRaw(value);
      setPage(1);
    },
    [setStatusRaw, setPage]
  );

  const resetFilters = () => {
    setSearchRaw("");
    setStatusRaw("all");
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
