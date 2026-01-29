import { describe, it, expect, beforeEach } from "vitest";
import {
  waitForRateLimit,
  getLastRequestTime,
  clearRateLimits,
} from "./rateLimiter";

describe("rateLimiter", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  describe("waitForRateLimit", () => {
    it("should not delay the first request to a domain", async () => {
      const start = Date.now();
      await waitForRateLimit("https://example.com/page1", 2000);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it("should delay subsequent requests to the same domain", async () => {
      await waitForRateLimit("https://example.com/page1", 500);

      const start = Date.now();
      await waitForRateLimit("https://example.com/page2", 500);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(400);
      expect(elapsed).toBeLessThan(600);
    });

    it("should not delay requests to different domains", async () => {
      await waitForRateLimit("https://example.com/page1", 2000);

      const start = Date.now();
      await waitForRateLimit("https://other.com/page1", 2000);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it("should handle the same domain with different paths", async () => {
      await waitForRateLimit("https://example.com/path1", 500);

      const start = Date.now();
      await waitForRateLimit("https://example.com/path2", 500);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(400);
    });
  });

  describe("getLastRequestTime", () => {
    it("should return null for unknown domains", () => {
      const result = getLastRequestTime("https://unknown.com");
      expect(result).toBeNull();
    });

    it("should return the last request time for known domains", async () => {
      const before = Date.now();
      await waitForRateLimit("https://example.com/page", 100);
      const after = Date.now();

      const lastTime = getLastRequestTime("https://example.com/page");
      expect(lastTime).not.toBeNull();
      expect(lastTime).toBeGreaterThanOrEqual(before);
      expect(lastTime).toBeLessThanOrEqual(after);
    });
  });

  describe("clearRateLimits", () => {
    it("should clear all rate limit entries", async () => {
      await waitForRateLimit("https://example.com", 100);
      expect(getLastRequestTime("https://example.com")).not.toBeNull();

      clearRateLimits();
      expect(getLastRequestTime("https://example.com")).toBeNull();
    });
  });
});
