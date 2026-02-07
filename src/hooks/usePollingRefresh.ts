"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface UsePollingRefreshOptions {
  intervalMs?: number;
  maxDurationMs?: number;
}

export function usePollingRefresh({
  intervalMs = 5000,
  maxDurationMs = 60000,
}: UsePollingRefreshOptions = {}) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    intervalRef.current = setInterval(() => {
      router.refresh();
    }, intervalMs);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
    }, maxDurationMs);
  }, [router, intervalMs, maxDurationMs, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { startPolling, stopPolling, isPolling: isPollingRef };
}
