import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBaseProvider } from "./baseProvider";
import { LLMProvider, ContentType } from "../types";
import {
  DRY_RUN_SUMMARY_PLACEHOLDER,
  LLM_ERROR_CODES,
  MIN_CONTENT_LENGTH,
} from "../constants";

describe("LLM baseProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createTestProvider = (overrides: {
    isAvailable?: boolean;
  } = {}) => {
    const { isAvailable = true } = overrides;

    return createBaseProvider({
      provider: LLMProvider.GEMINI,
      model: "gemini-1.5-flash",
      isAvailableFn: () => isAvailable,
      summarizeFn: async () => ({
        success: true as const,
        data: {
          summary: "Test summary",
          provider: LLMProvider.GEMINI,
          model: "gemini-1.5-flash",
          dryRun: false,
          generatedAt: new Date(),
        },
      }),
    });
  };

  describe("createBaseProvider", () => {
    it("should create a provider with the correct provider and model", () => {
      const provider = createTestProvider();

      expect(provider.provider).toBe(LLMProvider.GEMINI);
      expect(provider.model).toBe("gemini-1.5-flash");
    });

    it("should use isAvailableFn for isAvailable", () => {
      const availableProvider = createTestProvider({ isAvailable: true });
      const unavailableProvider = createTestProvider({ isAvailable: false });

      expect(availableProvider.isAvailable()).toBe(true);
      expect(unavailableProvider.isAvailable()).toBe(false);
    });
  });

  describe("dry run mode", () => {
    it("should return placeholder without making API call in dry run mode", async () => {
      const summarizeFn = vi.fn();
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn,
      });

      const result = await provider.summarize({
        content: "A".repeat(100),
        dryRun: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(true);
        expect(result.data.summary).toBe(DRY_RUN_SUMMARY_PLACEHOLDER);
      }
      expect(summarizeFn).not.toHaveBeenCalled();
    });
  });

  describe("provider availability", () => {
    it("should return error when provider is not available", async () => {
      const provider = createTestProvider({ isAvailable: false });

      const result = await provider.summarize({
        content: "A".repeat(100),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(LLM_ERROR_CODES.PROVIDER_UNAVAILABLE);
      }
    });
  });

  describe("content validation", () => {
    it("should return error for content shorter than minimum length", async () => {
      const provider = createTestProvider();

      const result = await provider.summarize({
        content: "Short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(LLM_ERROR_CODES.CONTENT_TOO_SHORT);
        expect(result.error.message).toContain(MIN_CONTENT_LENGTH.toString());
      }
    });

    it("should return error for empty content", async () => {
      const provider = createTestProvider();

      const result = await provider.summarize({
        content: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(LLM_ERROR_CODES.CONTENT_TOO_SHORT);
      }
    });

    it("should truncate content that exceeds maximum length", async () => {
      let receivedContent = "";
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn: async (options) => {
          receivedContent = options.content;
          return {
            success: true as const,
            data: {
              summary: "Test summary",
              provider: LLMProvider.GEMINI,
              model: "gemini-1.5-flash",
              dryRun: false,
              generatedAt: new Date(),
            },
          };
        },
      });

      // Content longer than MAX_INPUT_CONTENT_LENGTH (30000)
      const longContent = "A".repeat(35000);
      await provider.summarize({ content: longContent });

      expect(receivedContent.length).toBe(30000);
    });
  });

  describe("retry logic", () => {
    it("should retry on failure with exponential backoff", async () => {
      let attempts = 0;
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn: async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Temporary failure");
          }
          return {
            success: true as const,
            data: {
              summary: "Test summary",
              provider: LLMProvider.GEMINI,
              model: "gemini-1.5-flash",
              dryRun: false,
              generatedAt: new Date(),
            },
          };
        },
      });

      const result = await provider.summarize({
        content: "A".repeat(100),
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it("should return error after max retries exhausted", async () => {
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn: async () => {
          throw new Error("Persistent failure");
        },
      });

      const result = await provider.summarize({
        content: "A".repeat(100),
        maxRetries: 2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(LLM_ERROR_CODES.SUMMARIZE_FAILED);
        expect(result.error.message).toContain("after 2 retries");
      }
    });

    it("should not retry on auth errors", async () => {
      let attempts = 0;
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn: async () => {
          attempts++;
          throw new Error("Invalid API key");
        },
      });

      const result = await provider.summarize({
        content: "A".repeat(100),
        maxRetries: 3,
      });

      expect(attempts).toBe(1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(LLM_ERROR_CODES.AUTH_ERROR);
      }
    });
  });

  describe("error mapping", () => {
    it("should map rate limit errors correctly", async () => {
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn: async () => {
          throw new Error("Rate limit exceeded");
        },
      });

      const result = await provider.summarize({
        content: "A".repeat(100),
        maxRetries: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // After retries exhausted, we get SUMMARIZE_FAILED with the rate limit error in message
        expect(result.error.code).toBe(LLM_ERROR_CODES.SUMMARIZE_FAILED);
        expect(result.error.message).toContain("rate limit");
      }
    });

    it("should map empty response errors correctly", async () => {
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn: async () => {
          throw new Error("Empty response from API");
        },
      });

      const result = await provider.summarize({
        content: "A".repeat(100),
        maxRetries: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // After retries exhausted, we get SUMMARIZE_FAILED with the empty response error in message
        expect(result.error.code).toBe(LLM_ERROR_CODES.SUMMARIZE_FAILED);
        expect(result.error.message).toContain("empty response");
      }
    });
  });

  describe("options handling", () => {
    it("should pass contentType and maxLength to summarizeFn", async () => {
      let receivedOptions: { contentType?: ContentType; maxLength?: number } =
        {};
      const provider = createBaseProvider({
        provider: LLMProvider.GEMINI,
        model: "gemini-1.5-flash",
        isAvailableFn: () => true,
        summarizeFn: async (options) => {
          receivedOptions = options;
          return {
            success: true as const,
            data: {
              summary: "Test summary",
              provider: LLMProvider.GEMINI,
              model: "gemini-1.5-flash",
              dryRun: false,
              generatedAt: new Date(),
            },
          };
        },
      });

      await provider.summarize({
        content: "A".repeat(100),
        contentType: ContentType.RSS,
        maxLength: 300,
      });

      expect(receivedOptions.contentType).toBe(ContentType.RSS);
      expect(receivedOptions.maxLength).toBe(300);
    });
  });
});
