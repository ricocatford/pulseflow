import { ContentType } from "../types";
import { DEFAULT_MAX_SUMMARY_LENGTH } from "../constants";

/**
 * Base system prompt for all summarizations
 */
const BASE_SYSTEM_PROMPT = `You are a concise content summarizer. Your task is to extract the most important information and present it clearly.

Guidelines:
- Be concise and direct
- Focus on key facts, events, and insights
- Avoid filler words and redundant phrases
- Use bullet points for multiple items
- Maintain factual accuracy
- Do not add opinions or interpretations`;

/**
 * Content-type specific instructions
 */
const CONTENT_TYPE_INSTRUCTIONS: Record<ContentType, string> = {
  [ContentType.RSS]: `This is RSS feed content containing multiple news items or articles.
Focus on:
- Main headlines and their significance
- Key developments or announcements
- Trends across multiple items if present`,

  [ContentType.SOCIAL]: `This is social media content (Reddit, Hacker News, etc.).
Focus on:
- Main topic of discussion
- Top-voted or most engaged comments
- Community sentiment and consensus
- Notable disagreements or debates`,

  [ContentType.ARTICLE]: `This is long-form article content.
Focus on:
- Main thesis or argument
- Key supporting points
- Important data or statistics
- Conclusions or recommendations`,

  [ContentType.GENERIC]: `This is general web content.
Focus on:
- Primary topic or purpose
- Key information and facts
- Actionable insights if any`,
};

/**
 * Generate a summarization prompt for the given content type
 */
export function buildSummarizePrompt(
  content: string,
  contentType: ContentType = ContentType.GENERIC,
  maxLength: number = DEFAULT_MAX_SUMMARY_LENGTH
): string {
  const typeInstructions = CONTENT_TYPE_INSTRUCTIONS[contentType];

  return `${BASE_SYSTEM_PROMPT}

${typeInstructions}

Maximum summary length: ${maxLength} characters.

Content to summarize:
---
${content}
---

Provide a concise summary:`;
}

/**
 * Map scraper strategy to content type
 */
export function getContentTypeFromStrategy(strategy: string): ContentType {
  switch (strategy.toUpperCase()) {
    case "RSS":
      return ContentType.RSS;
    case "REDDIT":
    case "HACKERNEWS":
      return ContentType.SOCIAL;
    case "HTML":
      return ContentType.ARTICLE;
    default:
      return ContentType.GENERIC;
  }
}
