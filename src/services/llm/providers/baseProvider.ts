import { AppError, Result, err, ok } from "@/lib/errors";
import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_MAX_SUMMARY_LENGTH,
  DRY_RUN_SUMMARY_PLACEHOLDER,
  LLM_ERROR_CODES,
  LLM_ERROR_STATUS_CODES,
  MAX_INPUT_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
  RETRY_DELAYS_MS,
} from "../constants";
import {
  ContentType,
  ILLMProvider,
  LLMProvider,
  LLMProviderConfig,
  SummarizeOptions,
  SummaryResult,
} from "../types";

/**
 * Validate content before sending to LLM
 */
function validateContent(content: string): Result<string> {
  if (!content || content.trim().length < MIN_CONTENT_LENGTH) {
    return err(
      new AppError(
        `Content too short for summarization (min ${MIN_CONTENT_LENGTH} chars)`,
        LLM_ERROR_CODES.CONTENT_TOO_SHORT,
        LLM_ERROR_STATUS_CODES[LLM_ERROR_CODES.CONTENT_TOO_SHORT],
        { contentLength: content?.length ?? 0 }
      )
    );
  }

  // Truncate if too long
  let processedContent = content.trim();
  if (processedContent.length > MAX_INPUT_CONTENT_LENGTH) {
    processedContent = processedContent.slice(0, MAX_INPUT_CONTENT_LENGTH);
    console.log(
      `[LLM] Content truncated from ${content.length} to ${MAX_INPUT_CONTENT_LENGTH} chars`
    );
  }

  return ok(processedContent);
}

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("429") ||
      message.includes("too many requests")
    );
  }
  return false;
}

/**
 * Check if an error is an auth error
 */
function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("api key") ||
      message.includes("unauthorized") ||
      message.includes("401") ||
      message.includes("invalid key") ||
      message.includes("authentication")
    );
  }
  return false;
}

/**
 * Map errors to AppError with appropriate codes
 */
function mapApiError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);

  if (isRateLimitError(error)) {
    return new AppError(
      `LLM rate limit exceeded: ${message}`,
      LLM_ERROR_CODES.RATE_LIMIT,
      LLM_ERROR_STATUS_CODES[LLM_ERROR_CODES.RATE_LIMIT]
    );
  }

  if (isAuthError(error)) {
    return new AppError(
      `LLM authentication error: ${message}`,
      LLM_ERROR_CODES.AUTH_ERROR,
      LLM_ERROR_STATUS_CODES[LLM_ERROR_CODES.AUTH_ERROR]
    );
  }

  if (message.includes("empty") || message.includes("Empty response")) {
    return new AppError(
      "LLM returned empty response",
      LLM_ERROR_CODES.EMPTY_RESPONSE,
      LLM_ERROR_STATUS_CODES[LLM_ERROR_CODES.EMPTY_RESPONSE]
    );
  }

  return new AppError(
    `LLM API error: ${message}`,
    LLM_ERROR_CODES.API_ERROR,
    LLM_ERROR_STATUS_CODES[LLM_ERROR_CODES.API_ERROR],
    { originalError: message }
  );
}

/**
 * Create a dry-run result
 */
function createDryRunResult(
  provider: LLMProvider,
  model: string
): SummaryResult {
  return {
    summary: DRY_RUN_SUMMARY_PLACEHOLDER,
    provider,
    model,
    dryRun: true,
    generatedAt: new Date(),
  };
}

/**
 * Create an LLM provider with common behaviors:
 * - Content validation
 * - Dry-run support
 * - Exponential backoff retry
 */
export function createBaseProvider(config: LLMProviderConfig): ILLMProvider {
  const { provider, model, isAvailableFn, summarizeFn } = config;

  return {
    provider,
    model,

    isAvailable(): boolean {
      return isAvailableFn();
    },

    async summarize(options: SummarizeOptions): Promise<Result<SummaryResult>> {
      const {
        content,
        dryRun = false,
        maxRetries = DEFAULT_MAX_RETRIES,
        contentType = ContentType.GENERIC,
        maxLength = DEFAULT_MAX_SUMMARY_LENGTH,
      } = options;

      // Check provider availability
      if (!this.isAvailable()) {
        return err(
          new AppError(
            `LLM provider ${provider} is not available (missing API key)`,
            LLM_ERROR_CODES.PROVIDER_UNAVAILABLE,
            LLM_ERROR_STATUS_CODES[LLM_ERROR_CODES.PROVIDER_UNAVAILABLE]
          )
        );
      }

      // Validate content
      const validationResult = validateContent(content);
      if (!validationResult.success) {
        return validationResult;
      }
      const validatedContent = validationResult.data;

      // Handle dry run
      if (dryRun) {
        console.log(
          `[DRY RUN] Would summarize ${validatedContent.length} chars with ${provider}/${model}`
        );
        return ok(createDryRunResult(provider, model));
      }

      // Execute with retry logic
      let lastError: AppError | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await summarizeFn({
            content: validatedContent,
            dryRun: false,
            contentType,
            maxLength,
          });
          return result;
        } catch (error) {
          lastError = mapApiError(error);
          console.error(
            `[LLM] Attempt ${attempt + 1}/${maxRetries} failed:`,
            lastError.message
          );

          // Don't retry auth errors
          if (lastError.code === LLM_ERROR_CODES.AUTH_ERROR) {
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
          `Summarization failed after ${maxRetries} retries: ${lastError?.message}`,
          LLM_ERROR_CODES.SUMMARIZE_FAILED,
          LLM_ERROR_STATUS_CODES[LLM_ERROR_CODES.SUMMARIZE_FAILED],
          { lastError: lastError?.message }
        )
      );
    },
  };
}
