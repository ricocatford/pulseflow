import { IScraperProvider, ScraperStrategy } from "../types";
import { genericRssProvider } from "../providers/genericRssProvider";
import { redditProvider } from "../providers/redditProvider";
import { hackerNewsProvider } from "../providers/hackerNewsProvider";
import { genericHtmlProvider } from "../providers/genericHtmlProvider";
import { getStrategyForUrl } from "./siteRegistry";

const providers: Map<ScraperStrategy, IScraperProvider> = new Map([
  [ScraperStrategy.RSS, genericRssProvider],
  [ScraperStrategy.REDDIT, redditProvider],
  [ScraperStrategy.HACKERNEWS, hackerNewsProvider],
  [ScraperStrategy.HTML, genericHtmlProvider],
]);

export function getProviderForStrategy(strategy: ScraperStrategy): IScraperProvider {
  if (strategy === ScraperStrategy.AUTO) {
    throw new Error("Cannot get provider for AUTO strategy. Use getProviderForUrl instead.");
  }

  const provider = providers.get(strategy);
  if (!provider) {
    throw new Error(`No provider registered for strategy: ${strategy}`);
  }

  return provider;
}

export function getProviderForUrl(url: string): IScraperProvider {
  const strategy = getStrategyForUrl(url);
  return getProviderForStrategy(strategy);
}

export function getAllProviders(): IScraperProvider[] {
  return Array.from(providers.values());
}
