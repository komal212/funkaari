#!/usr/bin/env node
/**
 * Scrape dated Bengaluru kids listings and write src/data/live-bangalore.json.
 * Does not print API keys. Does not invent events.
 *
 *   npx tsx scripts/refresh-events.ts
 *   npx tsx scripts/refresh-events.ts --from-catalog
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scrapeBangaloreWide } from "@/lib/bangalore-wide-scrape";
import { mergeEventFeeds } from "@/lib/merge-events";
import type { LiveBangaloreFeed } from "@/lib/live-feed";
import type { KidsEvent } from "@/types/event";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "src/data/live-bangalore.json");

function loadEnv() {
  const envFile = join(root, ".env.local");
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function readExisting(): LiveBangaloreFeed | null {
  if (!existsSync(outFile)) return null;
  try {
    const parsed = JSON.parse(readFileSync(outFile, "utf8")) as LiveBangaloreFeed;
    if (!parsed || !Array.isArray(parsed.events)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function eventsFingerprint(events: KidsEvent[]): string {
  return events
    .map((event) => `${event.id}|${event.date.slice(0, 10)}|${event.title}`)
    .sort()
    .join("\n");
}

function writeFeed(feed: LiveBangaloreFeed) {
  writeFileSync(outFile, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
}

async function main() {
  loadEnv();
  const fromCatalog = process.argv.includes("--from-catalog");
  const existing = readExisting();

  let live: KidsEvent[] = [];
  let source = "catalog";
  let scrapeError: string | undefined;

  if (!fromCatalog) {
    if (!process.env.PARALLEL_API_KEY?.trim()) {
      console.error("missing PARALLEL_API_KEY");
      process.exit(1);
    }
    const scraped = await scrapeBangaloreWide({ force: true });
    live = scraped.events;
    source = scraped.source === "parallel" ? "parallel-web" : scraped.source;
    scrapeError = scraped.error;
    if (scrapeError) {
      console.error(`scrape note: ${scrapeError.slice(0, 240)}`);
    }
  }

  const events = fromCatalog ? [] : mergeEventFeeds(live, []);
  if (events.length === 0 && existing?.events.length) {
    console.error("refresh found 0 upcoming events; keeping the previous snapshot");
    process.exit(1);
  }

  const feed: LiveBangaloreFeed = {
    refreshedAt: new Date().toISOString(),
    source,
    events,
  };

  const sameEvents =
    existing && eventsFingerprint(existing.events) === eventsFingerprint(events);
  writeFeed(feed);
  console.log(
    `${sameEvents ? "snapshot timestamps updated" : "snapshot written"}: ${events.length} upcoming Bengaluru event${events.length === 1 ? "" : "s"} (${source})`,
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : "refresh failed";
  console.error(message.replace(/[A-Za-z0-9_\-]{20,}/g, "[redacted]"));
  process.exit(1);
});
