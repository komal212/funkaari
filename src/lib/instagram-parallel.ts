import {
  bangaloreInstagramUrls,
  PARALLEL_INSTAGRAM_OBJECTIVE,
  PARALLEL_INSTAGRAM_QUERIES,
} from "@/data/bangalore-instagram-urls";
import { extractPages } from "@/lib/parallel-web";
import { eventsFromInstagramPages } from "@/lib/instagram-parallel-parse";
import type { KidsEvent } from "@/types/event";

const CACHE_MS = 15 * 60 * 1000;

type Scraped = {
  events: KidsEvent[];
  source: "parallel" | "unavailable";
  pages: number;
  error?: string;
};

let cache: { at: number; value: Scraped } | null = null;

export async function scrapeBangaloreInstagram(): Promise<Scraped> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const extracted = await extractPages(
    bangaloreInstagramUrls(),
    PARALLEL_INSTAGRAM_OBJECTIVE,
    PARALLEL_INSTAGRAM_QUERIES,
  );
  const events = eventsFromInstagramPages(extracted.pages);
  const value: Scraped = {
    events,
    source: extracted.source,
    pages: extracted.pages.length,
    error: extracted.error,
  };
  cache = { at: Date.now(), value };
  return value;
}
