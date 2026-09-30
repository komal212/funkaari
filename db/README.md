# db/ — Instagram → events pipeline state

Committed JSON, maintained by `scripts/ig/*` and the `funkaari-daily` skill. Nothing here is imported by the website; the site reads the generated `src/data/instagram-events.json`.

| Path | What it holds | Written by |
| --- | --- | --- |
| `posts/<handle>.json` | Raw posts for one followed handle, newest first, plus the `latestPostAt` watermark used for "since" fetches. Append-only. | `ig:fetch` |
| `triage.json` | `postId → { status, eventId?, note?, at, handle, run }`. A post is *pending* when it has no entry. Statuses: `new_event`, `duplicate`, `update`, `not_event`, `skipped_old`, `error`. Delete a line to re-triage that post. | `ig:pack` (skipped_old), `ig:apply` |
| `events.json` | Master event list, including past events. Each row is a `KidsEvent` plus `organizerHandle`, `status` (`scheduled`, `cancelled`, `postponed`), `sources[]` (`postId`, `url`, `postedBy`, `kind`, `seenAt`), `matchKeys` (`shortcodes[]`, `bookingIds[]`), `createdAt`, `updatedAt`. Rows with `seeded: true` mirror `calendar.ts` and are never emitted to the site. | `ig:seed`, `ig:apply` |
| `runs/<date>.json` | Log of one daily run: fetch counts per handle, packets, match counts, apply counts. | every step |

Scratch for a run (packets, worker output, downloaded images) lives in `.context/runs/<date>/` and is not committed.
