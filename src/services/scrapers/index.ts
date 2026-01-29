// Types
export {
  ScraperStrategy,
  type ScraperOptions,
  type ScrapedItem,
  type ScrapeResult,
  type IScraperProvider,
} from "./types";

// Constants
export {
  BLOCKED_DOMAINS,
  DEFAULT_DELAY_MS,
  DEFAULT_MAX_RETRIES,
  USER_AGENT,
} from "./constants";

// Infrastructure
export { waitForRateLimit, clearRateLimits } from "./infrastructure/rateLimiter";
export { isUrlAllowed, clearRobotsCache } from "./infrastructure/robotsChecker";
export { httpGet, httpGetJson } from "./infrastructure/httpClient";

// Providers
export { genericRssProvider } from "./providers/genericRssProvider";
export { redditProvider } from "./providers/redditProvider";
export { hackerNewsProvider } from "./providers/hackerNewsProvider";
export { genericHtmlProvider } from "./providers/genericHtmlProvider";

// Registry
export { getStrategyForUrl, registerSite } from "./registry/siteRegistry";
export {
  getProviderForStrategy,
  getProviderForUrl,
  getAllProviders,
} from "./registry/providerFactory";
