/**
 * LLM Service Configuration Constants
 */

// Model settings
export const GEMINI_MODEL = "gemini-2.0-flash";
export const DEFAULT_MAX_TOKENS = 500;
export const DEFAULT_TEMPERATURE = 0.3;

// Summary limits
export const DEFAULT_MAX_SUMMARY_LENGTH = 500; // Characters
export const MAX_INPUT_CONTENT_LENGTH = 30000; // Characters
export const MIN_CONTENT_LENGTH = 50; // Characters

// Retry configuration
export const DEFAULT_MAX_RETRIES = 3;
export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;

// Dry run placeholder
export const DRY_RUN_SUMMARY_PLACEHOLDER =
  "[DRY RUN] Summary would be generated here. Content received and validated.";

// Error codes
export const LLM_ERROR_CODES = {
  CONTENT_TOO_SHORT: "LLM_CONTENT_TOO_SHORT",
  PROVIDER_UNAVAILABLE: "LLM_PROVIDER_UNAVAILABLE",
  RATE_LIMIT: "LLM_RATE_LIMIT",
  AUTH_ERROR: "LLM_AUTH_ERROR",
  API_ERROR: "LLM_API_ERROR",
  EMPTY_RESPONSE: "LLM_EMPTY_RESPONSE",
  SUMMARIZE_FAILED: "LLM_SUMMARIZE_FAILED",
} as const;

// Error status codes
export const LLM_ERROR_STATUS_CODES = {
  [LLM_ERROR_CODES.CONTENT_TOO_SHORT]: 400,
  [LLM_ERROR_CODES.PROVIDER_UNAVAILABLE]: 503,
  [LLM_ERROR_CODES.RATE_LIMIT]: 429,
  [LLM_ERROR_CODES.AUTH_ERROR]: 401,
  [LLM_ERROR_CODES.API_ERROR]: 500,
  [LLM_ERROR_CODES.EMPTY_RESPONSE]: 500,
  [LLM_ERROR_CODES.SUMMARIZE_FAILED]: 500,
} as const;
