import { Result } from "@/lib/errors";

/**
 * Supported LLM providers
 */
export enum LLMProvider {
  GEMINI = "GEMINI",
}

/**
 * Content types for context-aware summarization
 */
export enum ContentType {
  RSS = "RSS",
  SOCIAL = "SOCIAL",
  ARTICLE = "ARTICLE",
  GENERIC = "GENERIC",
}

/**
 * Options for content summarization
 */
export interface SummarizeOptions {
  /** The content to summarize */
  content: string;
  /** If true, returns placeholder without API call */
  dryRun?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Content type for context-aware prompts */
  contentType?: ContentType;
  /** Maximum summary length in characters (default: 500) */
  maxLength?: number;
}

/**
 * Result of a summarization operation
 */
export interface SummaryResult {
  /** The generated summary */
  summary: string;
  /** Provider used for generation */
  provider: LLMProvider;
  /** Model identifier */
  model: string;
  /** Tokens consumed (if available) */
  tokensUsed?: number;
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Timestamp of generation */
  generatedAt: Date;
}

/**
 * LLM Provider interface
 */
export interface ILLMProvider {
  /** Provider identifier */
  readonly provider: LLMProvider;
  /** Model identifier */
  readonly model: string;
  /** Generate a summary from content */
  summarize(options: SummarizeOptions): Promise<Result<SummaryResult>>;
  /** Check if the provider is available (has valid config) */
  isAvailable(): boolean;
}

/**
 * Configuration for creating an LLM provider
 */
export interface LLMProviderConfig {
  provider: LLMProvider;
  model: string;
  isAvailableFn: () => boolean;
  summarizeFn: (options: SummarizeOptions) => Promise<Result<SummaryResult>>;
}
