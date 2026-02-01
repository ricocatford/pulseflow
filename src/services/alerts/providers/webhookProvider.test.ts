import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createWebhookProvider, webhookProvider } from "./webhookProvider";
import { AlertChannel, AlertOptions, ChangeType } from "../types";
import { ALERT_ERROR_CODES, WEBHOOK_EVENT_HEADER, WEBHOOK_EVENT_NAME } from "../constants";

describe("webhookProvider", () => {
  const mockOptions: AlertOptions = {
    destination: "https://webhook.example.com/hook",
    signal: { id: "sig1", name: "Test Signal", url: "https://example.com" },
    change: {
      hasChanges: true,
      changeType: ChangeType.NEW_ITEMS,
      summary: "2 new items detected",
      details: {
        added: [
          { id: "1", title: "New Item 1" },
          { id: "2", title: "New Item 2" },
        ],
        removed: [],
        updated: [],
        stats: {
          addedCount: 2,
          removedCount: 0,
          updatedCount: 0,
          previousTotal: 5,
          currentTotal: 7,
        },
      },
    },
    pulseId: "pulse123",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("validateDestination", () => {
    it("should accept valid HTTPS URLs", () => {
      const provider = createWebhookProvider();
      expect(provider.validateDestination("https://example.com/webhook")).toBe(true);
    });

    it("should accept valid HTTP URLs", () => {
      const provider = createWebhookProvider();
      expect(provider.validateDestination("http://localhost:3000/hook")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      const provider = createWebhookProvider();
      expect(provider.validateDestination("not-a-url")).toBe(false);
      expect(provider.validateDestination("ftp://example.com")).toBe(false);
      expect(provider.validateDestination("")).toBe(false);
    });

    it("should reject email addresses", () => {
      const provider = createWebhookProvider();
      expect(provider.validateDestination("test@example.com")).toBe(false);
    });
  });

  describe("send", () => {
    it("should send POST request with correct headers and payload", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      const result = await provider.send(mockOptions);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://webhook.example.com/hook");
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers[WEBHOOK_EVENT_HEADER]).toBe(WEBHOOK_EVENT_NAME);

      const payload = JSON.parse(options.body);
      expect(payload.event).toBe(WEBHOOK_EVENT_NAME);
      expect(payload.signal.id).toBe("sig1");
      expect(payload.signal.name).toBe("Test Signal");
      expect(payload.change.type).toBe(ChangeType.NEW_ITEMS);
      expect(payload.change.summary).toBe("2 new items detected");
      expect(payload.change.items.added).toHaveLength(2);
      expect(payload.pulseId).toBe("pulse123");
    });

    it("should include timestamp in payload", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      await provider.send(mockOptions);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.timestamp).toBeDefined();
      expect(new Date(payload.timestamp)).toBeInstanceOf(Date);
    });

    it("should return delivery result on success", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      const result = await provider.send(mockOptions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.channel).toBe(AlertChannel.WEBHOOK);
        expect(result.data.destination).toBe("https://webhook.example.com/hook");
        expect(result.data.deliveredAt).toBeInstanceOf(Date);
        expect(result.data.dryRun).toBe(false);
      }
    });

    it("should handle non-OK responses", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      const result = await provider.send(mockOptions);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ALERT_ERROR_CODES.WEBHOOK_ERROR);
        expect(result.error.message).toContain("500");
      }
    });

    it("should handle network errors with retry", async () => {
      vi.useFakeTimers();
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ ok: true });
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      const resultPromise = provider.send(mockOptions);

      // First attempt fails, wait for retry
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("should handle timeout errors", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      const mockFetch = vi.fn().mockRejectedValue(abortError);
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      // Reduce max retries for faster test
      const result = await provider.send(mockOptions);

      // After all retries, should fail with delivery failed
      expect(result.success).toBe(false);
    });

    it("should not send in dry run mode", async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      const result = await provider.send({ ...mockOptions, dryRun: true });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(true);
      }
    });

    it("should reject invalid destination before sending", async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      const provider = createWebhookProvider();
      const result = await provider.send({
        ...mockOptions,
        destination: "not-a-url",
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ALERT_ERROR_CODES.INVALID_DESTINATION);
      }
    });
  });

  describe("singleton", () => {
    it("should export singleton instance", () => {
      expect(webhookProvider).toBeDefined();
      expect(webhookProvider.channel).toBe(AlertChannel.WEBHOOK);
    });
  });
});
