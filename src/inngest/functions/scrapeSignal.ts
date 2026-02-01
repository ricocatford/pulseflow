import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import {
  getProviderForUrl,
  getProviderForStrategy,
  ScraperStrategy,
} from "@/services/scrapers";
import {
  getDefaultLLMProvider,
  getContentTypeFromStrategy,
  isLLMAvailable,
} from "@/services/llm";
import {
  detectChanges,
  emailProvider,
  webhookProvider,
  isEmailProviderAvailable,
  AlertChannel,
  ComparableItem,
  ChangeDetectionResult,
} from "@/services/alerts";

interface ScrapeSignalEvent {
  data: {
    signalId: string;
    dryRun?: boolean;
  };
}

interface SerializedScrapedItem {
  title: string;
  url: string;
  content?: string;
  author?: string;
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

    // Step 4: Summarize content (if scrape succeeded and LLM is available)
    let summaryText: string | null = null;

    if (result.success && result.data.items.length > 0 && isLLMAvailable()) {
      const summaryResult = await step.run("summarize-content", async () => {
        const llmProvider = getDefaultLLMProvider();
        const contentToSummarize = prepareContentForSummary(result.data.items);
        const contentType = getContentTypeFromStrategy(result.data.provider);

        return llmProvider.summarize({
          content: contentToSummarize,
          contentType,
          dryRun,
          maxLength: 500,
        });
      });

      if (summaryResult.success) {
        summaryText = summaryResult.data.summary;
      }
    }

    // Step 5: Store pulse and update signal
    const pulse = await step.run("store-pulse", async () => {
      const pulseData = {
        signalId: signal.id,
        rawData: result.success
          ? JSON.stringify(result.data.items)
          : JSON.stringify({ error: result.error.message }),
        summary: summaryText,
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

    // Step 6: Detect changes (compare with previous pulse)
    let changeResult: ChangeDetectionResult | null = null;

    if (result.success && result.data.items.length > 0) {
      changeResult = await step.run("detect-changes", async () => {
        // Get the previous pulse to compare against
        const previousPulse = await prisma.pulse.findFirst({
          where: {
            signalId: signal.id,
            status: "SUCCESS",
            id: { not: pulse.id },
          },
          orderBy: { createdAt: "desc" },
        });

        // Convert scraped items to comparable items
        const currentItems: ComparableItem[] = result.data.items.map((item) => ({
          id: item.url,
          title: item.title,
          content: item.content,
          url: item.url,
          author: item.author,
        }));

        // Parse previous items if they exist
        const previousItems: ComparableItem[] = previousPulse
          ? JSON.parse(previousPulse.rawData).map((item: SerializedScrapedItem) => ({
              id: item.url,
              title: item.title,
              content: item.content,
              url: item.url,
              author: item.author,
            }))
          : [];

        return detectChanges({
          previous: previousItems,
          current: currentItems,
          minNewItems: 1,
          detectRemovals: false,
          detectUpdates: false,
        });
      });
    }

    // Step 7: Send alerts (if changes detected and destinations exist)
    let alertsSent = 0;

    if (changeResult?.hasChanges) {
      alertsSent = await step.run("send-alerts", async () => {
        // Get alert destinations for this signal
        const destinations = await prisma.alertDestination.findMany({
          where: { signalId: signal.id, isActive: true },
        });

        if (destinations.length === 0) {
          return 0;
        }

        let sentCount = 0;

        for (const dest of destinations) {
          const alertOptions = {
            destination: dest.destination,
            signal: { id: signal.id, name: signal.name, url: signal.url },
            change: changeResult!,
            pulseId: pulse.id,
            dryRun,
          };

          let deliveryResult;

          if (dest.channel === AlertChannel.WEBHOOK) {
            deliveryResult = await webhookProvider.send(alertOptions);
          } else if (dest.channel === AlertChannel.EMAIL) {
            if (!isEmailProviderAvailable()) {
              console.warn(`[ALERT] Email not configured, skipping ${dest.destination}`);
              continue;
            }
            deliveryResult = await emailProvider.send(alertOptions);
          } else {
            console.warn(`[ALERT] Unknown channel ${dest.channel}, skipping`);
            continue;
          }

          // Record alert in database
          await prisma.alert.create({
            data: {
              pulseId: pulse.id,
              changeType: changeResult!.changeType!,
              changeSummary: changeResult!.summary,
              changeDetails: JSON.stringify(changeResult!.details),
              status: deliveryResult.success ? "SENT" : "FAILED",
              deliveredAt: deliveryResult.success ? new Date() : null,
              errorMessage: deliveryResult.success ? null : deliveryResult.error.message,
            },
          });

          if (deliveryResult.success) {
            sentCount++;
          }
        }

        return sentCount;
      });
    }

    return {
      status: result.success ? "success" : "failed",
      signalId,
      pulseId: pulse.id,
      itemCount: result.success ? result.data.items.length : 0,
      provider: result.success ? result.data.provider : null,
      summarized: summaryText !== null,
      changesDetected: changeResult?.hasChanges ?? false,
      alertsSent,
      dryRun,
    };
  }
);

/**
 * Prepare scraped items for summarization
 */
function prepareContentForSummary(items: SerializedScrapedItem[]): string {
  return items
    .map((item, index) => {
      const parts = [`${index + 1}. ${item.title}`];
      if (item.content) {
        parts.push(item.content);
      }
      if (item.author) {
        parts.push(`Author: ${item.author}`);
      }
      return parts.join("\n");
    })
    .join("\n\n");
}
