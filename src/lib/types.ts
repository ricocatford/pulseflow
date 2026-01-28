export interface ScraperOptions {
  url: string;
  dryRun?: boolean;
  delayMs?: number;
  maxRetries?: number;
}

export type PulseStatus = "SUCCESS" | "FAILED";
