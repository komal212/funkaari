import { delhiScrapeUrls, PARALLEL_EXTRACT_OBJECTIVE, PARALLEL_EXTRACT_QUERIES } from "@/data/delhi-source-urls";
import { extractPages } from "@/lib/parallel-web";
import { parseWebEvents } from "@/lib/web-event-parse";
import type { KidsEvent } from "@/types/event";

const CACHE_MS = 15 * 60 * 1000;

type Scraped = {
  events: KidsEvent[];
  source: "parallel" | "unavailable";
  pages: number;
  error?: string;
};

let cache: { at: number; value: Scraped } | null = null;

function dedupe(events: KidsEvent[]): KidsEvent[] {
  const map = new Map<string, KidsEvent>();
  for (const event of events) {
    const key = `${event.title.toLowerCase()}|${event.date.slice(0, 10)}`;
    if (!map.has(key)) map.set(key, event);
  }
  return [...map.values()];
}

export async function scrapeDelhiEvents(): Promise<Scraped> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const extracted = await extractPages(
    delhiScrapeUrls(),
    PARALLEL_EXTRACT_OBJECTIVE,
    PARALLEL_EXTRACT_QUERIES,
  );
  const events = dedupe(
    extracted.pages.flatMap((page) => parseWebEvents(page.text, page.url)),
  );
  const value: Scraped = {
    events,
    source: extracted.source,
    pages: extracted.pages.length,
    error: extracted.error,
  };
  cache = { at: Date.now(), value };
  return value;
}
