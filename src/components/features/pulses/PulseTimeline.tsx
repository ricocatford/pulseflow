import Link from "next/link";
import type { Route } from "next";
import { IconCheck, IconX, IconClock } from "@tabler/icons-react";
import { PulseStatusBadge } from "./PulseStatusBadge";
import type { Pulse } from "@prisma/client";

interface PulseTimelineProps {
  pulses: Pulse[];
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getItemCount(rawData: string): number {
  try {
    const data = JSON.parse(rawData);
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export function PulseTimeline({ pulses }: PulseTimelineProps) {
  if (pulses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <IconClock className="h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No pulses yet. Trigger a scrape to collect data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pulses.map((pulse, index) => (
        <div key={pulse.id} className="relative flex gap-4">
          {/* Timeline connector */}
          {index < pulses.length - 1 && (
            <div className="absolute left-[11px] top-6 h-full w-0.5 bg-border" />
          )}

          {/* Status icon */}
          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
            {pulse.status === "SUCCESS" ? (
              <IconCheck className="h-3 w-3 text-green-500" />
            ) : (
              <IconX className="h-3 w-3 text-destructive" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/pulses/${pulse.id}` as Route}
                  className="font-medium hover:underline"
                >
                  Pulse #{pulse.id.slice(-6)}
                </Link>
                <PulseStatusBadge status={pulse.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(pulse.createdAt)}
              </span>
            </div>

            {pulse.status === "SUCCESS" && (
              <div className="mt-1 text-sm text-muted-foreground">
                {getItemCount(pulse.rawData)} items collected
              </div>
            )}

            {pulse.summary && (
              <p className="mt-2 text-sm">{pulse.summary}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
