import Parser from "rss-parser";
import { IScraperProvider, ScraperOptions, ScraperStrategy, ScrapeResult } from "../types";
import { createBaseProvider } from "./baseProvider";

const parser = new Parser();

function isRssUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes("/feed") ||
    lowerUrl.includes("/rss") ||
    lowerUrl.endsWith(".xml") ||
    lowerUrl.includes("atom")
  );
}

async function scrapeRss(options: ScraperOptions): Promise<{ success: true; data: ScrapeResult }> {
  const { url } = options;
  const feed = await parser.parseURL(url);

  const items = (feed.items ?? []).map((item) => ({
    title: item.title ?? "Untitled",
    url: item.link ?? url,
    content: item.contentSnippet ?? item.content ?? undefined,
    author: item.creator ?? item.author ?? undefined,
    publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
    metadata: {
      guid: item.guid,
      categories: item.categories,
    },
  }));

  return {
    success: true as const,
    data: {
      items,
      scrapedAt: new Date(),
      provider: ScraperStrategy.RSS,
      dryRun: false,
    },
  };
}

export const genericRssProvider: IScraperProvider = createBaseProvider({
  strategy: ScraperStrategy.RSS,
  canHandleFn: isRssUrl,
  scrapeFn: scrapeRss,
});
