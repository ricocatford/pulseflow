import robotsParser from "robots-parser";
import { ROBOTS_CACHE_TTL_MS, USER_AGENT } from "../constants";

interface RobotsCache {
  parser: ReturnType<typeof robotsParser> | null;
  fetchedAt: number;
}

const robotsCache = new Map<string, RobotsCache>();

function extractOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return url;
  }
}

async function fetchRobotsTxt(origin: string): Promise<string | null> {
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

async function getRobotsParser(
  url: string
): Promise<ReturnType<typeof robotsParser> | null> {
  const origin = extractOrigin(url);
  const cached = robotsCache.get(origin);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < ROBOTS_CACHE_TTL_MS) {
    return cached.parser;
  }

  const robotsTxt = await fetchRobotsTxt(origin);
  const parser = robotsTxt
    ? robotsParser(`${origin}/robots.txt`, robotsTxt)
    : null;

  robotsCache.set(origin, {
    parser,
    fetchedAt: now,
  });

  return parser;
}

export async function isUrlAllowed(url: string): Promise<boolean> {
  const parser = await getRobotsParser(url);

  // Fail-open: if we can't fetch robots.txt, allow the request
  if (!parser) {
    return true;
  }

  return parser.isAllowed(url, USER_AGENT) ?? true;
}

export function clearRobotsCache(): void {
  robotsCache.clear();
}
