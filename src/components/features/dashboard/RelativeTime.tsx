"use client";

import { useRelativeTime } from "@/hooks/useRelativeTime";

function formatRelativeTime(date: Date | null): string {
  if (!date) return "Never";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface RelativeTimeProps {
  date: Date | null;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  useRelativeTime();
  return <span className={className}>{formatRelativeTime(date)}</span>;
}
