#!/usr/bin/env node
/**
 * One-time seed: register the hand-curated calendar.ts listings in db/events.json
 * so the pipeline recognises their Instagram posts and booking links as already listed.
 * Seeded rows are flagged and never emitted to the site file (calendar.ts still lists them).
 *
 *   npx tsx scripts/ig/seed.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTwoMonthCalendar } from "@/data/calendar";
import type { KidsEvent } from "@/types/event";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const file = join(root, "db/events.json");

function shortcode(url?: string): string | undefined {
  return url?.match(/instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i)?.[1];
}

function bookingKey(url?: string): string | undefined {
  if (!url) return undefined;
  const bms = url.match(/\/(ET\d{8,})/i);
  if (bms) return `bms:${bms[1].toUpperCase()}`;
  const allevents = url.match(/allevents\.in\/[^/]+\/[^/]+\/(\d{6,})/i);
  if (allevents) return `allevents:${allevents[1]}`;
  return undefined;
}

type Db = { events: (KidsEvent & Record<string, unknown>)[] };

const db: Db = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Db) : { events: [] };
const known = new Set(db.events.map((e) => e.id));
const now = new Date().toISOString();
let added = 0;

for (const event of buildTwoMonthCalendar()) {
  if (known.has(event.id)) continue;
  const codes = [event.instagramUrl, event.bookingUrl, event.website].map(shortcode).filter((c): c is string => Boolean(c));
  const bookings = [event.bookingUrl, event.website].map(bookingKey).filter((c): c is string => Boolean(c));
  db.events.push({
    ...event,
    organizerHandle: event.instagramHandle,
    status: "scheduled",
    sources: event.instagramUrl
      ? [{ postId: null, url: event.instagramUrl, postedBy: event.instagramHandle, kind: "announcement", seenAt: now }]
      : [],
    matchKeys: { shortcodes: [...new Set(codes)], bookingIds: [...new Set(bookings)] },
    seeded: true,
    createdAt: now,
    updatedAt: now,
  });
  added += 1;
}

db.events.sort((a, b) => a.date.localeCompare(b.date));
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, `${JSON.stringify(db, null, 2)}\n`, "utf8");
console.log(`seeded ${added} catalog events (${db.events.length} total) → ${file}`);
