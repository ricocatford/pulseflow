import { Result } from "@/lib/errors";

export enum ScraperStrategy {
  RSS = "RSS",
  REDDIT = "REDDIT",
  HACKERNEWS = "HACKERNEWS",
  HTML = "HTML",
  AUTO = "AUTO",
}

export interface ScraperOptions {
  url: string;
  dryRun?: boolean;
  delayMs?: number;
  maxRetries?: number;
  selector?: string;
}

export interface ScrapedItem {
  title: string;
  url: string;
  content?: string;
  author?: string;
  publishedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ScrapeResult {
  items: ScrapedItem[];
  scrapedAt: Date;
  provider: ScraperStrategy;
  dryRun: boolean;
}

export interface IScraperProvider {
  readonly strategy: ScraperStrategy;
  canHandle(url: string): boolean;
  scrape(options: ScraperOptions): Promise<Result<ScrapeResult>>;
}

export interface RateLimitEntry {
  lastRequestAt: number;
  domain: string;
}

export interface RobotsCache {
  rules: RobotsRules | null;
  fetchedAt: number;
  domain: string;
}

export interface RobotsRules {
  isAllowed(url: string, userAgent?: string): boolean;
}
