/**
 * Alert Service Configuration Constants
 */

// Change detection defaults
export const DEFAULT_MIN_NEW_ITEMS = 1;
export const DEFAULT_DETECT_REMOVALS = false;
export const DEFAULT_DETECT_UPDATES = false;

// Retry configuration
export const DEFAULT_MAX_RETRIES = 3;
export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;

// Webhook configuration
export const WEBHOOK_TIMEOUT_MS = 10000;
export const WEBHOOK_EVENT_HEADER = "X-PulseFlow-Event";
export const WEBHOOK_EVENT_NAME = "pulse.change_detected";

// Email configuration
export const DEFAULT_EMAIL_FROM = "PulseFlow <alerts@pulseflow.dev>";

// Validation patterns
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const WEBHOOK_URL_REGEX = /^https?:\/\/.+/;

// Dry run placeholders
export const DRY_RUN_WEBHOOK_RESPONSE = "[DRY RUN] Webhook would be sent";
export const DRY_RUN_EMAIL_RESPONSE = "[DRY RUN] Email would be sent";

// Error codes
export const ALERT_ERROR_CODES = {
  INVALID_DESTINATION: "ALERT_INVALID_DESTINATION",
  DELIVERY_FAILED: "ALERT_DELIVERY_FAILED",
  WEBHOOK_TIMEOUT: "ALERT_WEBHOOK_TIMEOUT",
  WEBHOOK_ERROR: "ALERT_WEBHOOK_ERROR",
  EMAIL_ERROR: "ALERT_EMAIL_ERROR",
  PROVIDER_UNAVAILABLE: "ALERT_PROVIDER_UNAVAILABLE",
  NO_CHANGES: "ALERT_NO_CHANGES",
  RATE_LIMIT: "ALERT_RATE_LIMIT",
} as const;

// Error status codes
export const ALERT_ERROR_STATUS_CODES = {
  [ALERT_ERROR_CODES.INVALID_DESTINATION]: 400,
  [ALERT_ERROR_CODES.DELIVERY_FAILED]: 500,
  [ALERT_ERROR_CODES.WEBHOOK_TIMEOUT]: 504,
  [ALERT_ERROR_CODES.WEBHOOK_ERROR]: 502,
  [ALERT_ERROR_CODES.EMAIL_ERROR]: 502,
  [ALERT_ERROR_CODES.PROVIDER_UNAVAILABLE]: 503,
  [ALERT_ERROR_CODES.NO_CHANGES]: 400,
  [ALERT_ERROR_CODES.RATE_LIMIT]: 429,
} as const;
