import { ok } from "@/lib/errors";
import {
  generateContent,
  getModelName,
  isGeminiAvailable,
} from "../infrastructure/geminiClient";
import { buildSummarizePrompt } from "../prompts/summarize";
import { ContentType, ILLMProvider, LLMProvider, SummarizeOptions } from "../types";
import { DEFAULT_MAX_SUMMARY_LENGTH } from "../constants";
import { createBaseProvider } from "./baseProvider";

/**
 * Core summarization logic for Gemini
 * This function is called by the base provider after validation and dry-run checks
 */
async function geminiSummarizeFn(options: SummarizeOptions) {
  const {
    content,
    contentType = ContentType.GENERIC,
    maxLength = DEFAULT_MAX_SUMMARY_LENGTH,
  } = options;

  const prompt = buildSummarizePrompt(content, contentType, maxLength);

  const response = await generateContent({
    prompt,
  });

  return ok({
    summary: response.text,
    provider: LLMProvider.GEMINI,
    model: getModelName(),
    tokensUsed: response.tokensUsed,
    dryRun: false,
    generatedAt: new Date(),
  });
}

/**
 * Gemini LLM Provider
 * Uses Google's Gemini 1.5 Flash model for content summarization
 */
export const geminiProvider: ILLMProvider = createBaseProvider({
  provider: LLMProvider.GEMINI,
  model: getModelName(),
  isAvailableFn: isGeminiAvailable,
  summarizeFn: geminiSummarizeFn,
});
