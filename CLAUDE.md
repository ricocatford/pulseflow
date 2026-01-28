# PulseFlow - Project Guidelines

> AI-native scraping engine that monitors web signals and triggers LLM-summarized alerts.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Background Jobs:** Inngest

---

## Code Style & Preferences

- **Functional over imperative:** Use pure functions, avoid classes unless necessary
- **Strictly typed interfaces:** Define explicit TypeScript interfaces for all data structures; no implicit `any`
- **UI Components:** Use Shadcn/UI for all user-facing components
- **Icons:** Use @tabler/icons-react exclusively
- **Naming:**
  - Components: PascalCase (`SignalCard.tsx`)
  - Utilities/hooks: camelCase (`useSignalMonitor.ts`)
  - Types/interfaces: PascalCase with `I` prefix for interfaces when needed
- **File organization:** One component per file, co-locate tests with source

---

## Architecture

Layered architecture with clear separation of concerns:

```
src/
├── app/                 # Next.js App Router pages and layouts
├── components/          # Reusable UI components (Shadcn-based)
│   ├── ui/              # Base Shadcn components
│   └── features/        # Feature-specific compound components
├── lib/                 # Utilities, constants, type definitions
│   ├── utils.ts         # Helper functions
│   ├── types.ts         # Shared TypeScript types
│   └── constants.ts     # App-wide constants
├── services/            # Business logic layer
│   ├── scrapers/        # Web scraping implementations
│   ├── alerts/          # Alert generation and delivery
│   └── llm/             # LLM integration for summarization
├── hooks/               # Custom React hooks for state management
├── actions/             # Server Actions
└── inngest/             # Background job definitions
```

---

## Scraping Constraints

1. **Execution context:** Scrapers run ONLY via API routes or Inngest functions, never client-side
2. **Rate limiting:** Implement minimum 2-second delays between requests to the same domain
3. **Libraries:** Use Cheerio for static HTML; Puppeteer only when JavaScript rendering is required
4. **Dry-run mode:** Every scraper MUST support a `dryRun: boolean` parameter that logs actions without executing
5. **User-Agent:** Always set a legitimate User-Agent header
6. **Respect robots.txt:** Check and honor robots.txt rules before scraping
7. **Error resilience:** Implement exponential backoff on failures (max 3 retries)

```typescript
interface ScraperOptions {
  url: string;
  dryRun?: boolean;  // Required on all scrapers
  delayMs?: number;  // Default: 2000
  maxRetries?: number;
}
```

---

## Error Handling

Use a unified error handling pattern throughout the codebase:

```typescript
// src/lib/errors.ts
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Result pattern for service functions
type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };
```

**Rules:**
- Never leave empty catch blocks
- Always log errors with context before re-throwing or returning
- Use `Result<T>` pattern for service-layer functions
- Use try/catch with `AppError` in API routes and Server Actions
- Include original error in `context` when wrapping errors

---

## Git Commands

Follow Conventional Commits strictly:

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
refactor: Code change that neither fixes a bug nor adds a feature
style:    Formatting, missing semicolons, etc.
test:     Adding or updating tests
chore:    Maintenance tasks, dependency updates
```

**Workflow:**
1. Complete and test the feature locally
2. Stage changes: `git add <specific-files>`
3. Commit with conventional format: `git commit -m "feat(scraper): add dry-run mode to signal monitor"`
4. Push and create PR via gh CLI: `gh pr create --fill`

---

## State Management

Prefer lightweight, URL-driven state:

1. **URL State:** Use `nuqs` for search params, filters, pagination
2. **Server State:** Leverage React Server Components for data fetching
3. **Form State:** Use React 19 `useActionState` with Server Actions
4. **Local UI State:** `useState` for component-specific ephemeral state
5. **Avoid:** Heavy global state managers (Redux, Zustand) unless absolutely necessary

```typescript
// Preferred: URL state with nuqs
const [search, setSearch] = useQueryState('q');

// Preferred: Server Component data fetching
async function SignalList() {
  const signals = await getSignals(); // Direct DB call in RSC
  return <SignalTable data={signals} />;
}
```

---

## Constraints

1. **No `any` type:** Use `unknown` and narrow types explicitly
2. **Dependency checks:** Before suggesting a new library, verify it exists in `package.json`
3. **Technical Design requirement:** For complex tasks, write a Technical Design comment in the CLI before implementation:
   ```
   // TECHNICAL DESIGN: [Feature Name]
   // Problem: ...
   // Approach: ...
   // Files affected: ...
   // Edge cases: ...
   ```
4. **No unused code:** Remove dead code, don't comment it out
5. **Environment variables:** All secrets via `.env.local`, typed in `src/lib/env.ts`

---

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm lint                   # Run ESLint
pnpm typecheck              # Run TypeScript compiler check

# Database
pnpm prisma generate        # Generate Prisma client
pnpm prisma db push         # Push schema to DB
pnpm prisma studio          # Open Prisma Studio

# Inngest
pnpm inngest-cli dev        # Local Inngest dev server
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SignalCard.tsx` |
| Hooks | camelCase with `use` prefix | `useSignalMonitor.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `Signal.types.ts` |
| Server Actions | camelCase with `action` suffix | `createSignalAction.ts` |
| Inngest Functions | kebab-case | `process-signal.ts` |
