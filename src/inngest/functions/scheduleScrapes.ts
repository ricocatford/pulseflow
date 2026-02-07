import { inngest } from "../client";
import { prisma } from "@/lib/prisma";

export const scheduleScrapes = inngest.createFunction(
  {
    id: "schedule-scrapes",
    name: "Schedule Scrapes",
  },
  { cron: "* * * * *" },
  async ({ step }) => {
    // Step 1: Fetch all active signals with their interval and lastScrapedAt
    const signals = await step.run("fetch-active-signals", async () => {
      return prisma.signal.findMany({
        where: { isActive: true },
        select: {
          id: true,
          interval: true,
          lastScrapedAt: true,
        },
      });
    });

    if (signals.length === 0) {
      return { status: "no-active-signals", dispatched: 0 };
    }

    // Step 2: Filter for signals that are due for scraping
    const now = Date.now();
    const dueSignals = signals.filter((signal) => {
      if (!signal.lastScrapedAt) return true;
      const lastScraped = new Date(signal.lastScrapedAt).getTime();
      const intervalMs = signal.interval * 60 * 1000;
      return lastScraped + intervalMs < now;
    });

    if (dueSignals.length === 0) {
      return { status: "none-due", checked: signals.length, dispatched: 0 };
    }

    // Step 3: Fan out scrape events
    await step.run("dispatch-scrape-events", async () => {
      const events = dueSignals.map((signal) => ({
        name: "signal/scrape.requested" as const,
        data: { signalId: signal.id },
      }));

      await inngest.send(events);
    });

    return {
      status: "dispatched",
      checked: signals.length,
      dispatched: dueSignals.length,
      signalIds: dueSignals.map((s) => s.id),
    };
  }
);
