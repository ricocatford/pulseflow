import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { IconArrowLeft, IconClock } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPulseById } from "@/actions/pulses";
import { PulseStatusBadge } from "@/components/features/pulses/PulseStatusBadge";
import { PulseDiffView } from "@/components/features/pulses/PulseDiffView";

interface PulseDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function PulseDetailPage({
  params,
}: PulseDetailPageProps) {
  const { id } = await params;
  const result = await getPulseById(id);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Failed to load pulse</p>
      </div>
    );
  }

  const { pulse, previousPulse } = result.data;

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/signals/${pulse.signal.id}` as Route}
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="mr-1 h-4 w-4" />
          Back to {pulse.signal.name}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                Pulse #{pulse.id.slice(-6)}
              </h1>
              <PulseStatusBadge status={pulse.status} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <IconClock className="h-4 w-4" />
              {formatDateTime(pulse.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pulse Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pulse Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Signal
                </p>
                <Link
                  href={`/dashboard/signals/${pulse.signal.id}` as Route}
                  className="mt-1 block font-medium hover:underline"
                >
                  {pulse.signal.name}
                </Link>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <div className="mt-1">
                  <PulseStatusBadge status={pulse.status} />
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Collected At
                </p>
                <p className="mt-1">{formatDateTime(pulse.createdAt)}</p>
              </div>

              {previousPulse && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Previous Pulse
                    </p>
                    <Link
                      href={`/dashboard/pulses/${previousPulse.id}` as Route}
                      className="mt-1 block text-sm hover:underline"
                    >
                      #{previousPulse.id.slice(-6)} -{" "}
                      {formatDateTime(previousPulse.createdAt)}
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {pulse.summary && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
                <CardDescription>
                  LLM-generated summary of the content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{pulse.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Content Diff */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                {previousPulse
                  ? "Comparison with previous pulse"
                  : "Collected data from this pulse"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PulseDiffView
                currentData={pulse.rawData}
                previousData={previousPulse?.rawData ?? null}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
