import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { env } from "@/lib/env";
import { GEMINI_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from "../constants";

let geminiInstance: GoogleGenerativeAI | null = null;
let modelInstance: GenerativeModel | null = null;

/**
 * Get or create the Gemini AI client instance
 */
function getGeminiClient(): GoogleGenerativeAI | null {
  if (!env.GEMINI_API_KEY) {
    return null;
  }

  if (!geminiInstance) {
    geminiInstance = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  return geminiInstance;
}

/**
 * Get or create the Gemini model instance
 */
function getModel(): GenerativeModel | null {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  if (!modelInstance) {
    modelInstance = client.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: DEFAULT_TEMPERATURE,
        maxOutputTokens: DEFAULT_MAX_TOKENS,
      },
    });
  }

  return modelInstance;
}

/**
 * Check if Gemini client is available
 */
export function isGeminiAvailable(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

/**
 * Get the current model name
 */
export function getModelName(): string {
  return GEMINI_MODEL;
}

export interface GeminiGenerateOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  text: string;
  tokensUsed?: number;
}

/**
 * Generate content using Gemini
 * @throws Error if generation fails
 */
export async function generateContent(
  options: GeminiGenerateOptions
): Promise<GeminiResponse> {
  const model = getModel();

  if (!model) {
    throw new Error("Gemini client not available - missing API key");
  }

  const result = await model.generateContent(options.prompt);
  const response = result.response;
  const text = response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("Empty response from Gemini API");
  }

  return {
    text: text.trim(),
    tokensUsed: response.usageMetadata?.totalTokenCount,
  };
}

/**
 * Reset the client instances (useful for testing)
 */
export function resetGeminiClient(): void {
  geminiInstance = null;
  modelInstance = null;
}
