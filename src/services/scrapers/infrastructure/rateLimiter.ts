import { DEFAULT_DELAY_MS } from "../constants";

interface RateLimitEntry {
  lastRequestAt: number;
}

const domainLimits = new Map<string, RateLimitEntry>();

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

export async function waitForRateLimit(
  url: string,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<void> {
  const domain = extractDomain(url);
  const entry = domainLimits.get(domain);
  const now = Date.now();

  if (entry) {
    const elapsed = now - entry.lastRequestAt;
    const remaining = delayMs - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }

  domainLimits.set(domain, { lastRequestAt: Date.now() });
}

export function getLastRequestTime(url: string): number | null {
  const domain = extractDomain(url);
  const entry = domainLimits.get(domain);
  return entry?.lastRequestAt ?? null;
}

export function clearRateLimits(): void {
  domainLimits.clear();
}
