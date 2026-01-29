export const BLOCKED_DOMAINS = [
  "amazon.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "netflix.com",
] as const;

export const DEFAULT_DELAY_MS = 2000;
export const DEFAULT_MAX_RETRIES = 3;
export const ROBOTS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const USER_AGENT = "PulseFlow/1.0 (+https://pulseflow.app/bot)";

export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
