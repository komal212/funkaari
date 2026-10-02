# db/ — Instagram → events pipeline state

Committed JSON, maintained by `scripts/ig/*` and the `funkaari-daily` skill. Nothing here is imported by the website; the site reads the generated `src/data/instagram-events.json`.

| Path | What it holds | Written by |
| --- | --- | --- |
| `posts/<handle>.json` | Raw posts for one followed handle, newest first, plus the `latestPostAt` watermark used for "since" fetches. Each post: `id`, `shortcode`, `url`, `type`, `postedAt`, `caption`, `mediaCount`, `likes`, `comments`, `engagementAt`. Append-only; a rescan only refreshes like/comment counts. | `ig:fetch` |
| `triage.json` | `postId → { status, eventId?, note?, at, handle, run }`. A post is *pending* when it has no entry. Statuses: `new_event`, `duplicate` (post attached to an existing event), `duplicate_post` (identical caption from the same handle, never reviewed; `ofPostId` points to the one that was), `update`, `not_event`, `skipped_old`, `skipped_filter` (caption has no date, event keyword or booking cue, so no worker saw it), `error`. Delete a line to re-triage that post. | `ig:pack` (skipped_old, skipped_filter, duplicate_post), `ig:apply` |
| `events.json` | Master event list, including past events. Each row is a `KidsEvent` plus the tracking fields below. Rows with `seeded: true` mirror `calendar.ts` and are never emitted to the site. | `ig:seed`, `ig:apply` |
| `runs/<date>.json` | Log of one daily run: fetch counts per handle, packets, match counts, apply counts. | every step |

## Event tracking fields (in `events.json`, stripped from the site file)

| Field | Meaning |
| --- | --- |
| `organizerHandle` | Account hosting the event. May differ from the account that posted (`sources[].postedBy`). |
| `status` | `scheduled`, `cancelled`, `postponed`. Only `scheduled` reaches the site. |
| `sources[]` | Every post about this event: `postId`, `url`, `postedBy`, `postedAt`, `kind` (`announcement`, `reminder`, `update`, `cancellation`, `repost`), `likes`, `comments`, `seenAt`. |
| `matchKeys` | `shortcodes[]` and `bookingIds[]` used to attach reposts without a model call. |
| `details.listingType` | `dated` (calendar date), `ongoing` (recurring class, drop-in, exhibition), `save-the-date` (teaser with a date but missing venue or time). Upgrades to `dated` when a fuller post arrives. |
| `details.missing` | Which of `venue`, `area`, `date`, `time`, `age`, `price`, `booking` the event still lacks. Recomputed on every change; use it to hide incomplete listings. |
| `details.bookingNote` | How to book when there is no link: "DM to book", "Link in bio". |
| `details.contactPhone` | Booking phone or WhatsApp number from the caption. |
| `details.availability` | Latest urgency phrase: "Only 5 spots left", "Sold out". Overwritten by newer posts. |
| `details.collaborators[]` | Co-host or venue handles credited in the posts, excluding the organiser. |
| `details.postImage` | Site path of the real post image, copied to `public/events/posts/<shortcode>.jpg`. Switches to the organiser's own post when it arrives after a repost. |
| `details.announcedAt` / `lastPostedAt` | First and most recent post time across sources. |
| `details.postCount` | Number of posts about this event. |
| `details.engagement` | `{ likes, comments }` summed across sources at fetch time. |

The site file `src/data/instagram-events.json` keeps only `KidsEvent` fields. To surface any of the above on the UI, add the field to `KidsEvent` and remove it from `TRACKING` in `scripts/ig/apply.mjs`.

Scratch for a run (packets, worker output, downloaded images) lives in `.context/runs/<date>/` and is not committed.
