/**
 * Manual test script for LLM summarization
 * Run with: npx tsx scripts/test-llm.ts
 */

import "dotenv/config";
import { geminiProvider, ContentType, isLLMAvailable } from "../src/services/llm";

const TEST_CONTENT = `
Breaking: Tech Giants Report Mixed Q4 Earnings

Apple reported revenue of $119.6 billion for Q4 2024, slightly missing analyst expectations
of $121 billion. iPhone sales remained strong in emerging markets, but Mac sales declined
5% year-over-year due to delayed product refreshes.

Microsoft exceeded expectations with $62.0 billion in revenue, driven by Azure cloud
services growth of 29%. The company's AI initiatives, including Copilot integration
across Office products, contributed to increased enterprise subscriptions.

Google parent Alphabet posted revenue of $86.3 billion, with YouTube advertising
showing resilience despite broader market headwinds. Cloud revenue grew 22% to
$9.2 billion, narrowing losses in that division.

Analysts remain cautiously optimistic about 2025, citing potential tailwinds from
enterprise AI adoption and stabilizing consumer spending.
`;

async function main() {
  console.log("=== LLM Summary Test ===\n");

  // Check availability
  console.log("Checking LLM availability...");
  const available = isLLMAvailable();
  console.log(`LLM Available: ${available}`);
  console.log(`Provider: ${geminiProvider.provider}`);
  console.log(`Model: ${geminiProvider.model}`);
  console.log(`Provider Available: ${geminiProvider.isAvailable()}\n`);

  if (!available) {
    console.error("ERROR: No LLM provider available. Check GEMINI_API_KEY.");
    process.exit(1);
  }

  // Test dry run first
  console.log("--- Dry Run Test ---");
  const dryRunResult = await geminiProvider.summarize({
    content: TEST_CONTENT,
    contentType: ContentType.ARTICLE,
    dryRun: true,
  });

  if (dryRunResult.success) {
    console.log("Dry run successful:");
    console.log(`  Provider: ${dryRunResult.data.provider}`);
    console.log(`  Model: ${dryRunResult.data.model}`);
    console.log(`  DryRun: ${dryRunResult.data.dryRun}`);
    console.log(`  Summary: ${dryRunResult.data.summary}\n`);
  } else {
    console.error("Dry run failed:", dryRunResult.error.message);
  }

  // Test real API call
  console.log("--- Live API Test ---");
  console.log("Sending content to Gemini...\n");

  const startTime = Date.now();
  const result = await geminiProvider.summarize({
    content: TEST_CONTENT,
    contentType: ContentType.ARTICLE,
    maxLength: 150,
  });
  const elapsed = Date.now() - startTime;

  if (result.success) {
    console.log("SUCCESS!");
    console.log(`  Time: ${elapsed}ms`);
    console.log(`  Tokens Used: ${result.data.tokensUsed ?? "N/A"}`);
    console.log(`  Generated At: ${result.data.generatedAt.toISOString()}`);
    console.log("\nSummary:");
    console.log("-".repeat(50));
    console.log(result.data.summary);
    console.log("-".repeat(50));
  } else {
    console.error("FAILED!");
    console.error(`  Error: ${result.error.message}`);
    console.error(`  Code: ${result.error.code}`);
    process.exit(1);
  }
}

main().catch(console.error);
