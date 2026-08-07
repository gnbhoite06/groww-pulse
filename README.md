# Groww Pulse — Weekly Review Digest

An internal tool that turns App Store + Play Store reviews into a weekly one-page digest for Groww's product, growth, and support teams: **top themes → real user quotes → action ideas → a ready-to-send email**, in four clicks.

Built for the "Weekly Review Pulse" brief: automated import → group → summarize → draft-email pipeline over the last 8–12 weeks of reviews, with zero PII in any output.

## Why this exists

| Team | What they get |
|---|---|
| Product / Growth | A ranked list of what's actually breaking for users this week, not anecdotes |
| Support | The exact language customers are using, so responses can mirror it |
| Leadership | A 30-second read: 3 themes, 3 quotes, 3 actions — no dashboard-diving required |

## How it works

Four pages, one flow, plus a competitor benchmark layered on top:

1. **`/reviews`** — one-click import. Pulls App Store reviews from Apple's public RSS feed and Play Store reviews via the (unofficial, public-page-only) `google-play-scraper` package — no login, no scraping behind auth. A **Fetch competitor reviews** button runs the same pipeline for Zerodha Kite, Upstox, and Angel One (config in `lib/competitors.ts`), tagged by product. A CSV upload is available as a manual fallback. A status strip always shows *last sourced*, *method*, and *review counts* so it's obvious whether you're looking at fresh or stale data.
2. **`/`** (Dashboard) — Groww's reviews grouped into ≤5 themes (KYC, Onboarding, Payments, Withdrawals, Statements) by keyword classification, with counts and average rating per theme as a bar chart, plus:
   - a **week-over-week line chart** (toggle: avg rating / review volume) plotting Groww against every competitor with review data, and
   - a **competitor comparison table** (avg rating, review count, top complaint theme per product).
3. **`/pulse`** (Weekly Note) — generates the one-pager: top 3 themes, one representative (lowest-rated, real) quote per theme, and 3 action ideas — editable inline before you ship it.
4. **`/email`** — renders the note as an email draft. "Open in mail client" uses a `mailto:` link (opens *your own* mail app, nothing is sent from a server) or "Copy text" to paste anywhere.

No reviewer usernames, emails, or IDs are stored or displayed anywhere in the app.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind v4
- Theme classification and note generation run as Next.js API routes (`/api/fetch-reviews`, `/api/fetch-competitors`, `/api/classify`, `/api/trend`, `/api/products-summary`) — server-side, so they can reach Apple's RSS feed and Play Store without the CORS/CSP restrictions a client-only app would hit
- **Neon Postgres** (`@neondatabase/serverless`) stores every imported review, tagged by `product` (Groww + each competitor), so history persists across sessions and powers the week-over-week trend chart. Schema is created/migrated on demand in `lib/db.ts` (`ensureSchema`) — no manual migration step.
- Charts via `recharts` (already a dependency, now wired into the dashboard)
- Fonts: Fira Sans (UI) + Fira Code (tabular numbers), matched to a data-dense dashboard use case
- Colors: Groww's brand mint/teal (`#00D09C`) + deep navy ink, light theme by default with a persistent dark-mode toggle

## Running locally

```bash
npm install
vercel env pull .env.local --environment=production   # pulls DATABASE_URL from the linked Neon integration
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Reviews**, and click **Fetch latest reviews** (defaults are pre-filled with Groww's real App Store id and Play Store package).

## Re-running for a new week

1. Go to `/reviews`, confirm the App Store ID / Play Store package / weeks-back window, click **Fetch latest reviews**.
   - If Apple's RSS feed returns 0 App Store reviews, that's a known indexing gap on Apple's side for some apps (verified live during development — the same code returns real reviews for other app ids) — not a bug here. Play Store review volume from the scraper is unaffected.
   - Click **Fetch competitor reviews** in the same panel to refresh Zerodha Kite / Upstox / Angel One for the same window — needed for the week-over-week chart and comparison table to reflect the current week.
2. Go to `/` to sanity-check the theme breakdown, week-over-week trend, and competitor table before generating the note.
3. Go to `/pulse`, click **Generate note**, edit the 3 action ideas if needed.
4. Go to `/email`, fill in **To**, click **Open in mail client** (or **Copy text** to paste into Slack/Notion/wherever).

Both fetch buttons are idempotent — re-running them re-pulls the current window and inserts only genuinely new reviews (deduped by product + source + date + rating + text), so it's safe to click weekly without creating duplicates.

## Theme legend

| Theme | Matched on |
|---|---|
| KYC | kyc, verification, aadhaar, pan, rejected, re-kyc |
| Onboarding | onboarding, signup, account opening, document upload |
| Payments | payment, upi, debited, gateway, autopay, mandate, sip |
| Withdrawals | withdrawal, redemption, redeem, processing, credited |
| Statements | statement, capital gains, holdings, pdf, tax |

Reviews matching none of the above are excluded from the top-3 ranking (classified as "Other" internally). Classification is keyword-based — deterministic and auditable, not an LLM call — see `lib/classify.ts`.

## Sample artifacts (for reviewers without running the app)

- [`sample-reviews.csv`](./sample-reviews.csv) — 63 representative reviews (redacted/sample, no PII), the kind of data the app ingests
- [`sample-weekly-pulse.md`](./sample-weekly-pulse.md) — a generated one-pager from that sample
- [`sample-email-draft.txt`](./sample-email-draft.txt) — the corresponding email draft

## Competitor benchmark

`lib/competitors.ts` holds the tracked set — App Store id + Play Store package per product:

| Product | App Store id | Play Store package |
|---|---|---|
| Groww | 1404871703 | com.nextbillion.groww |
| Zerodha Kite | 1449453802 | com.zerodha.kite3 |
| Upstox | 1584953620 | in.upstox.app |
| Angel One | 1060530981 | com.msf.angelmobile |

Add or swap a competitor by editing `COMPETITORS` in that file — the fetch, classification, trend, and comparison-table logic all key off `product`, so no other code changes are needed.

## Known limitations / what a production version would add

- **No auth.** Internal-only by assumption. Add SSO before exposing this beyond localhost.
- **App Store RSS coverage gap.** Apple's public review feed doesn't reliably index every app; confirmed live against Groww's real app id (0 results on some runs) vs. a high-traffic app (200+ results) — a known gap on Apple's side, not a request failure. Play Store import is unaffected.
- **Reddit was scoped out.** Both direct requests and available fetch tooling were blocked from reaching reddit.com during development (403 / network-level block) — no Reddit data is included rather than fabricating it. Adding it for real needs Reddit's official OAuth API (PRAW or equivalent), not the now-blocked anonymous JSON endpoints.
- **Action ideas are template-matched per theme**, not LLM-generated — deliberately, to keep the pipeline deterministic and free of API-key dependencies for this prototype. Swapping in a Claude API call in `lib/classify.ts` to draft actions from the actual quotes would be the natural next step.
- **Competitor fetches are unauthenticated, best-effort scrapes** of the same public pages the app itself uses for Groww — same terms as the primary pipeline (no login, no auth bypass), but a third party's review volume/rating on a given day is out of this app's control.
