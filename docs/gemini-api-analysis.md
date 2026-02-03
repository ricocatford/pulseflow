# Gemini API Analysis & Budget Plan

> Analysis date: 2026-02-03

## Problem Diagnosis

The Gemini API is returning **429 Too Many Requests** with `limit: 0`:

```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent:
[429 Too Many Requests] You exceeded your current quota

Quota exceeded for metric: generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash
```

### Root Cause

The free tier quota is explicitly set to `0`, which means:

1. **Regional restriction**: Free tier is not available in EU, UK, or Switzerland
2. **Quota exhaustion**: Daily/per-minute quota has been completely used
3. **Account limitation**: Google may have restricted free tier access for your project

---

## Current Gemini Pricing (January 2026)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Free Tier Available |
|-------|----------------------|------------------------|---------------------|
| **gemini-2.0-flash** | $0.10 | $0.40 | Yes (limited) |
| gemini-2.5-flash-lite | $0.10 | $0.40 | Yes |
| gemini-2.5-flash | $0.30 | $2.50 | Yes |
| gemini-2.5-pro | $1.25-$2.50 | $10.00-$15.00 | Limited |
| gemini-3-pro-preview | $2.00-$4.00 | $12.00-$18.00 | No |

### Free Tier Limitations (Post December 2025)

- **5-15 requests per minute** (reduced from previous limits)
- **~20-50 requests per day** for Flash models
- **Regional restrictions**: EU, UK, Swiss users cannot use free tier
- **Data usage**: Content used to improve Google's products on free tier

---

## $1/Month Budget Plan

### Token Budget Calculation

Using `gemini-2.0-flash` at $0.10 input + $0.40 output per 1M tokens:

| Budget | Input Tokens | Output Tokens | Estimated Summaries |
|--------|-------------|---------------|---------------------|
| $1.00 | ~2,000,000 | ~500,000 | **~1,000-2,000** |
| $0.50 | ~1,000,000 | ~250,000 | ~500-1,000 |
| $0.25 | ~500,000 | ~125,000 | ~250-500 |

### Current Configuration Analysis

```typescript
// src/services/llm/constants.ts
export const GEMINI_MODEL = "gemini-2.0-flash";
export const DEFAULT_MAX_TOKENS = 500;           // Output limit
export const MAX_INPUT_CONTENT_LENGTH = 30000;   // ~7,500 tokens
```

**Cost per summary**:
- Input: ~7,500 tokens × $0.10/1M = $0.00075
- Output: ~500 tokens × $0.40/1M = $0.0002
- **Total: ~$0.001 per summary**

With $1/month budget: **~1,000 summaries**

### Optimized Configuration (Optional)

To reduce costs further:

```typescript
export const DEFAULT_MAX_TOKENS = 300;           // Reduce from 500
export const MAX_INPUT_CONTENT_LENGTH = 15000;   // Reduce from 30000
```

This would approximately double your summary capacity to ~2,000/month.

---

## Setup Instructions

### Step 1: Enable Billing

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click on your project settings
3. Link to a Google Cloud billing account
4. Enable the Generative Language API if not already enabled

### Step 2: Set Budget Alerts

1. Go to [Cloud Console Billing](https://console.cloud.google.com/billing)
2. Select your billing account
3. Click "Budgets & alerts"
4. Create a new budget:
   - Name: "Gemini API Budget"
   - Amount: $1.00
   - Alert thresholds: 50%, 80%, 100%
   - Email notifications: Enable

### Step 3: Set API Quota Limits (Prevents Overspending)

1. Go to [API Quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
2. Find and edit these quotas:
   - `GenerateContentRequestsPerMinute`: Set to 10-20
   - `GenerateContentRequestsPerDay`: Set to 50-100

### Step 4: Verify Configuration

Ensure your `.env` has the API key:

```env
GEMINI_API_KEY=your_api_key_here
```

---

## Alternative Models

If you want to try newer models at the same price point:

### gemini-2.5-flash-lite

Same pricing as 2.0-flash but with improved capabilities:

```typescript
// src/services/llm/constants.ts
export const GEMINI_MODEL = "gemini-2.5-flash-lite";
```

### Model Comparison for Budget Use

| Model | Best For | Cost |
|-------|----------|------|
| gemini-2.0-flash | Simple summaries, lowest cost | $0.10/$0.40 |
| gemini-2.5-flash-lite | Better quality, same cost | $0.10/$0.40 |
| gemini-2.5-flash | Complex analysis | $0.30/$2.50 |

---

## Monitoring Usage

### Google Cloud Console

Monitor your API usage at:
- [API Dashboard](https://console.cloud.google.com/apis/dashboard)
- [Billing Reports](https://console.cloud.google.com/billing/reports)

### In-App Tracking (Optional Enhancement)

The current implementation captures token usage:

```typescript
// Response includes token count
return {
  text: text.trim(),
  tokensUsed: response.usageMetadata?.totalTokenCount,
};
```

Consider logging this to track usage patterns.

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Model | gemini-2.0-flash |
| Input cost | $0.10 per 1M tokens |
| Output cost | $0.40 per 1M tokens |
| Cost per summary | ~$0.001 |
| Summaries per $1 | ~1,000 |
| Recommended daily limit | 30-50 requests |
| Recommended RPM limit | 10-20 |

---

## Resources

- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API Billing](https://ai.google.dev/gemini-api/docs/billing)
- [Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google Cloud Budgets](https://cloud.google.com/billing/docs/how-to/budgets)
