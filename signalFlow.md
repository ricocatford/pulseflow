# Signal Flow - How Signals Work in PulseFlow

## Where You Configure a Signal

When you create a signal (via the form in `src/components/features/signals/SignalForm.tsx`), you fill in:

1. **Name** -- a label for the signal (e.g., "Competitor Blog Updates")
2. **URL** -- the exact page you want to monitor
3. **Strategy** -- how to scrape it: `AUTO`, `RSS`, `REDDIT`, `HACKERNEWS`, or `HTML`
4. **Check Interval** -- how often to re-scrape (15, 30, 60, 120, or 240 minutes)
5. **CSS Selector** (optional) -- targets specific parts of an HTML page (e.g., `.article-content`)

## There Are No Keywords

PulseFlow does not search for keywords. There is no text field where you type words to look for. Instead, the system works on **change detection** -- it compares the current scrape to the previous scrape and alerts you when something is new, removed, or updated.

The logic in `src/services/alerts/infrastructure/changeDetector.ts` does this:

- **New items**: items present now but not in the last scrape (this is the default trigger)
- **Removed items**: items gone since last scrape (off by default)
- **Updated items**: same item but content changed (off by default)

So if you monitor an RSS feed, you get alerted when new posts appear -- not when specific words show up.

## It Scans Only the Single URL You Provide

The system does **not** crawl the whole website. Each signal monitors **one specific URL**. For example:

- `https://example.com/blog/feed.xml` -- monitors that RSS feed only
- `https://news.ycombinator.com/newest` -- monitors that specific HN page
- `https://reddit.com/r/programming` -- monitors that subreddit's front page

The scraper fetches the page at that URL, extracts items from it (posts, articles, entries), and stores them as a "Pulse." It never follows links to other pages or crawls deeper.

## The Full Flow

1. **You create a signal** with a URL and strategy
2. **On each interval** (or manual trigger), an Inngest function (`src/inngest/functions/scrapeSignal.ts`) fires
3. **The scraper** fetches that single URL and extracts structured items (title, content, author, date)
4. **The LLM** (Gemini) optionally summarizes the scraped content
5. **A Pulse** is saved to the database with the raw items and summary
6. **Change detection** compares current items to the previous Pulse's items
7. **If changes are found**, alerts are sent to your configured destinations (email or webhook)

## What Each Strategy Actually Does

| Strategy | What it does |
|----------|-------------|
| **AUTO** | Guesses based on URL patterns (reddit.com -> Reddit, URLs with `/feed` -> RSS, etc.) |
| **RSS** | Parses the feed and extracts entries |
| **REDDIT** | Hits Reddit's JSON API for that subreddit/page |
| **HACKERNEWS** | Uses HN's Algolia API |
| **HTML** | Uses Cheerio to parse static HTML, extracts items matching the CSS selector (defaults to `article, .post, .entry, main, .content`) |

## In Summary

- **No keyword search exists** -- the system detects *changes* (new/removed/updated items), not specific words
- **Single URL only** -- no crawling, no following links, just the one page you specify
- If you want keyword-based monitoring, that would need to be built as a new feature (e.g., a filter on top of the change detection)
