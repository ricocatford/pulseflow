import { AppError, Result, err } from "@/lib/errors";
import {
  BLOCKED_DOMAINS,
  DEFAULT_DELAY_MS,
  DEFAULT_MAX_RETRIES,
  RETRY_DELAYS_MS,
} from "../constants";
import { waitForRateLimit } from "../infrastructure/rateLimiter";
import { isUrlAllowed } from "../infrastructure/robotsChecker";
import {
  IScraperProvider,
  ScraperOptions,
  ScraperStrategy,
  ScrapeResult,
} from "../types";

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isBlockedDomain(url: string): boolean {
  const domain = extractDomain(url);
  return BLOCKED_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  );
}

export interface BaseProviderConfig {
  strategy: ScraperStrategy;
  canHandleFn: (url: string) => boolean;
  scrapeFn: (options: ScraperOptions) => Promise<Result<ScrapeResult>>;
  /** Skip robots.txt check for providers that use structured APIs rather than scraping HTML */
  skipRobotsCheck?: boolean;
}

export function createBaseProvider(config: BaseProviderConfig): IScraperProvider {
  const { strategy, canHandleFn, scrapeFn, skipRobotsCheck = false } = config;

  return {
    strategy,

    canHandle(url: string): boolean {
      return canHandleFn(url);
    },

    async scrape(options: ScraperOptions): Promise<Result<ScrapeResult>> {
      const { url, dryRun = false, delayMs = DEFAULT_DELAY_MS } = options;
      const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

      // Dry run mode - return empty result without making requests
      if (dryRun) {
        console.log(`[DRY RUN] Would scrape ${url} with provider ${strategy}`);
        return {
          success: true,
          data: {
            items: [],
            scrapedAt: new Date(),
            provider: strategy,
            dryRun: true,
          },
        };
      }

      // Check blocked domains
      if (isBlockedDomain(url)) {
        return err(
          new AppError(
            `Domain is blocked: ${extractDomain(url)}`,
            "BLOCKED_DOMAIN",
            403,
            { url }
          )
        );
      }

      // Check robots.txt (skip for providers using structured APIs)
      if (!skipRobotsCheck) {
        const allowed = await isUrlAllowed(url);
        if (!allowed) {
          return err(
            new AppError(
              `URL disallowed by robots.txt: ${url}`,
              "ROBOTS_DISALLOWED",
              403,
              { url }
            )
          );
        }
      }

      // Apply rate limiting
      await waitForRateLimit(url, delayMs);

      // Execute with retry logic
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await scrapeFn(options);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(
            `[Scraper] Attempt ${attempt + 1}/${maxRetries} failed for ${url}:`,
            lastError.message
          );

          if (attempt < maxRetries - 1) {
            const retryDelay = RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      return err(
        new AppError(
          `Scrape failed after ${maxRetries} retries: ${lastError?.message}`,
          "SCRAPE_FAILED",
          500,
          { url, lastError: lastError?.message }
        )
      );
    },
  };
}
