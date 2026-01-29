import { ScraperStrategy } from "../types";

interface SiteRegistryEntry {
  pattern: RegExp;
  strategy: ScraperStrategy;
}

const siteRegistry: SiteRegistryEntry[] = [
  // Reddit
  {
    pattern: /reddit\.com/i,
    strategy: ScraperStrategy.REDDIT,
  },
  // Hacker News
  {
    pattern: /news\.ycombinator\.com/i,
    strategy: ScraperStrategy.HACKERNEWS,
  },
  {
    pattern: /hn\.algolia\.com/i,
    strategy: ScraperStrategy.HACKERNEWS,
  },
  // RSS feeds
  {
    pattern: /\/feed\/?$/i,
    strategy: ScraperStrategy.RSS,
  },
  {
    pattern: /\/rss\/?$/i,
    strategy: ScraperStrategy.RSS,
  },
  {
    pattern: /\.xml$/i,
    strategy: ScraperStrategy.RSS,
  },
  {
    pattern: /\/atom\/?$/i,
    strategy: ScraperStrategy.RSS,
  },
];

export function getStrategyForUrl(url: string): ScraperStrategy {
  for (const entry of siteRegistry) {
    if (entry.pattern.test(url)) {
      return entry.strategy;
    }
  }
  return ScraperStrategy.HTML;
}

export function registerSite(pattern: RegExp, strategy: ScraperStrategy): void {
  siteRegistry.unshift({ pattern, strategy });
}
