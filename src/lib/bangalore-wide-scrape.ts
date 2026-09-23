import {
  BANGALORE_SEARCHES,
  PARALLEL_BANGALORE_OBJECTIVE,
  PARALLEL_BANGALORE_QUERIES,
  bangaloreWideUrls,
} from "@/data/bangalore-web-urls";
import {
  BANGALORE_TASK_SCHEMA,
  eventsFromTaskRows,
  type TaskEventRow,
} from "@/lib/bangalore-task-parse";
import { isInNextTwoMonths } from "@/lib/event-date";
import { eventsFromInstagramPages } from "@/lib/instagram-parallel-parse";
import { eventIsListable } from "@/lib/listable";
import { isOffBriefListing } from "@/lib/event-quality";
import { extractPages, searchPages, type ParallelPage } from "@/lib/parallel-web";
import { runTaskJson } from "@/lib/parallel-task";
import { parseWebEvents } from "@/lib/web-event-parse";
import type { KidsEvent } from "@/types/event";

const CACHE_MS = 15 * 60 * 1000;
const TASK_INPUT = `List as many distinct upcoming dated kids events as you can find in Bangalore / Bengaluru between 23 September 2026 and 23 November 2026 for children aged 6 months to 6 years. Include workshops, playdates, open houses, pottery, storytime, music, treks, farms and festivals. Each event must have a real calendar date and a live booking, organiser website, or Instagram post URL. Do not invent events, do not copy the same weekly class across extra dates, and skip adult-only listings. Aim for up to 100 unique events.`;

type Scraped = {
  events: KidsEvent[];
  source: "parallel" | "unavailable";
  pages: number;
  searched: number;
  taskCount: number;
  error?: string;
};

let cache: { at: number; value: Scraped } | null = null;
let inflight: Promise<Scraped> | null = null;

function eventKey(event: KidsEvent): string {
  return `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}|${event.date.slice(0, 10)}`;
}

function isQualityListing(event: KidsEvent): boolean {
  return !isOffBriefListing(event);
}

function dedupe(events: KidsEvent[]): KidsEvent[] {
  const map = new Map<string, KidsEvent>();
  for (const event of events) {
    if (!isQualityListing(event)) continue;
    const key = eventKey(event);
    const existing = map.get(key);
    if (!existing || (event.instagramUrl && !existing.instagramUrl)) map.set(key, event);
  }
  return [...map.values()]
    .filter((event) => eventIsListable(event) && isInNextTwoMonths(event))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function searchAll(): Promise<{ urls: string[]; pages: ParallelPage[]; error?: string }> {
  const settled = await Promise.allSettled(
    BANGALORE_SEARCHES.map((job) =>
      searchPages({
        objective: job.objective,
        searchQueries: job.searchQueries,
        maxResults: 20,
        includeDomains: job.includeDomains,
      }),
    ),
  );

  const urls = new Set<string>();
  const pages: ParallelPage[] = [];
  const errors: string[] = [];

  for (const result of settled) {
    if (result.status === "rejected") {
      errors.push(result.reason instanceof Error ? result.reason.message : "search failed");
      continue;
    }
    if (result.value.error) errors.push(result.value.error);
    for (const url of result.value.urls) urls.add(url);
    pages.push(...result.value.pages);
  }

  return { urls: [...urls], pages, error: errors[0] };
}

async function taskEvents(): Promise<{ events: KidsEvent[]; error?: string }> {
  const task = await runTaskJson<{ events?: TaskEventRow[] }>({
    input: TASK_INPUT,
    jsonSchema: BANGALORE_TASK_SCHEMA,
    processor: "core",
    timeoutSec: 120,
  });
  const rows = task.content?.events || [];
  return { events: eventsFromTaskRows(rows), error: task.error };
}

export async function scrapeBangaloreWide(): Promise<Scraped> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  if (inflight) return inflight;

  inflight = (async () => {

  const searchPromise = searchAll();
  const taskPromise = taskEvents().catch((err) => ({
    events: [] as KidsEvent[],
    error: err instanceof Error ? err.message : "task failed",
  }));

  const found = await searchPromise;
  const extractUrls = [...new Set([...bangaloreWideUrls(), ...found.urls])];
  const extracted = await extractPages(
    extractUrls,
    PARALLEL_BANGALORE_OBJECTIVE,
    PARALLEL_BANGALORE_QUERIES,
  );
  const task = await taskPromise;

  const pagesByUrl = new Map<string, ParallelPage>();
  for (const page of [...found.pages, ...extracted.pages]) {
    if (page.url && page.text?.trim()) pagesByUrl.set(page.url, page);
  }
  const pages = [...pagesByUrl.values()];

  const instagram = eventsFromInstagramPages(pages);
  const web = pages.flatMap((page) => parseWebEvents(page.text, page.url, "bangalore"));
  const events = dedupe([...instagram, ...web, ...task.events]);

  const value: Scraped = {
    events,
    source: extracted.source,
    pages: pages.length,
    searched: found.urls.length,
    taskCount: task.events.length,
    error: [extracted.error, found.error, task.error].filter(Boolean).join(" · ") || undefined,
  };
  cache = { at: Date.now(), value };
  return value;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
