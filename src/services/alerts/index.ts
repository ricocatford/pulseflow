/**
 * Alert Service
 *
 * Detects significant changes between scrape results and delivers notifications
 * via email and webhook.
 */

// Types
export {
  AlertChannel,
  AlertStatus,
  ChangeType,
  type ComparableItem,
  type ChangeStats,
  type ChangeDetails,
  type ChangeDetectionResult,
  type ChangeDetectionOptions,
  type AlertOptions,
  type AlertDeliveryResult,
  type IAlertProvider,
  type WebhookPayload,
  type EmailAlertData,
} from "./types";

// Constants
export {
  DEFAULT_MIN_NEW_ITEMS,
  DEFAULT_DETECT_REMOVALS,
  DEFAULT_DETECT_UPDATES,
  DEFAULT_MAX_RETRIES,
  RETRY_DELAYS_MS,
  WEBHOOK_TIMEOUT_MS,
  WEBHOOK_EVENT_HEADER,
  WEBHOOK_EVENT_NAME,
  DEFAULT_EMAIL_FROM,
  EMAIL_REGEX,
  WEBHOOK_URL_REGEX,
  ALERT_ERROR_CODES,
  ALERT_ERROR_STATUS_CODES,
} from "./constants";

// Infrastructure
export { detectChanges } from "./infrastructure/changeDetector";
export {
  getEmailClient,
  isEmailConfigured,
  sendEmail,
  type SendEmailOptions,
  type SendEmailResult,
} from "./infrastructure/emailClient";

// Templates
export {
  generateAlertEmailHtml,
  generateAlertEmailText,
  generateAlertEmailSubject,
} from "./templates/alertEmail";

// Providers
export { createBaseProvider } from "./providers/baseProvider";
export {
  createWebhookProvider,
  webhookProvider,
} from "./providers/webhookProvider";
export {
  createEmailProvider,
  isEmailProviderAvailable,
  emailProvider,
} from "./providers/emailProvider";
