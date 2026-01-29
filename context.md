# PulseFlow - Project Context

> Last updated: 2026-01-29

## Project Vision

PulseFlow is an AI-native web scraping engine that monitors web pages ("Signals") and triggers LLM-summarized alerts ("Pulses") when changes are detected.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5.9.3 (strict mode) |
| Styling | Tailwind CSS 4.1.18 + Shadcn/UI |
| Icons | Tabler Icons React |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 6.19.2 |
| Auth | Supabase Auth |
| Background Jobs | Inngest |
| Testing | Vitest |
| State | nuqs (URL state) |

## Current State

### Phase 1: Scraper Service - COMPLETE

1. **Scraper Infrastructure** (`src/services/scrapers/infrastructure/`)
   - `rateLimiter.ts` - Per-domain 2-second rate limiting
   - `robotsChecker.ts` - robots.txt parser with 1-hour cache
   - `httpClient.ts` - Fetch wrapper with User-Agent header

2. **Scraper Providers** (`src/services/scrapers/providers/`)
   - `genericRssProvider.ts` - RSS/Atom feed parsing
   - `redditProvider.ts` - Reddit .json API
   - `hackerNewsProvider.ts` - HN Algolia API
   - `genericHtmlProvider.ts` - Cheerio-based HTML fallback
   - `baseProvider.ts` - Shared logic (retry, dry-run, guards)

3. **Provider Registry** (`src/services/scrapers/registry/`)
   - `siteRegistry.ts` - Domain → Strategy mapping
   - `providerFactory.ts` - URL → Provider routing

4. **Inngest Integration**
   - `src/inngest/client.ts` - Inngest client
   - `src/inngest/functions/scrapeSignal.ts` - Background scrape job
   - `src/app/api/inngest/route.ts` - Webhook endpoint

5. **Database Updates**
   - `ScraperStrategy` enum (RSS, REDDIT, HACKERNEWS, HTML, AUTO)
   - `Signal.strategy` field
   - `Signal.lastScrapedAt` field
   - `src/lib/prisma.ts` - Prisma client singleton

6. **Testing Setup**
   - Vitest configured with path aliases
   - 33 unit tests passing
   - Coverage for rate limiter, registry, factory, base provider

### Previously Completed

1. **Project Infrastructure**
   - Next.js 16 with TypeScript strict mode
   - Tailwind CSS v4 with custom color scheme
   - Shadcn/UI components (Button, Card, Input, Label)
   - ESLint configuration

2. **Authentication System**
   - Email/password signup and login
   - OAuth (Google and Facebook)
   - Session management with cookies
   - Protected routes (dashboard redirects to login)
   - UserMenu component with logout
   - **User sync from Supabase Auth to Prisma**

3. **Database Layer**
   - Prisma schema: User, Signal, Pulse models
   - Supabase PostgreSQL connection

4. **Error Handling**
   - Custom `AppError` class
   - `Result<T>` pattern with `ok()` and `err()` helpers

## Pending Tasks

### Phase 2: LLM Service (Next)

1. **LLM Integration** - `src/services/llm/`
   - Claude API client setup
   - Change summarization prompts
   - Diff analysis between pulses
   - Token usage tracking

### Phase 3: Alert Service

2. **Alert Generation** - `src/services/alerts/`
   - Significant change detection
   - Alert creation and storage
   - Delivery mechanisms (email, webhook)

### Phase 4: Signal Management UI

3. **Signal CRUD**
   - Create signal form (URL, selector, interval, strategy)
   - Signal list view with status
   - Edit/delete signals
   - Manual trigger button

4. **Dashboard Enhancements**
   - Signal metrics and health status
   - Recent pulses timeline
   - Pulse detail view with diff
   - Scrape history

### Phase 5: Production Readiness

5. **Scheduling**
   - Inngest cron functions for periodic scraping
   - Per-signal interval configuration

6. **Monitoring**
   - Error tracking
   - Scrape success/failure metrics
   - Rate limit monitoring

## Directory Structure

```
src/
├── app/
│   ├── api/inngest/        # Inngest webhook
│   ├── auth/               # Auth actions and callbacks
│   ├── dashboard/          # Protected dashboard
│   ├── login/              # Login page
│   └── signup/             # Signup page
├── components/
│   ├── ui/                 # Shadcn base components
│   └── features/           # Feature-specific components
├── inngest/
│   ├── client.ts           # Inngest client
│   └── functions/          # Background job definitions
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── errors.ts           # Error handling
│   ├── prisma.ts           # Prisma client singleton
│   └── utils.ts            # Helper functions
├── services/
│   ├── scrapers/           # COMPLETE - Web scraping
│   │   ├── infrastructure/ # Rate limiter, robots, HTTP
│   │   ├── providers/      # RSS, Reddit, HN, HTML
│   │   └── registry/       # Provider factory
│   ├── llm/                # TODO - LLM integration
│   └── alerts/             # TODO - Alert delivery
└── hooks/                  # Custom React hooks
```

## Key Interfaces

```typescript
// Scraper options
interface ScraperOptions {
  url: string;
  dryRun?: boolean;      // Default: false
  delayMs?: number;      // Default: 2000
  maxRetries?: number;   // Default: 3
  selector?: string;     // For HTML provider
}

// Scrape result
interface ScrapeResult {
  items: ScrapedItem[];
  scrapedAt: Date;
  provider: ScraperStrategy;
  dryRun: boolean;
}

// Provider contract
interface IScraperProvider {
  readonly strategy: ScraperStrategy;
  canHandle(url: string): boolean;
  scrape(options: ScraperOptions): Promise<Result<ScrapeResult>>;
}
```

## Inngest Events

| Event | Payload | Description |
|-------|---------|-------------|
| `signal/scrape.requested` | `{ signalId, dryRun? }` | Triggers a scrape job |

## Git History (Recent)

```
ef26d61 feat(auth): sync Supabase Auth users to Prisma database
e70f424 feat(scraper): add scraper service with 4 providers and Inngest integration
9e5f627 feat(ui): add UserMenu component and browser Supabase client
843fb9c feat(auth): add email/password authentication
fbb6a6f feat(auth): add Supabase OAuth authentication
```

## Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run typecheck        # Type checking
npm run lint             # ESLint

# Testing
npm test                 # Vitest watch mode
npm run test:run         # Single test run
npm run test:coverage    # With coverage report

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio

# Inngest
npx inngest-cli dev      # Local Inngest dev server
```

## Blocked Domains

The scraper blocks these domains by default:
- amazon.com, linkedin.com, twitter.com, x.com
- facebook.com, instagram.com, tiktok.com, netflix.com
