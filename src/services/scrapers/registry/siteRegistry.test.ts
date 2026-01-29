import { describe, it, expect } from "vitest";
import { getStrategyForUrl } from "./siteRegistry";
import { ScraperStrategy } from "../types";

describe("siteRegistry", () => {
  describe("getStrategyForUrl", () => {
    it("should return REDDIT for reddit.com URLs", () => {
      expect(getStrategyForUrl("https://reddit.com/r/programming")).toBe(
        ScraperStrategy.REDDIT
      );
      expect(getStrategyForUrl("https://www.reddit.com/r/javascript")).toBe(
        ScraperStrategy.REDDIT
      );
      expect(getStrategyForUrl("https://old.reddit.com/r/typescript")).toBe(
        ScraperStrategy.REDDIT
      );
    });

    it("should return HACKERNEWS for news.ycombinator.com URLs", () => {
      expect(getStrategyForUrl("https://news.ycombinator.com")).toBe(
        ScraperStrategy.HACKERNEWS
      );
      expect(getStrategyForUrl("https://news.ycombinator.com/newest")).toBe(
        ScraperStrategy.HACKERNEWS
      );
      expect(getStrategyForUrl("https://news.ycombinator.com/item?id=123")).toBe(
        ScraperStrategy.HACKERNEWS
      );
    });

    it("should return HACKERNEWS for hn.algolia.com URLs", () => {
      expect(getStrategyForUrl("https://hn.algolia.com/api/v1/search")).toBe(
        ScraperStrategy.HACKERNEWS
      );
    });

    it("should return RSS for feed URLs", () => {
      expect(getStrategyForUrl("https://example.com/feed")).toBe(
        ScraperStrategy.RSS
      );
      expect(getStrategyForUrl("https://example.com/feed/")).toBe(
        ScraperStrategy.RSS
      );
      expect(getStrategyForUrl("https://example.com/rss")).toBe(
        ScraperStrategy.RSS
      );
      expect(getStrategyForUrl("https://example.com/rss/")).toBe(
        ScraperStrategy.RSS
      );
    });

    it("should return RSS for XML URLs", () => {
      expect(getStrategyForUrl("https://example.com/feed.xml")).toBe(
        ScraperStrategy.RSS
      );
      expect(getStrategyForUrl("https://example.com/rss.xml")).toBe(
        ScraperStrategy.RSS
      );
    });

    it("should return RSS for atom URLs", () => {
      expect(getStrategyForUrl("https://example.com/atom")).toBe(
        ScraperStrategy.RSS
      );
      expect(getStrategyForUrl("https://example.com/atom/")).toBe(
        ScraperStrategy.RSS
      );
    });

    it("should return HTML for generic URLs", () => {
      expect(getStrategyForUrl("https://example.com")).toBe(
        ScraperStrategy.HTML
      );
      expect(getStrategyForUrl("https://blog.example.com/post/123")).toBe(
        ScraperStrategy.HTML
      );
      expect(getStrategyForUrl("https://news.site.com/article")).toBe(
        ScraperStrategy.HTML
      );
    });
  });
});
