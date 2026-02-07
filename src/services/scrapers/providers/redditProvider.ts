import { httpGetJson } from "../infrastructure/httpClient";
import { IScraperProvider, ScraperOptions, ScraperStrategy, ScrapeResult } from "../types";
import { createBaseProvider } from "./baseProvider";

interface RedditPost {
  data: {
    title: string;
    url: string;
    selftext?: string;
    author: string;
    created_utc: number;
    permalink: string;
    score: number;
    num_comments: number;
    subreddit: string;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
    after?: string;
  };
}

function isRedditUrl(url: string): boolean {
  const hostname = new URL(url).hostname;
  return hostname.includes("reddit.com");
}

function toJsonUrl(url: string): string {
  const parsed = new URL(url);
  // Use old.reddit.com — www.reddit.com blocks unauthenticated .json requests
  parsed.hostname = "old.reddit.com";
  // Remove trailing slash and add .json
  let path = parsed.pathname.replace(/\/$/, "");
  if (!path.endsWith(".json")) {
    path += ".json";
  }
  parsed.pathname = path;
  // raw_json=1 prevents Reddit from HTML-encoding characters in responses
  parsed.searchParams.set("raw_json", "1");
  return parsed.toString();
}

async function scrapeReddit(options: ScraperOptions): Promise<{ success: true; data: ScrapeResult }> {
  const { url } = options;
  const jsonUrl = toJsonUrl(url);

  const response = await httpGetJson<RedditListing>(jsonUrl);

  const items = response.data.children.map((post) => ({
    title: post.data.title,
    url: `https://reddit.com${post.data.permalink}`,
    content: post.data.selftext || undefined,
    author: post.data.author,
    publishedAt: new Date(post.data.created_utc * 1000),
    metadata: {
      score: post.data.score,
      numComments: post.data.num_comments,
      subreddit: post.data.subreddit,
      originalUrl: post.data.url,
    },
  }));

  return {
    success: true as const,
    data: {
      items,
      scrapedAt: new Date(),
      provider: ScraperStrategy.REDDIT,
      dryRun: false,
    },
  };
}

export const redditProvider: IScraperProvider = createBaseProvider({
  strategy: ScraperStrategy.REDDIT,
  canHandleFn: isRedditUrl,
  scrapeFn: scrapeReddit,
  // Reddit's .json API is a public structured data endpoint, not HTML scraping.
  // Reddit's robots.txt blocks generic bots from all paths, but the JSON API
  // is explicitly intended for programmatic access.
  skipRobotsCheck: true,
});
