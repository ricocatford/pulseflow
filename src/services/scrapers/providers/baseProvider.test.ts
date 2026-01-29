import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBaseProvider } from "./baseProvider";
import { ScraperStrategy } from "../types";
import * as rateLimiter from "../infrastructure/rateLimiter";
import * as robotsChecker from "../infrastructure/robotsChecker";

vi.mock("../infrastructure/rateLimiter", () => ({
  waitForRateLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../infrastructure/robotsChecker", () => ({
  isUrlAllowed: vi.fn().mockResolvedValue(true),
}));

describe("baseProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBaseProvider", () => {
    it("should create a provider with the correct strategy", () => {
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn: async () => ({
          success: true as const,
          data: {
            items: [],
            scrapedAt: new Date(),
            provider: ScraperStrategy.HTML,
            dryRun: false,
          },
        }),
      });

      expect(provider.strategy).toBe(ScraperStrategy.HTML);
    });

    it("should use canHandleFn for canHandle", () => {
      const canHandleFn = vi.fn().mockReturnValue(true);
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn,
        scrapeFn: async () => ({
          success: true as const,
          data: {
            items: [],
            scrapedAt: new Date(),
            provider: ScraperStrategy.HTML,
            dryRun: false,
          },
        }),
      });

      const result = provider.canHandle("https://example.com");
      expect(canHandleFn).toHaveBeenCalledWith("https://example.com");
      expect(result).toBe(true);
    });
  });

  describe("dry run mode", () => {
    it("should return empty result without making requests in dry run mode", async () => {
      const scrapeFn = vi.fn();
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn,
      });

      const result = await provider.scrape({
        url: "https://example.com",
        dryRun: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(true);
        expect(result.data.items).toEqual([]);
      }
      expect(scrapeFn).not.toHaveBeenCalled();
      expect(rateLimiter.waitForRateLimit).not.toHaveBeenCalled();
    });
  });

  describe("blocked domains", () => {
    it("should return error for blocked domains", async () => {
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn: async () => ({
          success: true as const,
          data: {
            items: [],
            scrapedAt: new Date(),
            provider: ScraperStrategy.HTML,
            dryRun: false,
          },
        }),
      });

      const result = await provider.scrape({
        url: "https://amazon.com/product",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BLOCKED_DOMAIN");
      }
    });

    it("should block subdomains of blocked domains", async () => {
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn: async () => ({
          success: true as const,
          data: {
            items: [],
            scrapedAt: new Date(),
            provider: ScraperStrategy.HTML,
            dryRun: false,
          },
        }),
      });

      const result = await provider.scrape({
        url: "https://shop.amazon.com/product",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BLOCKED_DOMAIN");
      }
    });
  });

  describe("robots.txt compliance", () => {
    it("should return error when URL is disallowed by robots.txt", async () => {
      vi.mocked(robotsChecker.isUrlAllowed).mockResolvedValueOnce(false);

      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn: async () => ({
          success: true as const,
          data: {
            items: [],
            scrapedAt: new Date(),
            provider: ScraperStrategy.HTML,
            dryRun: false,
          },
        }),
      });

      const result = await provider.scrape({
        url: "https://example.com/private",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("ROBOTS_DISALLOWED");
      }
    });
  });

  describe("rate limiting", () => {
    it("should apply rate limiting before scraping", async () => {
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn: async () => ({
          success: true as const,
          data: {
            items: [],
            scrapedAt: new Date(),
            provider: ScraperStrategy.HTML,
            dryRun: false,
          },
        }),
      });

      await provider.scrape({
        url: "https://example.com",
        delayMs: 3000,
      });

      expect(rateLimiter.waitForRateLimit).toHaveBeenCalledWith(
        "https://example.com",
        3000
      );
    });
  });

  describe("retry logic", () => {
    it("should retry on failure with exponential backoff", async () => {
      let attempts = 0;
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn: async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Temporary failure");
          }
          return {
            success: true as const,
            data: {
              items: [],
              scrapedAt: new Date(),
              provider: ScraperStrategy.HTML,
              dryRun: false,
            },
          };
        },
      });

      const result = await provider.scrape({
        url: "https://example.com",
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it("should return error after max retries exhausted", async () => {
      const provider = createBaseProvider({
        strategy: ScraperStrategy.HTML,
        canHandleFn: () => true,
        scrapeFn: async () => {
          throw new Error("Persistent failure");
        },
      });

      const result = await provider.scrape({
        url: "https://example.com",
        maxRetries: 2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("SCRAPE_FAILED");
        expect(result.error.message).toContain("after 2 retries");
      }
    });
  });
});
