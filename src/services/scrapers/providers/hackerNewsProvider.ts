import { httpGetJson } from "../infrastructure/httpClient";
import { IScraperProvider, ScraperOptions, ScraperStrategy, ScrapeResult } from "../types";
import { createBaseProvider } from "./baseProvider";

interface HNSearchResult {
  hits: Array<{
    objectID: string;
    title: string;
    url?: string;
    author: string;
    created_at: string;
    points: number;
    num_comments: number;
    story_text?: string;
  }>;
}

const HN_ALGOLIA_API = "https://hn.algolia.com/api/v1";

function isHackerNewsUrl(url: string): boolean {
  const hostname = new URL(url).hostname;
  return hostname.includes("news.ycombinator.com") || hostname.includes("hn.algolia.com");
}

function buildAlgoliaQuery(url: string): string {
  const parsed = new URL(url);

  // Handle different HN URL patterns
  if (parsed.pathname.includes("/newest")) {
    return `${HN_ALGOLIA_API}/search_by_date?tags=story&hitsPerPage=30`;
  }

  if (parsed.pathname.includes("/show")) {
    return `${HN_ALGOLIA_API}/search?tags=show_hn&hitsPerPage=30`;
  }

  if (parsed.pathname.includes("/ask")) {
    return `${HN_ALGOLIA_API}/search?tags=ask_hn&hitsPerPage=30`;
  }

  // Check for search query
  const searchQuery = parsed.searchParams.get("q");
  if (searchQuery) {
    return `${HN_ALGOLIA_API}/search?query=${encodeURIComponent(searchQuery)}&hitsPerPage=30`;
  }

  // Default: front page stories
  return `${HN_ALGOLIA_API}/search?tags=front_page&hitsPerPage=30`;
}

async function scrapeHackerNews(options: ScraperOptions): Promise<{ success: true; data: ScrapeResult }> {
  const { url } = options;
  const apiUrl = buildAlgoliaQuery(url);

  const response = await httpGetJson<HNSearchResult>(apiUrl);

  const items = response.hits.map((hit) => ({
    title: hit.title,
    url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
    content: hit.story_text || undefined,
    author: hit.author,
    publishedAt: new Date(hit.created_at),
    metadata: {
      objectId: hit.objectID,
      points: hit.points,
      numComments: hit.num_comments,
      hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    },
  }));

  return {
    success: true as const,
    data: {
      items,
      scrapedAt: new Date(),
      provider: ScraperStrategy.HACKERNEWS,
      dryRun: false,
    },
  };
}

export const hackerNewsProvider: IScraperProvider = createBaseProvider({
  strategy: ScraperStrategy.HACKERNEWS,
  canHandleFn: isHackerNewsUrl,
  scrapeFn: scrapeHackerNews,
});
