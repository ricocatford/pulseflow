import { describe, it, expect } from "vitest";
import { buildSummarizePrompt, getContentTypeFromStrategy } from "./summarize";
import { ContentType } from "../types";
import { DEFAULT_MAX_SUMMARY_LENGTH } from "../constants";

describe("summarize prompts", () => {
  describe("buildSummarizePrompt", () => {
    it("should build a prompt with default content type and max length", () => {
      const content = "This is test content for summarization.";
      const prompt = buildSummarizePrompt(content);

      expect(prompt).toContain(content);
      expect(prompt).toContain(`Maximum summary length: ${DEFAULT_MAX_SUMMARY_LENGTH}`);
      expect(prompt).toContain("general web content");
    });

    it("should include RSS-specific instructions for RSS content type", () => {
      const content = "RSS feed content here.";
      const prompt = buildSummarizePrompt(content, ContentType.RSS);

      expect(prompt).toContain("RSS feed content");
      expect(prompt).toContain("Main headlines");
      expect(prompt).toContain("Key developments");
    });

    it("should include social-specific instructions for SOCIAL content type", () => {
      const content = "Social media discussion here.";
      const prompt = buildSummarizePrompt(content, ContentType.SOCIAL);

      expect(prompt).toContain("social media content");
      expect(prompt).toContain("Community sentiment");
      expect(prompt).toContain("Top-voted");
    });

    it("should include article-specific instructions for ARTICLE content type", () => {
      const content = "Long form article here.";
      const prompt = buildSummarizePrompt(content, ContentType.ARTICLE);

      expect(prompt).toContain("long-form article");
      expect(prompt).toContain("Main thesis");
      expect(prompt).toContain("Key supporting points");
    });

    it("should use custom max length when provided", () => {
      const content = "Test content.";
      const maxLength = 300;
      const prompt = buildSummarizePrompt(content, ContentType.GENERIC, maxLength);

      expect(prompt).toContain(`Maximum summary length: ${maxLength}`);
    });

    it("should include base system prompt guidelines", () => {
      const content = "Test content.";
      const prompt = buildSummarizePrompt(content);

      expect(prompt).toContain("concise content summarizer");
      expect(prompt).toContain("Be concise and direct");
      expect(prompt).toContain("Focus on key facts");
    });
  });

  describe("getContentTypeFromStrategy", () => {
    it("should return RSS content type for RSS strategy", () => {
      expect(getContentTypeFromStrategy("RSS")).toBe(ContentType.RSS);
      expect(getContentTypeFromStrategy("rss")).toBe(ContentType.RSS);
    });

    it("should return SOCIAL content type for Reddit strategy", () => {
      expect(getContentTypeFromStrategy("REDDIT")).toBe(ContentType.SOCIAL);
      expect(getContentTypeFromStrategy("reddit")).toBe(ContentType.SOCIAL);
    });

    it("should return SOCIAL content type for HackerNews strategy", () => {
      expect(getContentTypeFromStrategy("HACKERNEWS")).toBe(ContentType.SOCIAL);
      expect(getContentTypeFromStrategy("hackernews")).toBe(ContentType.SOCIAL);
    });

    it("should return ARTICLE content type for HTML strategy", () => {
      expect(getContentTypeFromStrategy("HTML")).toBe(ContentType.ARTICLE);
      expect(getContentTypeFromStrategy("html")).toBe(ContentType.ARTICLE);
    });

    it("should return GENERIC content type for unknown strategies", () => {
      expect(getContentTypeFromStrategy("AUTO")).toBe(ContentType.GENERIC);
      expect(getContentTypeFromStrategy("unknown")).toBe(ContentType.GENERIC);
      expect(getContentTypeFromStrategy("")).toBe(ContentType.GENERIC);
    });
  });
});
