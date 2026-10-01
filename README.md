 # Funkaari

**One place to see what's happening for little ones** — preschool workshops, open days, and play dates, curated from Instagram. Starting in Bangalore.

Stop following dozens of preschool Instagram pages. Browse events in a single feed.

## v1 focus

This MVP focuses on events for **little ones aged 6 months to 6 years** — the sweet spot where preschools and toddler activity centers post most often on Instagram. The site is designed to expand later.

## Quick start

**Easiest way** (works even without Node in PATH):

```bash
cd /Users/komal/Desktop/bangalore-kids-events
./start-dev.sh
```

The script picks a free port (3000–3005), prints the exact URL, and opens your browser.

**Manual way** (requires Node.js installed):

```bash
cd bangalore-kids-events
npm install
npm run dev
```

Open the URL shown in the terminal (often `http://localhost:3000`).

> **Important:** Use `http://` not `https://`. Include the port number (e.g. `:3004`). Do not type just `localhost`.

### Production build

```bash
npm run build
npm start
```

## Features (MVP)

- **Hero** — clear value prop: no need to follow 50 Instagram pages
- **View on Instagram** — each card opens `https://www.instagram.com/{handle}/`
- **Filters** — age group, category, area, this week / this weekend
- **Search** — by event title or preschool name
- **Submit an event** — simple form page for preschools to share Instagram posts
- **Sample data** — 15 realistic Bangalore events with Indian preschool names and neighborhoods

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Event data: curated `src/data/calendar.ts` + pipeline output `src/data/instagram-events.json` + web scrape `src/data/live-bangalore.json`
- Client-side filtering; the "database" is committed JSON under `db/`

## Project structure

```
src/
├── app/              # Pages (home, submit)
├── components/       # Hero, EventCard, EventFilters, etc.
├── data/events.ts    # Sample event data
├── lib/filters.ts    # Filter & date helpers
└── types/event.ts    # TypeScript types
```

## Roadmap

### v2 — Instagram aggregation (in progress)
- `GET /api/instagram/events` — live hashtag feed via Instagram Graph API when tokens are set
- Caption filter: Bangalore + ages 6 months–6 years only
- Official Instagram embed on cards when the URL is a `/p/` or `/reel/` post
- Until Meta tokens exist, curated Instagram captions in `src/data/instagram-posts.ts`

Copy `env.example` to `.env.local` and add `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_IG_USER_ID`.

### v3 — Preschool onboarding
- Self-serve portal for organizers to submit and manage listings
- Verified preschool profiles with logo and recurring events

### v4 — Parent alerts
- WhatsApp or email digests: "3 new events in HSR Layout this week"
- Saved searches and age-based recommendations

### v5 — Expand age range
- Extend listings to **6–12 years** (after-school programs, sports leagues, coding camps)
- **Family events** — weekend outings, festivals, and activities for mixed-age groups
- Keep the same curated-feed model; age filters grow with the catalog

## Instagram → events pipeline (daily)

The main data source. Pulls every new post from the accounts in `src/data/funkaari-following.json` through Meta's Graph API (`business_discovery`), has Sonnet workers decide which posts are kids' events, dedupes them against the event database, and publishes upcoming ones to the site.

```
npm run ig:fetch       # new posts per handle → db/posts/<handle>.json (watermark + id dedup)
npm run ig:pack        # pending posts → .context/runs/<date>/packets/*.json
                       # Sonnet workers write extract/*.json  (see .claude/skills/funkaari-daily)
npm run ig:validate    # schema + vocab check on worker output
npm run ig:match       # auto-attach by post code / booking id; shortlist look-alikes by date ±1 day and location
                       # Sonnet workers answer resolve/*.answers.json for shortlisted posts
npm run ig:apply       # db/events.json, db/triage.json, src/data/instagram-events.json
```

- Run the whole thing with the `funkaari-daily` skill: Opus orchestrates, Sonnet medium workers read captions and images.
- State lives in git under `db/` (see `db/README.md`). The site only reads `src/data/instagram-events.json`, merged in `src/lib/live-feed.ts` alongside the web scrape and the curated `calendar.ts`.
- `npm run ig:seed` registers `calendar.ts` listings once so their posts are recognised as already listed.
- Token: `node scripts/ig/token.mjs` exchanges a short-lived Graph API Explorer token for a Facebook Page token that never expires. Needs `FB_APP_ID` and `FB_APP_SECRET` in `.env.local`.
- The GitHub Action `refresh-events.yml` (Parallel web scrape) still runs alongside; retire it once the pipeline has run cleanly for a couple of weeks.

## Instagram MCP

### Apify (live posts)

Cursor is configured for Apify’s hosted MCP:

`https://mcp.apify.com/?tools=actors,docs,apify/instagram-scraper`

Enable **apify** in Settings → MCP. Cursor will open Apify OAuth on first use (no token in `mcp.json`). After that, this chat can search Actors, read Apify docs, and run **Instagram Scraper**.

The website feed uses the same Actor over REST when `APIFY_TOKEN` is in `.env.local` (`apify~instagram-scraper`). It scrapes hashtag URLs such as `/explore/tags/bangalorekids/` and filters captions to Bangalore + 6 months–6 years.

### Local URL helper

A small stdio server lives at `mcp/instagram-mcp.mjs`.

Tools: `instagram_profile_url`, `instagram_search_url`, `instagram_post_url`.

Enable **instagram** in Settings → MCP if you want those URL builders.

Meta Graph (`INSTAGRAM_ACCESS_TOKEN`) remains optional and is tried first when present.

## Notes

- Sample events use Instagram **profile** handles (not fake `/p/` post IDs)
- Paste a real post URL in `instagramUrl` when you have one; the button prefers that
- Event dates are generated relative to "today" so "this week" still works during development
- No authentication in MVP — submit form uses `mailto:` fallback
