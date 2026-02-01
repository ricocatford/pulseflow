import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createBaseProvider } from "./baseProvider";
import { AlertChannel, AlertOptions, ChangeType } from "../types";
import { ok, err, AppError } from "@/lib/errors";
import { ALERT_ERROR_CODES } from "../constants";

describe("baseProvider", () => {
  const mockOptions: AlertOptions = {
    destination: "test@example.com",
    signal: { id: "sig1", name: "Test Signal", url: "https://example.com" },
    change: {
      hasChanges: true,
      changeType: ChangeType.NEW_ITEMS,
      summary: "1 new item detected",
      details: {
        added: [{ id: "1", title: "New Item" }],
        removed: [],
        updated: [],
        stats: {
          addedCount: 1,
          removedCount: 0,
          updatedCount: 0,
          previousTotal: 0,
          currentTotal: 1,
        },
      },
    },
    pulseId: "pulse1",
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("destination validation", () => {
    it("should validate destination before sending", async () => {
      const validateFn = vi.fn().mockReturnValue(false);
      const sendFn = vi.fn();

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
      });

      const result = await provider.send(mockOptions);

      expect(validateFn).toHaveBeenCalledWith("test@example.com");
      expect(sendFn).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ALERT_ERROR_CODES.INVALID_DESTINATION);
      }
    });

    it("should pass validation for valid destinations", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn().mockResolvedValue(
        ok({
          success: true,
          channel: AlertChannel.EMAIL,
          destination: "test@example.com",
          deliveredAt: new Date(),
          dryRun: false,
        })
      );

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
      });

      const result = await provider.send(mockOptions);

      expect(validateFn).toHaveBeenCalled();
      expect(sendFn).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should expose validateDestination method", () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn();

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
      });

      expect(provider.validateDestination("test@example.com")).toBe(true);
      expect(validateFn).toHaveBeenCalledWith("test@example.com");
    });
  });

  describe("dry run support", () => {
    it("should return dry run result without calling sendFn", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn();

      const provider = createBaseProvider({
        channel: AlertChannel.WEBHOOK,
        validateDestinationFn: validateFn,
        sendFn,
      });

      const result = await provider.send({
        ...mockOptions,
        destination: "https://webhook.example.com",
        dryRun: true,
      });

      expect(sendFn).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(true);
        expect(result.data.channel).toBe(AlertChannel.WEBHOOK);
        expect(result.data.destination).toBe("https://webhook.example.com");
      }
    });

    it("should still validate destination in dry run mode", async () => {
      const validateFn = vi.fn().mockReturnValue(false);
      const sendFn = vi.fn();

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
      });

      const result = await provider.send({
        ...mockOptions,
        dryRun: true,
      });

      expect(validateFn).toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
  });

  describe("retry logic", () => {
    it("should retry on failure with exponential backoff", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(
          ok({
            success: true,
            channel: AlertChannel.EMAIL,
            destination: "test@example.com",
            deliveredAt: new Date(),
            dryRun: false,
          })
        );

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
        maxRetries: 3,
      });

      const resultPromise = provider.send(mockOptions);

      // First attempt fails
      await vi.advanceTimersByTimeAsync(0);
      expect(sendFn).toHaveBeenCalledTimes(1);

      // Wait for first retry delay (1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      expect(sendFn).toHaveBeenCalledTimes(2);

      // Wait for second retry delay (2000ms)
      await vi.advanceTimersByTimeAsync(2000);
      expect(sendFn).toHaveBeenCalledTimes(3);

      const result = await resultPromise;
      expect(result.success).toBe(true);
    });

    it("should fail after exhausting retries", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn().mockRejectedValue(new Error("Persistent error"));

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
        maxRetries: 3,
      });

      const resultPromise = provider.send(mockOptions);

      // Advance through all retry delays
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry
      await vi.advanceTimersByTimeAsync(4000); // Third retry

      const result = await resultPromise;
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ALERT_ERROR_CODES.DELIVERY_FAILED);
        expect(result.error.message).toContain("after 3 retries");
      }
      expect(sendFn).toHaveBeenCalledTimes(3);
    });

    it("should not retry on rate limit errors", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi
        .fn()
        .mockRejectedValue(new Error("Rate limit exceeded (429)"));

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
        maxRetries: 3,
      });

      const result = await provider.send(mockOptions);

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ALERT_ERROR_CODES.RATE_LIMIT);
      }
    });

    it("should use default maxRetries of 3", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn().mockRejectedValue(new Error("Error"));

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
      });

      const resultPromise = provider.send(mockOptions);
      await vi.advanceTimersByTimeAsync(10000);
      await resultPromise;

      expect(sendFn).toHaveBeenCalledTimes(3);
    });
  });

  describe("error handling", () => {
    it("should map webhook errors correctly", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const provider = createBaseProvider({
        channel: AlertChannel.WEBHOOK,
        validateDestinationFn: validateFn,
        sendFn,
        maxRetries: 1,
      });

      const result = await provider.send({
        ...mockOptions,
        destination: "https://webhook.example.com",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // After all retries exhausted, wrapped in DELIVERY_FAILED
        expect(result.error.code).toBe(ALERT_ERROR_CODES.DELIVERY_FAILED);
        expect(result.error.message).toContain("Connection refused");
      }
    });

    it("should map email errors correctly", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn().mockRejectedValue(new Error("SMTP error"));

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
        maxRetries: 1,
      });

      const result = await provider.send(mockOptions);

      expect(result.success).toBe(false);
      if (!result.success) {
        // After all retries exhausted, wrapped in DELIVERY_FAILED
        expect(result.error.code).toBe(ALERT_ERROR_CODES.DELIVERY_FAILED);
        expect(result.error.message).toContain("SMTP error");
      }
    });

    it("should handle non-Error objects", async () => {
      const validateFn = vi.fn().mockReturnValue(true);
      const sendFn = vi.fn().mockRejectedValue("String error");

      const provider = createBaseProvider({
        channel: AlertChannel.EMAIL,
        validateDestinationFn: validateFn,
        sendFn,
        maxRetries: 1,
      });

      const result = await provider.send(mockOptions);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("String error");
      }
    });
  });

  describe("channel property", () => {
    it("should expose the channel type", () => {
      const provider = createBaseProvider({
        channel: AlertChannel.WEBHOOK,
        validateDestinationFn: () => true,
        sendFn: vi.fn(),
      });

      expect(provider.channel).toBe(AlertChannel.WEBHOOK);
    });
  });
});
