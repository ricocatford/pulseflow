import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMProvider } from "../types";

// Mock the gemini client module
vi.mock("../infrastructure/geminiClient", () => ({
  isGeminiAvailable: vi.fn(),
  getModelName: vi.fn().mockReturnValue("gemini-1.5-flash"),
  generateContent: vi.fn(),
}));

import { geminiProvider } from "./geminiProvider";
import * as geminiClient from "../infrastructure/geminiClient";
import { LLM_ERROR_CODES } from "../constants";

describe("geminiProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geminiClient.isGeminiAvailable).mockReturnValue(true);
  });

  describe("provider properties", () => {
    it("should have correct provider identifier", () => {
      expect(geminiProvider.provider).toBe(LLMProvider.GEMINI);
    });

    it("should have correct model name", () => {
      expect(geminiProvider.model).toBe("gemini-1.5-flash");
    });
  });

  describe("isAvailable", () => {
    it("should return true when Gemini is available", () => {
      vi.mocked(geminiClient.isGeminiAvailable).mockReturnValue(true);
      expect(geminiProvider.isAvailable()).toBe(true);
    });

    it("should return false when Gemini is not available", () => {
      vi.mocked(geminiClient.isGeminiAvailable).mockReturnValue(false);
      expect(geminiProvider.isAvailable()).toBe(false);
    });
  });

  describe("summarize", () => {
    it("should return error when provider is not available", async () => {
      vi.mocked(geminiClient.isGeminiAvailable).mockReturnValue(false);

      const result = await geminiProvider.summarize({
        content: "A".repeat(100),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(LLM_ERROR_CODES.PROVIDER_UNAVAILABLE);
      }
    });

    it("should call generateContent and return summary on success", async () => {
      vi.mocked(geminiClient.generateContent).mockResolvedValue({
        text: "This is a test summary.",
        tokensUsed: 50,
      });

      const result = await geminiProvider.summarize({
        content: "A".repeat(100),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe("This is a test summary.");
        expect(result.data.provider).toBe(LLMProvider.GEMINI);
        expect(result.data.model).toBe("gemini-1.5-flash");
        expect(result.data.tokensUsed).toBe(50);
        expect(result.data.dryRun).toBe(false);
      }
    });

    it("should return dry run result without API call", async () => {
      const result = await geminiProvider.summarize({
        content: "A".repeat(100),
        dryRun: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(true);
      }
      expect(geminiClient.generateContent).not.toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(geminiClient.generateContent).mockRejectedValue(
        new Error("API error")
      );

      const result = await geminiProvider.summarize({
        content: "A".repeat(100),
        maxRetries: 1,
      });

      expect(result.success).toBe(false);
    });
  });
});
