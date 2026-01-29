// Types
export {
  LLMProvider,
  ContentType,
  type SummarizeOptions,
  type SummaryResult,
  type ILLMProvider,
} from "./types";

// Constants
export {
  GEMINI_MODEL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_SUMMARY_LENGTH,
  MAX_INPUT_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
  DEFAULT_MAX_RETRIES,
  LLM_ERROR_CODES,
} from "./constants";

// Providers
export { geminiProvider } from "./providers/geminiProvider";

// Prompts
export {
  buildSummarizePrompt,
  getContentTypeFromStrategy,
} from "./prompts/summarize";

// Infrastructure
export { isGeminiAvailable, resetGeminiClient } from "./infrastructure/geminiClient";

import { geminiProvider } from "./providers/geminiProvider";
import { ILLMProvider } from "./types";

/**
 * Get the default LLM provider
 * Currently returns Gemini, but can be extended to support multiple providers
 */
export function getDefaultLLMProvider(): ILLMProvider {
  return geminiProvider;
}

/**
 * Get all available LLM providers
 */
export function getAvailableProviders(): ILLMProvider[] {
  const providers = [geminiProvider];
  return providers.filter((p) => p.isAvailable());
}

/**
 * Check if any LLM provider is available
 */
export function isLLMAvailable(): boolean {
  return getAvailableProviders().length > 0;
}
