import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEmailProvider, emailProvider } from "./emailProvider";
import { AlertChannel, AlertOptions, ChangeType } from "../types";
import { ALERT_ERROR_CODES } from "../constants";

// Mock the email client module
vi.mock("../infrastructure/emailClient", () => ({
  isEmailConfigured: vi.fn().mockReturnValue(true),
  sendEmail: vi.fn(),
}));

import { sendEmail, isEmailConfigured } from "../infrastructure/emailClient";

describe("emailProvider", () => {
  const mockOptions: AlertOptions = {
    destination: "user@example.com",
    signal: { id: "sig1", name: "HackerNews Front Page", url: "https://news.ycombinator.com" },
    change: {
      hasChanges: true,
      changeType: ChangeType.NEW_ITEMS,
      summary: "3 new items detected",
      details: {
        added: [
          { id: "https://example.com/1", title: "New Article 1", author: "alice" },
          { id: "https://example.com/2", title: "New Article 2", author: "bob" },
          { id: "https://example.com/3", title: "New Article 3" },
        ],
        removed: [],
        updated: [],
        stats: {
          addedCount: 3,
          removedCount: 0,
          updatedCount: 0,
          previousTotal: 10,
          currentTotal: 13,
        },
      },
    },
    pulseId: "pulse456",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    vi.mocked(sendEmail).mockResolvedValue({ id: "email123" });
  });

  describe("validateDestination", () => {
    it("should accept valid email addresses", () => {
      const provider = createEmailProvider();
      expect(provider.validateDestination("test@example.com")).toBe(true);
      expect(provider.validateDestination("user.name+tag@domain.co.uk")).toBe(true);
      expect(provider.validateDestination("simple@domain.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      const provider = createEmailProvider();
      expect(provider.validateDestination("not-an-email")).toBe(false);
      expect(provider.validateDestination("@example.com")).toBe(false);
      expect(provider.validateDestination("test@")).toBe(false);
      expect(provider.validateDestination("")).toBe(false);
      expect(provider.validateDestination("test @example.com")).toBe(false);
    });

    it("should reject URLs", () => {
      const provider = createEmailProvider();
      expect(provider.validateDestination("https://example.com")).toBe(false);
    });
  });

  describe("send", () => {
    it("should send email with correct subject and content", async () => {
      const provider = createEmailProvider();
      const result = await provider.send(mockOptions);

      expect(result.success).toBe(true);
      expect(sendEmail).toHaveBeenCalledTimes(1);

      const emailArgs = vi.mocked(sendEmail).mock.calls[0][0];
      expect(emailArgs.to).toBe("user@example.com");
      expect(emailArgs.subject).toContain("[PulseFlow]");
      expect(emailArgs.subject).toContain("3 new items");
      expect(emailArgs.subject).toContain("HackerNews Front Page");
      expect(emailArgs.html).toContain("New Article 1");
      expect(emailArgs.html).toContain("New Article 2");
      expect(emailArgs.html).toContain("New Article 3");
      expect(emailArgs.text).toBeDefined();
    });

    it("should return delivery result on success", async () => {
      const provider = createEmailProvider();
      const result = await provider.send(mockOptions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.channel).toBe(AlertChannel.EMAIL);
        expect(result.data.destination).toBe("user@example.com");
        expect(result.data.deliveredAt).toBeInstanceOf(Date);
        expect(result.data.dryRun).toBe(false);
      }
    });

    it("should not send in dry run mode", async () => {
      const provider = createEmailProvider();
      const result = await provider.send({ ...mockOptions, dryRun: true });

      expect(sendEmail).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dryRun).toBe(true);
      }
    });

    it("should reject invalid email before sending", async () => {
      const provider = createEmailProvider();
      const result = await provider.send({
        ...mockOptions,
        destination: "not-an-email",
      });

      expect(sendEmail).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ALERT_ERROR_CODES.INVALID_DESTINATION);
      }
    });

    it("should handle removed items in email", async () => {
      const provider = createEmailProvider();
      const optionsWithRemovals: AlertOptions = {
        ...mockOptions,
        change: {
          ...mockOptions.change,
          changeType: ChangeType.MIXED,
          summary: "1 new item, 2 items removed",
          details: {
            ...mockOptions.change.details,
            added: [{ id: "1", title: "New Item" }],
            removed: [
              { id: "2", title: "Removed Item 1" },
              { id: "3", title: "Removed Item 2" },
            ],
          },
        },
      };

      await provider.send(optionsWithRemovals);

      const emailArgs = vi.mocked(sendEmail).mock.calls[0][0];
      expect(emailArgs.html).toContain("New Item");
      expect(emailArgs.html).toContain("Removed Item 1");
      expect(emailArgs.html).toContain("Removed Item 2");
    });

    it("should handle email send errors with retry", async () => {
      vi.useFakeTimers();
      vi.mocked(sendEmail)
        .mockRejectedValueOnce(new Error("SMTP error"))
        .mockResolvedValueOnce({ id: "email123" });

      const provider = createEmailProvider();
      const resultPromise = provider.send(mockOptions);

      // First attempt fails, wait for retry
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(sendEmail).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe("singleton", () => {
    it("should export singleton instance", () => {
      expect(emailProvider).toBeDefined();
      expect(emailProvider.channel).toBe(AlertChannel.EMAIL);
    });
  });
});
