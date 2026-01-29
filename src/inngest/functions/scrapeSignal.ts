import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import {
  getProviderForUrl,
  getProviderForStrategy,
  ScraperStrategy,
} from "@/services/scrapers";

interface ScrapeSignalEvent {
  data: {
    signalId: string;
    dryRun?: boolean;
  };
}

export const scrapeSignal = inngest.createFunction(
  {
    id: "scrape-signal",
    name: "Scrape Signal",
    retries: 0, // We handle retries internally
  },
  { event: "signal/scrape.requested" },
  async ({ event, step }) => {
    const { signalId, dryRun = false } = event.data as ScrapeSignalEvent["data"];

    // Step 1: Fetch signal from database
    const signal = await step.run("fetch-signal", async () => {
      const signal = await prisma.signal.findUnique({
        where: { id: signalId },
      });

      if (!signal) {
        throw new Error(`Signal not found: ${signalId}`);
      }

      return signal;
    });

    // Step 2: Check if signal is active
    if (!signal.isActive) {
      return {
        status: "skipped",
        reason: "Signal is inactive",
        signalId,
      };
    }

    // Step 3: Execute scrape
    const result = await step.run("execute-scrape", async () => {
      const provider =
        signal.strategy === "AUTO"
          ? getProviderForUrl(signal.url)
          : getProviderForStrategy(signal.strategy as ScraperStrategy);

      return provider.scrape({
        url: signal.url,
        dryRun,
        selector: signal.selector ?? undefined,
      });
    });

    // Step 5: Store pulse and update signal
    const pulse = await step.run("store-pulse", async () => {
      const pulseData = {
        signalId: signal.id,
        rawData: result.success
          ? JSON.stringify(result.data.items)
          : JSON.stringify({ error: result.error.message }),
        status: result.success ? "SUCCESS" : "FAILED",
      };

      const [pulse] = await prisma.$transaction([
        prisma.pulse.create({
          data: pulseData,
        }),
        prisma.signal.update({
          where: { id: signal.id },
          data: { lastScrapedAt: new Date() },
        }),
      ]);

      return pulse;
    });

    return {
      status: result.success ? "success" : "failed",
      signalId,
      pulseId: pulse.id,
      itemCount: result.success ? result.data.items.length : 0,
      provider: result.success ? result.data.provider : null,
      dryRun,
    };
  }
);
