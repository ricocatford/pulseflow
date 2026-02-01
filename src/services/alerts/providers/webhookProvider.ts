import { AppError, Result, ok, err } from "@/lib/errors";
import {
  ALERT_ERROR_CODES,
  ALERT_ERROR_STATUS_CODES,
  WEBHOOK_EVENT_HEADER,
  WEBHOOK_EVENT_NAME,
  WEBHOOK_TIMEOUT_MS,
  WEBHOOK_URL_REGEX,
} from "../constants";
import {
  AlertChannel,
  AlertDeliveryResult,
  AlertOptions,
  IAlertProvider,
  WebhookPayload,
} from "../types";
import { createBaseProvider } from "./baseProvider";

/**
 * Validate webhook URL format
 */
function validateWebhookUrl(url: string): boolean {
  return WEBHOOK_URL_REGEX.test(url);
}

/**
 * Build the webhook payload from alert options
 */
function buildWebhookPayload(options: AlertOptions): WebhookPayload {
  const { signal, change, pulseId } = options;

  return {
    event: WEBHOOK_EVENT_NAME,
    timestamp: new Date().toISOString(),
    signal: {
      id: signal.id,
      name: signal.name,
      url: signal.url,
    },
    change: {
      type: change.changeType!,
      summary: change.summary,
      stats: change.details.stats,
      items: {
        added: change.details.added,
        removed: change.details.removed,
        updated: change.details.updated,
      },
    },
    pulseId,
  };
}

/**
 * Send webhook request with timeout
 */
async function sendWebhookRequest(
  url: string,
  payload: WebhookPayload
): Promise<Result<AlertDeliveryResult>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WEBHOOK_EVENT_HEADER]: WEBHOOK_EVENT_NAME,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return err(
        new AppError(
          `Webhook returned status ${response.status}: ${response.statusText}`,
          ALERT_ERROR_CODES.WEBHOOK_ERROR,
          ALERT_ERROR_STATUS_CODES[ALERT_ERROR_CODES.WEBHOOK_ERROR],
          { statusCode: response.status, statusText: response.statusText }
        )
      );
    }

    return ok({
      success: true,
      channel: AlertChannel.WEBHOOK,
      destination: url,
      deliveredAt: new Date(),
      dryRun: false,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return err(
        new AppError(
          `Webhook request timed out after ${WEBHOOK_TIMEOUT_MS}ms`,
          ALERT_ERROR_CODES.WEBHOOK_TIMEOUT,
          ALERT_ERROR_STATUS_CODES[ALERT_ERROR_CODES.WEBHOOK_TIMEOUT],
          { url, timeout: WEBHOOK_TIMEOUT_MS }
        )
      );
    }

    throw error; // Re-throw for base provider to handle with retries
  }
}

/**
 * Create a webhook alert provider
 */
export function createWebhookProvider(): IAlertProvider {
  return createBaseProvider({
    channel: AlertChannel.WEBHOOK,
    validateDestinationFn: validateWebhookUrl,
    sendFn: async (options: AlertOptions): Promise<Result<AlertDeliveryResult>> => {
      const payload = buildWebhookPayload(options);
      return sendWebhookRequest(options.destination, payload);
    },
  });
}

// Export singleton instance
export const webhookProvider = createWebhookProvider();
