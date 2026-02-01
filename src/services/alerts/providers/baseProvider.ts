import { AppError, Result, err, ok } from "@/lib/errors";
import {
  ALERT_ERROR_CODES,
  ALERT_ERROR_STATUS_CODES,
  DEFAULT_MAX_RETRIES,
  RETRY_DELAYS_MS,
} from "../constants";
import {
  AlertChannel,
  AlertDeliveryResult,
  AlertOptions,
  AlertProviderConfig,
  IAlertProvider,
} from "../types";

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("too many requests")
    );
  }
  return false;
}

/**
 * Map errors to AppError with appropriate codes
 */
function mapDeliveryError(error: unknown, channel: AlertChannel): AppError {
  const message = error instanceof Error ? error.message : String(error);

  if (isRateLimitError(error)) {
    return new AppError(
      `Alert rate limit exceeded: ${message}`,
      ALERT_ERROR_CODES.RATE_LIMIT,
      ALERT_ERROR_STATUS_CODES[ALERT_ERROR_CODES.RATE_LIMIT]
    );
  }

  const errorCode =
    channel === AlertChannel.WEBHOOK
      ? ALERT_ERROR_CODES.WEBHOOK_ERROR
      : ALERT_ERROR_CODES.EMAIL_ERROR;

  return new AppError(
    `Alert delivery failed: ${message}`,
    errorCode,
    ALERT_ERROR_STATUS_CODES[errorCode],
    { originalError: message }
  );
}

/**
 * Create a dry-run result
 */
function createDryRunResult(
  channel: AlertChannel,
  destination: string
): AlertDeliveryResult {
  return {
    success: true,
    channel,
    destination,
    deliveredAt: new Date(),
    dryRun: true,
  };
}

/**
 * Create an alert provider with common behaviors:
 * - Destination validation
 * - Dry-run support
 * - Exponential backoff retry
 */
export function createBaseProvider(config: AlertProviderConfig): IAlertProvider {
  const {
    channel,
    maxRetries = DEFAULT_MAX_RETRIES,
    validateDestinationFn,
    sendFn,
  } = config;

  return {
    channel,

    validateDestination(destination: string): boolean {
      return validateDestinationFn(destination);
    },

    async send(options: AlertOptions): Promise<Result<AlertDeliveryResult>> {
      const { destination, dryRun = false } = options;

      // Validate destination
      if (!this.validateDestination(destination)) {
        return err(
          new AppError(
            `Invalid ${channel.toLowerCase()} destination: ${destination}`,
            ALERT_ERROR_CODES.INVALID_DESTINATION,
            ALERT_ERROR_STATUS_CODES[ALERT_ERROR_CODES.INVALID_DESTINATION],
            { destination, channel }
          )
        );
      }

      // Handle dry run
      if (dryRun) {
        console.log(
          `[DRY RUN] Would send ${channel} alert to ${destination}`
        );
        return ok(createDryRunResult(channel, destination));
      }

      // Execute with retry logic
      let lastError: AppError | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await sendFn(options);
          return result;
        } catch (error) {
          lastError = mapDeliveryError(error, channel);
          console.error(
            `[ALERT] Attempt ${attempt + 1}/${maxRetries} failed:`,
            lastError.message
          );

          // Don't retry rate limit errors
          if (lastError.code === ALERT_ERROR_CODES.RATE_LIMIT) {
            return err(lastError);
          }

          if (attempt < maxRetries - 1) {
            const retryDelay =
              RETRY_DELAYS_MS[attempt] ??
              RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      return err(
        new AppError(
          `Alert delivery failed after ${maxRetries} retries: ${lastError?.message}`,
          ALERT_ERROR_CODES.DELIVERY_FAILED,
          ALERT_ERROR_STATUS_CODES[ALERT_ERROR_CODES.DELIVERY_FAILED],
          { lastError: lastError?.message }
        )
      );
    },
  };
}
