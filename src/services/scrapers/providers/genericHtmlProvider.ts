import * as cheerio from "cheerio";
import { httpGet } from "../infrastructure/httpClient";
import { IScraperProvider, ScraperOptions, ScraperStrategy, ScrapeResult } from "../types";
import { createBaseProvider } from "./baseProvider";

const DEFAULT_SELECTOR = "article, .post, .entry, main, .content";

async function scrapeHtml(options: ScraperOptions): Promise<{ success: true; data: ScrapeResult }> {
  const { url, selector = DEFAULT_SELECTOR } = options;

  const response = await httpGet(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch ${url}`);
  }

  const $ = cheerio.load(response.text);
  const items: Array<{
    title: string;
    url: string;
    content?: string;
    author?: string;
    publishedAt?: Date;
    metadata?: Record<string, unknown>;
  }> = [];

  // Try to extract items using the selector
  $(selector).each((_, element) => {
    const $el = $(element);

    // Find title - try common patterns
    const title =
      $el.find("h1, h2, h3, .title, [class*='title']").first().text().trim() ||
      $el.find("a").first().text().trim() ||
      "Untitled";

    // Find URL - try common patterns
    const itemUrl =
      $el.find("a[href]").first().attr("href") ||
      $el.find("h1 a, h2 a, h3 a").first().attr("href");

    // Resolve relative URLs
    const resolvedUrl = itemUrl ? new URL(itemUrl, url).toString() : url;

    // Extract content
    const content =
      $el.find("p, .summary, .excerpt, .description").first().text().trim() ||
      $el.text().trim().slice(0, 500);

    // Try to find author
    const author =
      $el.find(".author, [class*='author'], [rel='author']").first().text().trim() ||
      undefined;

    // Try to find date
    const dateStr =
      $el.find("time").attr("datetime") ||
      $el.find(".date, [class*='date'], time").first().text().trim();

    const publishedAt = dateStr ? parseDate(dateStr) : undefined;

    if (title && title !== "Untitled") {
      items.push({
        title,
        url: resolvedUrl,
        content: content || undefined,
        author,
        publishedAt,
        metadata: {
          selector,
        },
      });
    }
  });

  // If no items found with selector, extract basic page info
  if (items.length === 0) {
    const pageTitle = $("title").text().trim() || $("h1").first().text().trim() || "Untitled";
    const pageContent = $("meta[name='description']").attr("content") || $("p").first().text().trim();

    items.push({
      title: pageTitle,
      url,
      content: pageContent || undefined,
      metadata: {
        fallback: true,
      },
    });
  }

  return {
    success: true as const,
    data: {
      items,
      scrapedAt: new Date(),
      provider: ScraperStrategy.HTML,
      dryRun: false,
    },
  };
}

function parseDate(dateStr: string): Date | undefined {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

// HTML provider is the fallback - always returns true for canHandle
// but should be selected last by the factory
export const genericHtmlProvider: IScraperProvider = createBaseProvider({
  strategy: ScraperStrategy.HTML,
  canHandleFn: () => true,
  scrapeFn: scrapeHtml,
});
