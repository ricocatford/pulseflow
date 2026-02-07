# PulseFlow - Project Context

> Last updated: 2026-02-04

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

### Phase 4: Signal Management UI & Dashboard - COMPLETE

1. **Dashboard Pages** (`src/app/dashboard/`)
   - `layout.tsx` - Authenticated layout with sidebar navigation (Overview, Signals, Settings)
   - `page.tsx` - Overview with StatsCards and RecentActivity
   - `signals/page.tsx` - Signal list with search, status filter, pagination (10 per page)
   - `signals/[id]/page.tsx` - Signal detail with config sidebar and PulseTimeline
   - `pulses/[id]/page.tsx` - Pulse detail with AI summary, PulseDiffView, and raw data

2. **Signal Components** (`src/components/features/signals/`)
   - `SignalForm.tsx` - Create/edit form (name, URL, strategy, interval, CSS selector)
   - `SignalFormDialog.tsx` - Dialog wrapper for SignalForm
   - `SignalTable.tsx` - Responsive table with inline actions (edit, trigger, toggle, delete)
   - `SignalFilters.tsx` - Search input and status filter using URL state
   - `SignalPagination.tsx` - Page navigation with total count
   - `SignalStatusBadge.tsx` - Active/Inactive badge
   - `StrategyBadge.tsx` - Color-coded strategy labels
   - `TriggerScrapeButton.tsx` - Manual scrape trigger via Inngest

3. **Pulse Components** (`src/components/features/pulses/`)
   - `PulseTimeline.tsx` - Timeline visualization with status icons and summaries
   - `PulseDiffView.tsx` - Tabbed diff view (Changes, All Items, Raw Data) with added/removed/unchanged items
   - `PulseStatusBadge.tsx` - SUCCESS/FAILED badge

4. **Dashboard Components** (`src/components/features/dashboard/`)
   - `StatsCards.tsx` - Active signals count, total pulses, alerts today
   - `RecentActivity.tsx` - Recent pulses and alerts feed (last 5 each)

5. **Server Actions** (`src/actions/`)
   - `signals.ts` - Full CRUD: create, update, delete, toggle active, trigger scrape, list (filtered/paginated), get by ID
   - `pulses.ts` - Get pulse by ID with previous pulse for diff
   - `dashboard.ts` - Stats and recent activity queries

6. **Custom Hooks** (`src/hooks/`)
   - `useSignalFilters.ts` - URL-based state via `nuqs` (search, status, page)

7. **Deploy Fix** (`7dc6bdc`)
   - Resolved auth redirect to localhost
   - Upgraded LLM to gemini-2.5-flash-lite

### Phase 3: Alert Service - COMPLETE

1. **Alert Infrastructure** (`src/services/alerts/infrastructure/`)
   - `changeDetector.ts` - Detects added/removed/updated items between scrapes
   - `emailClient.ts` - Resend SDK wrapper for sending emails

2. **Alert Providers** (`src/services/alerts/providers/`)
   - `baseProvider.ts` - Provider factory with retry, dry-run, validation
   - `webhookProvider.ts` - JSON POST with timeout and X-PulseFlow-Event header
   - `emailProvider.ts` - HTML/text email via Resend

3. **Email Templates** (`src/services/alerts/templates/`)
   - `alertEmail.ts` - HTML and plain-text alert templates

4. **Types & Constants** (`src/services/alerts/`)
   - `types.ts` - IAlertProvider, ChangeDetectionResult, AlertOptions
   - `constants.ts` - Timeouts, retry delays, error codes
   - `index.ts` - Public exports

5. **Database Models** (`prisma/schema.prisma`)
   - `AlertChannel` enum (EMAIL, WEBHOOK)
   - `AlertStatus` enum (PENDING, SENT, FAILED)
   - `ChangeType` enum (NEW_ITEMS, REMOVED, UPDATED, MIXED)
   - `AlertDestination` model - per-signal notification destinations
   - `Alert` model - delivery history with status tracking

6. **Inngest Integration**
   - Added `detect-changes` step to compare with previous pulse
   - Added `send-alerts` step to deliver to all active destinations
   - Records alert status in database

7. **Environment Variables** (`src/lib/env.ts`)
   - `RESEND_API_KEY` for email delivery
   - `EMAIL_FROM` for sender address

### Phase 2: LLM Service - COMPLETE

1. **LLM Infrastructure** (`src/services/llm/infrastructure/`)
   - `geminiClient.ts` - Gemini API client with availability check

2. **LLM Providers** (`src/services/llm/providers/`)
   - `baseProvider.ts` - Provider factory with shared logic
   - `geminiProvider.ts` - Google Gemini implementation

3. **Prompts** (`src/services/llm/prompts/`)
   - `summarize.ts` - Context-aware summarization prompts by content type

4. **Types & Constants** (`src/services/llm/`)
   - `types.ts` - ILLMProvider interface, SummarizeOptions, SummaryResult
   - `constants.ts` - Model config, token limits, error codes
   - `index.ts` - Public exports and provider registry

5. **Environment Variables** (`src/lib/env.ts`)
   - Typed environment variable access with validation
   - `GEMINI_API_KEY` for LLM provider

6. **Inngest Integration**
   - Added LLM summarization step to `scrapeSignal` function
   - Stores summary in Pulse record after successful scrape
   - Graceful degradation when LLM unavailable

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
   - 122 unit tests passing
   - Coverage for all services (scrapers, llm, alerts)

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

### Phase 5: Production Readiness (Next)

1. **Scheduling**
   - Inngest cron functions for periodic scraping
   - Per-signal interval configuration

2. **Alert Destination Management UI**
   - CRUD for email and webhook destinations per signal
   - Currently alerts display in dashboard but destinations have no management UI

3. **Monitoring**
   - Error tracking
   - Scrape success/failure metrics
   - Rate limit monitoring

4. **Keyword/Content Filtering** (not yet implemented)
   - Currently the system uses change detection only (new/removed/updated items)
   - No keyword search or content matching exists yet

## Directory Structure

```
src/
├── app/
│   ├── api/inngest/            # Inngest webhook
│   ├── auth/                   # Auth actions and callbacks
│   ├── dashboard/              # Protected dashboard
│   │   ├── layout.tsx          # Sidebar + header layout
│   │   ├── page.tsx            # Overview (stats + activity)
│   │   ├── signals/
│   │   │   ├── page.tsx        # Signal list (filtered/paginated)
│   │   │   └── [id]/page.tsx   # Signal detail + pulse timeline
│   │   └── pulses/
│   │       └── [id]/page.tsx   # Pulse detail + diff view
│   ├── login/                  # Login page
│   └── signup/                 # Signup page
├── actions/                    # Server Actions
│   ├── signals.ts              # Signal CRUD + trigger scrape
│   ├── pulses.ts               # Pulse queries
│   └── dashboard.ts            # Stats + recent activity
├── components/
│   ├── ui/                     # Shadcn base components
│   └── features/
│       ├── signals/            # Signal management components
│       ├── pulses/             # Pulse visualization components
│       ├── dashboard/          # Stats and activity components
│       └── UserMenu.tsx        # Auth user menu
├── hooks/
│   └── useSignalFilters.ts     # URL state via nuqs
├── inngest/
│   ├── client.ts               # Inngest client
│   └── functions/              # Background job definitions
├── lib/
│   ├── supabase/               # Supabase clients
│   ├── errors.ts               # Error handling
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # Helper functions
└── services/
    ├── scrapers/               # COMPLETE - Web scraping
    │   ├── infrastructure/     # Rate limiter, robots, HTTP
    │   ├── providers/          # RSS, Reddit, HN, HTML
    │   └── registry/           # Provider factory
    ├── llm/                    # COMPLETE - LLM integration
    │   ├── infrastructure/     # Gemini API client
    │   ├── providers/          # Gemini provider
    │   └── prompts/            # Summarization prompts
    └── alerts/                 # COMPLETE - Alert delivery
        ├── infrastructure/     # Change detector, email client
        ├── providers/          # Webhook, email providers
        └── templates/          # Email templates
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

// LLM summarize options
interface SummarizeOptions {
  content: string;
  dryRun?: boolean;
  maxRetries?: number;   // Default: 3
  contentType?: ContentType;  // RSS, SOCIAL, ARTICLE, GENERIC
  maxLength?: number;    // Default: 500
}

// LLM provider contract
interface ILLMProvider {
  readonly provider: LLMProvider;
  readonly model: string;
  summarize(options: SummarizeOptions): Promise<Result<SummaryResult>>;
  isAvailable(): boolean;
}

// Alert change detection options
interface ChangeDetectionOptions {
  previous: ComparableItem[];
  current: ComparableItem[];
  minNewItems?: number;      // Default: 1
  detectRemovals?: boolean;  // Default: false
  detectUpdates?: boolean;   // Default: false
}

// Alert provider contract
interface IAlertProvider {
  readonly channel: AlertChannel;
  send(options: AlertOptions): Promise<Result<AlertDeliveryResult>>;
  validateDestination(destination: string): boolean;
}
```

## Inngest Events

| Event | Payload | Description |
|-------|---------|-------------|
| `signal/scrape.requested` | `{ signalId, dryRun? }` | Triggers a scrape job |

## Git History (Recent)

```
7dc6bdc fix(deploy): resolve auth redirect to localhost and upgrade to gemini-2.5-flash-lite
d290604 feat(dashboard): add signal and pulse management UI
e58273c feat(alerts): add alert service with change detection and delivery
e5e9778 feat(llm): upgrade to gemini-2.0-flash and add dev scripts
99d4b1f feat(llm): add LLM service with Gemini provider and Inngest integration
2b5b4d3 docs: update context.md with Phase 1 completion and next steps
ef26d61 feat(auth): sync Supabase Auth users to Prisma database
e70f424 feat(scraper): add scraper service with 4 providers and Inngest integration
9e5f627 feat(ui): add UserMenu component and browser Supabase client
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
