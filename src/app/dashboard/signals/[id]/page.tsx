import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import {
    IconArrowLeft,
    IconExternalLink,
    IconEdit,
    IconClock,
    IconRadar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSignalById } from "@/actions/signals";
import { SignalStatusBadge } from "@/components/features/signals/SignalStatusBadge";
import { StrategyBadge } from "@/components/features/signals/StrategyBadge";
import { SignalFormDialog } from "@/components/features/signals/SignalFormDialog";
import { TriggerScrapeButton } from "@/components/features/signals/TriggerScrapeButton";
import { PulseTimeline } from "@/components/features/pulses/PulseTimeline";

interface SignalDetailPageProps {
    params: Promise<{ id: string }>;
}

function formatInterval(minutes: number): string {
    if (minutes < 60) return `Every ${minutes} minutes`;
    const hours = minutes / 60;
    return `Every ${hours} hour${hours > 1 ? "s" : ""}`;
}

function formatDate(date: Date | null): string {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export default async function SignalDetailPage({
    params,
}: SignalDetailPageProps) {
    const { id } = await params;
    const result = await getSignalById(id);

    if (!result.success) {
        if (result.error.code === "NOT_FOUND") {
            notFound();
        }
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive">Failed to load signal</p>
            </div>
        );
    }

    const signal = result.data;

    return (
        <>
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={"/dashboard/signals" as Route}
                    className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <IconArrowLeft className="mr-1 h-4 w-4" />
                    Back to Signals
                </Link>

                <div className="mb-8 flex items-center justify-between max-[520px]:flex-col max-[520px]:items-stretch max-[520px]:gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">
                                {signal.name}
                            </h1>
                            <SignalStatusBadge isActive={signal.isActive} />
                        </div>
                        <a
                            href={signal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                            {signal.url}
                            <IconExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <SignalFormDialog signal={signal}>
                            <Button variant="outline">
                                <IconEdit className="h-4 w-4" />
                                Edit
                            </Button>
                        </SignalFormDialog>
                        <TriggerScrapeButton signalId={signal.id} />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Signal Configuration */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IconRadar className="h-5 w-5" />
                                Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Strategy
                                </p>
                                <div className="mt-1">
                                    <StrategyBadge strategy={signal.strategy} />
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Check Interval
                                </p>
                                <p className="mt-1 flex items-center gap-1">
                                    <IconClock className="h-4 w-4" />
                                    {formatInterval(signal.interval)}
                                </p>
                            </div>

                            <Separator />

                            {signal.selector && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            CSS Selector
                                        </p>
                                        <code className="mt-1 block rounded bg-muted p-2 text-sm">
                                            {signal.selector}
                                        </code>
                                    </div>
                                    <Separator />
                                </>
                            )}

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Last Scraped
                                </p>
                                <p className="mt-1">
                                    {formatDate(signal.lastScrapedAt)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Created
                                </p>
                                <p className="mt-1">
                                    {formatDate(signal.createdAt)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Pulses
                                </p>
                                <p className="mt-1 text-2xl font-bold">
                                    {signal._count.pulses}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pulse History */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pulse History</CardTitle>
                            <CardDescription>
                                Recent data collection events for this signal
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PulseTimeline pulses={signal.pulses} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
