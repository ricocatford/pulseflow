import { describe, it, expect } from "vitest";
import {
  getProviderForStrategy,
  getProviderForUrl,
  getAllProviders,
} from "./providerFactory";
import { ScraperStrategy } from "../types";

describe("providerFactory", () => {
  describe("getProviderForStrategy", () => {
    it("should return RSS provider for RSS strategy", () => {
      const provider = getProviderForStrategy(ScraperStrategy.RSS);
      expect(provider.strategy).toBe(ScraperStrategy.RSS);
    });

    it("should return REDDIT provider for REDDIT strategy", () => {
      const provider = getProviderForStrategy(ScraperStrategy.REDDIT);
      expect(provider.strategy).toBe(ScraperStrategy.REDDIT);
    });

    it("should return HACKERNEWS provider for HACKERNEWS strategy", () => {
      const provider = getProviderForStrategy(ScraperStrategy.HACKERNEWS);
      expect(provider.strategy).toBe(ScraperStrategy.HACKERNEWS);
    });

    it("should return HTML provider for HTML strategy", () => {
      const provider = getProviderForStrategy(ScraperStrategy.HTML);
      expect(provider.strategy).toBe(ScraperStrategy.HTML);
    });

    it("should throw error for AUTO strategy", () => {
      expect(() => getProviderForStrategy(ScraperStrategy.AUTO)).toThrow(
        "Cannot get provider for AUTO strategy"
      );
    });
  });

  describe("getProviderForUrl", () => {
    it("should return REDDIT provider for reddit URLs", () => {
      const provider = getProviderForUrl("https://reddit.com/r/programming");
      expect(provider.strategy).toBe(ScraperStrategy.REDDIT);
    });

    it("should return HACKERNEWS provider for HN URLs", () => {
      const provider = getProviderForUrl("https://news.ycombinator.com");
      expect(provider.strategy).toBe(ScraperStrategy.HACKERNEWS);
    });

    it("should return RSS provider for feed URLs", () => {
      const provider = getProviderForUrl("https://example.com/feed");
      expect(provider.strategy).toBe(ScraperStrategy.RSS);
    });

    it("should return HTML provider for generic URLs", () => {
      const provider = getProviderForUrl("https://example.com/blog");
      expect(provider.strategy).toBe(ScraperStrategy.HTML);
    });
  });

  describe("getAllProviders", () => {
    it("should return all registered providers", () => {
      const providers = getAllProviders();
      expect(providers.length).toBe(4);

      const strategies = providers.map((p) => p.strategy);
      expect(strategies).toContain(ScraperStrategy.RSS);
      expect(strategies).toContain(ScraperStrategy.REDDIT);
      expect(strategies).toContain(ScraperStrategy.HACKERNEWS);
      expect(strategies).toContain(ScraperStrategy.HTML);
    });
  });
});
