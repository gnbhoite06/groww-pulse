# Groww Pulse — Weekly Review Digest

**Live app:** https://groww-pulse-ten.vercel.app

Groww Pulse turns raw App Store and Play Store reviews into something a team can actually act on in a weekly standup: **what are people complaining about → in their own words → what should we do about it → a note ready to email out.** It also tracks the same numbers for three of Groww's competitors (Zerodha Kite, Upstox, Angel One), so "is this normal for the category or specific to us?" has a real answer instead of a guess.

Nothing in this app is fabricated or simulated. Every review shown, every rating average, every quote — comes from a live fetch against Apple's and Google's public review pages, done at the moment you click the fetch button. There is no seed data, no mock dataset, and no LLM inventing plausible-sounding feedback.

---

## 1. Who this is for, and what problem it solves

If you ask "what are users unhappy about this week," the honest answer usually lives scattered across two app stores, thousands of reviews, and nobody's full-time job to read them. Groww Pulse automates the boring middle part — reading everything, sorting it, and pulling out the parts a human should look at — so a person only has to make the final judgment call.

| Team | What they get out of it |
|---|---|
| Product / Growth | A ranked list of what's actually breaking for users this week, backed by counts, not a hunch |
| Support | The exact phrases customers are using, so replies and macros can mirror real language |
| Leadership | A 30-second read: 3 themes, 3 quotes, 3 actions — no dashboard-diving required |

---

## 2. What the app actually does, page by page

The app has four pages. You move through them roughly in order once a week.

### `/reviews` — Import

This is where data enters the system. There are two ways in:

- **One-click fetch.** Type (or leave the pre-filled default of) an App Store numeric ID and a Play Store package name, pick how many weeks back to pull, and click **Fetch latest reviews**. The server then:
  1. Calls Apple's public customer-reviews RSS feed for that app ID (no login involved — this is the same feed a browser would hit).
  2. Calls the Play Store's public review pages through the `google-play-scraper` library, which reads exactly what a signed-out visitor sees on the Play Store website — again, no login.
  3. Paginates through both sources until it either runs out of reviews or the reviews get older than your chosen window. For a huge app like Groww (100M+ installs), the "most recent" reviews on Play Store can be only a day or two old *per page*, so covering a full 12-week window means pulling dozens of pages, not just one — the app does this automatically.
  4. Strips anything that could identify a specific reviewer (see the PII section below) and saves the rest to the database.
- **CSV upload**, as a manual fallback — drop in a file with `source, rating, title, text, date` columns (a `product` column is optional; it defaults to "Groww").

A second button, **Fetch competitor reviews**, runs the exact same pipeline for Zerodha Kite, Upstox, and Angel One in one go, tagging each review with which app it came from.

A status strip on this page always shows *when* data was last pulled, *how* (fetch vs. CSV), and *how many* reviews came from each store, so it's never ambiguous whether you're looking at fresh or stale numbers.

### `/` — Dashboard

Once reviews exist, this page turns them into three views:

1. **Reviews by theme** — every Groww review gets sorted into one of five buckets by keyword matching (see the theme legend below), shown as a bar chart with a count and average rating per theme.
2. **Week-over-week chart** — a line chart plotting either average rating or review volume, one line per product, one point per calendar week, for however many weeks of data exist. This is what lets you see "did KYC complaints spike this week or is this a slow burn."
3. **Competitor comparison table** — for Groww and each competitor with data, shows two rating numbers side by side (explained below), a review count, and that product's single worst-performing theme.

### `/pulse` — Weekly Note

Click **Generate note** and the app builds the actual one-pager: the top 3 themes by volume, one real, verbatim, lowest-rated quote per theme (so the quote reflects an actual complaint, not a cherry-picked positive), and three action ideas — one templated suggestion per theme, editable inline before you commit to it.

### `/email` — Draft

Takes the generated note and turns it into an email you can send. Fill in a **To** address and click **Open in mail client** — this builds a `mailto:` link and hands off to whatever mail app is installed on your machine. Nothing is sent from a server; the app never touches your inbox or holds credentials. There's also a **Copy text** button if you'd rather paste the note into Slack, Notion, or anywhere else.

---

## 3. Why two rating numbers show up per product

If you look at the comparison table and see, say, Angel One at 3.76★ next to a Play Store badge showing 4.42★, that is **not** a bug or a contradiction — it's two different, both-true numbers:

- **Recent sample** — the average rating of only the reviews inside your chosen window (last 8–12 weeks). This is the "voice of right now": people who are currently annoyed post reviews more often and more immediately than people who are quietly satisfied, so a recency-weighted sample almost always skews lower than the true average. That skew is *the point* of a weekly pulse tool — it's supposed to surface current friction, not overall brand health.
- **Store rating** — the app's real, live, all-time rating pulled directly from the Play Store at the moment you loaded the page, averaged across every rating the app has ever received (often millions of them). This is shown next to the recent sample specifically so nobody mistakes "this week's complainers are loud" for "this app is bad."

Both numbers are real and independently verifiable by opening the app's Play Store listing yourself.

---

## 4. No PII, anywhere

The brief this app was built against explicitly forbids storing or displaying anything that could identify a reviewer. Concretely:

- Reviewer usernames are never requested from either public source's response and are never stored.
- Free-text review bodies are scanned and scrubbed before saving: anything that looks like an email address or a long digit sequence (phone numbers, account numbers) is replaced with `[redacted]`.
- The only fields ever stored are: which store the review came from, the star rating, an optional title, the (scrubbed) review text, the date, and which product it's about.

You can audit this yourself in `lib/reviewsRepo.ts` (the insert path) and by inspecting `reviews.csv` if you export one.

---

## 5. Setting it up and running it yourself

```bash
git clone https://github.com/gnbhoite06/groww-pulse.git
cd groww-pulse
npm install
vercel link                                            # connects to the existing Vercel project (one-time)
vercel env pull .env.local --environment=production     # pulls DATABASE_URL and friends from the linked Neon database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The **Reviews** page comes pre-filled with Groww's real App Store ID and Play Store package, so the first thing to do is click **Fetch latest reviews**.

If you don't have access to the linked Vercel project, you'll need your own Postgres database — set `DATABASE_URL` in `.env.local` yourself (any Postgres works; the app was built and tested against [Neon](https://neon.tech)'s serverless driver). The schema is created automatically on first request — there's no migration step to run by hand.

---

## 6. Re-running this for a new week

This is the whole point of the tool, so here's the exact weekly routine:

1. Go to **`/reviews`**. Confirm the App Store ID, Play Store package, and weeks-back window (defaults are fine for the standard weekly run). Click **Fetch latest reviews**.
   - If the App Store count comes back as 0, that's expected sometimes — Apple's public review feed has a known, documented gap where it doesn't reliably index every app on every request (confirmed during development: the exact same request code returns real reviews for other apps, so it's a source-side quirk, not a bug here). Play Store volume is unaffected by this.
2. In the same panel, click **Fetch competitor reviews** to refresh Zerodha Kite, Upstox, and Angel One for the same window. Skip this step if you only care about Groww's own numbers this week.
3. Go to **`/`** (Dashboard) and sanity-check the theme breakdown, the week-over-week trend, and the comparison table before generating anything.
4. Go to **`/pulse`**, click **Generate note**, and edit the three action ideas if last week's still apply or need tweaking.
5. Go to **`/email`**, fill in the recipient, and click **Open in mail client** (or **Copy text**).

Both fetch buttons are safe to click repeatedly — every review is deduplicated by a hash of `product + source + date + rating + text`, so re-running a fetch only ever adds genuinely new reviews and never creates duplicates.

---

## 7. Theme legend

Every review is classified into exactly one theme (or "Other," which is excluded from the top-3 ranking) by checking whether its title + text contains any of these keywords. First match wins, checked in this order:

| Theme | Matched on |
|---|---|
| KYC | kyc, verification, aadhaar, pan, rejected, re-kyc |
| Onboarding | onboarding, signup, account opening, document upload |
| Payments | payment, upi, debited, gateway, autopay, mandate, sip |
| Withdrawals | withdrawal, redemption, redeem, processing, credited |
| Statements | statement, capital gains, holdings, pdf, tax |

This is intentionally simple keyword matching, not an LLM call — it's deterministic, free to run, and auditable (you can trace exactly why any given review landed in a theme by reading `lib/classify.ts`). The tradeoff is that it will occasionally miscategorize a review that uses different words for the same underlying issue; if that starts happening often, add the missing keyword to `THEMES` in that file.

---

## 8. Competitor benchmark — how it's configured

`lib/competitors.ts` is the single source of truth for which apps get tracked alongside Groww:

| Product | App Store ID | Play Store package |
|---|---|---|
| Groww | 1404871703 | com.nextbillion.groww |
| Zerodha Kite | 1449453802 | com.zerodha.kite3 |
| Upstox | 1584953620 | in.upstox.app |
| Angel One | 1060530981 | com.msf.angelmobile |

Every one of these IDs was looked up and confirmed live (via Apple's public iTunes Search API and the Play Store scraper's own app-lookup call) before being hardcoded here — none were guessed.

To track a different or additional competitor, add an entry to the `COMPETITORS` array in that file with its App Store ID and Play Store package name. Nothing else needs to change — the fetch pipeline, theme classification, trend chart, and comparison table all key off the `product` field automatically.

---

## 9. Tech stack, for anyone extending this

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind v4
- Server-side API routes (`/api/fetch-reviews`, `/api/fetch-competitors`, `/api/classify`, `/api/trend`, `/api/products-summary`) do all the external fetching — this has to happen server-side because a browser can't call Apple's RSS feed or the Play Store directly without hitting CORS.
- **Neon Postgres** (`@neondatabase/serverless`) is the only datastore. `lib/db.ts`'s `ensureSchema()` creates and migrates the schema on demand, so there's nothing to run by hand after cloning. Bulk inserts go through `lib/reviewsRepo.ts`'s `bulkInsertReviews`, which batches rows via `unnest()` instead of one `INSERT` per row — this matters once a fetch pulls thousands of reviews for a high-volume app, where row-at-a-time inserts would time out.
- Charts are `recharts`.
- Fonts: Fira Sans (UI) + Fira Code (for anything tabular — ratings, counts, dates).
- Colors: Groww's own brand mint/teal (`#00D09C`) plus a deep navy ink tone; light theme by default with a persistent dark-mode toggle.

---

## 10. Sample artifacts (for anyone who wants to see the output without running the app)

- [`sample-reviews.csv`](./sample-reviews.csv) — a small representative set of reviews (redacted, no PII) in the exact shape the app ingests
- [`sample-weekly-pulse.md`](./sample-weekly-pulse.md) — a generated one-pager from that sample
- [`sample-email-draft.txt`](./sample-email-draft.txt) — the corresponding email draft

---

## 11. Known limitations / what a production version would add

- **No auth.** This is built as an internal single-team tool. Add SSO before exposing it beyond a trusted group.
- **App Store RSS coverage gap.** Apple's public review feed doesn't reliably index every app on every request — verified live during development (0 results on some runs for Groww's real app ID, 200+ results for a higher-traffic app on the identical request). Play Store import is unaffected and is the primary data source in practice.
- **Reddit was scoped out.** Both direct requests and available tooling were blocked from reaching reddit.com during development (403 / network-level block). Rather than fabricate Reddit data, none is included. Adding it properly would need Reddit's official OAuth API, not the now-blocked anonymous JSON endpoints.
- **Action ideas are template-matched per theme, not LLM-generated** — a deliberate choice to keep the pipeline deterministic and free of API-key dependencies. Wiring in a Claude API call to draft actions from the actual quotes would be a natural next step.
- **Competitor fetches are best-effort, unauthenticated pulls** of the same public pages the app uses for Groww — same terms, no login, no bypass — but a competitor's exact review volume or rating on a given day is outside this app's control and can shift between runs.
- **High-volume apps need deep pagination to cover a full window.** Groww alone can produce ~10,000+ reviews inside a 12-week lookback because of how fast its "newest reviews" feed turns over — the fetch pipeline handles this (up to 120 pages per app), but it does mean a full competitor refresh takes on the order of 10–30 seconds, not an instant click.
