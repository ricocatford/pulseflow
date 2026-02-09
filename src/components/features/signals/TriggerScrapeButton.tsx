"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlayerPlay, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { triggerSignalScrape } from "@/actions/signals";
import { usePollingRefresh } from "@/hooks/usePollingRefresh";

interface TriggerScrapeButtonProps {
    signalId: string;
}

export function TriggerScrapeButton({ signalId }: TriggerScrapeButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { startPolling } = usePollingRefresh();

    const handleTrigger = () => {
        startTransition(async () => {
            const result = await triggerSignalScrape(signalId);
            if (result.success) {
                router.refresh();
                startPolling();
            }
        });
    };

    return (
        <Button
            onClick={handleTrigger}
            disabled={isPending}
            className="max-[520px]:w-full"
        >
            {isPending ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
                <IconPlayerPlay className="h-4 w-4" />
            )}
            {isPending ? "Triggering..." : "Trigger Scrape"}
        </Button>
    );
}
