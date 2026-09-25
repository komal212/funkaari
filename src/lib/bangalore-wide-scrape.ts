import {
  BANGALORE_SEARCHES,
  PARALLEL_BANGALORE_OBJECTIVE,
  PARALLEL_BANGALORE_QUERIES,
  bangaloreWideUrls,
  instagramHandleSearchJobs,
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
import { enrichEventLocations } from "@/lib/maps-lookup";
import { refreshFunkaariFollowing } from "@/lib/instagram-following";
import { isInstagramPostUrl } from "@/lib/instagram";
import { FUNKAARI_FOLLOWED_SCHOOLS } from "@/data/funkaari-followed-schools";
import type { KidsEvent } from "@/types/event";

const CACHE_MS = 15 * 60 * 1000;

function kolkataLabel(value: Date): string {
  return value.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function organiserBrief(handles: string[]): string {
  const byHandle = new Map(FUNKAARI_FOLLOWED_SCHOOLS.map((row) => [row.handle, row]));
  const lines = handles.slice(0, 140).flatMap((handle) => {
    const school = byHandle.get(handle);
    if (school?.city === "other") return [];
    if (school) {
      return [`@${handle} (${school.name}${school.area ? `, ${school.area}` : ", Bengaluru"})`];
    }
    return [`@${handle}`];
  });
  return lines.join(", ");
}

function taskInput(handles: string[]): string {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 2);
  const organisers = organiserBrief(handles);
  return `List as many distinct upcoming dated kids events as you can find for Bengaluru families between ${kolkataLabel(start)} and ${kolkataLabel(end)} for children aged 6 months to 6 years. Include workshops, playdates, open houses, magic shows, play-café sessions, storytime, pottery, music, treks, farms, festivals, and similar, plus dated online/Zoom sessions in India/IST. Each event must have a real calendar date and a live booking, organiser website, or Instagram post URL (instagram.com/p/... or /reel/...). Prefer events announced by these Instagram accounts Funkaari follows: ${organisers}. Search their websites and public Instagram posts, not profile homepages. Do not invent events, do not copy the same weekly class across extra dates, and skip adult-only listings. Aim for up to 100 unique events.`;
}

function urlsWorthExtracting(followingHandles: string[], found: string[]): string[] {
  const seed = bangaloreWideUrls(followingHandles);
  const ranked: string[] = [];
  const seen = new Set<string>();
  const add = (url: string) => {
    const key = url.replace(/\/+$/, "").toLowerCase();
    if (!url || seen.has(key)) return;
    seen.add(key);
    ranked.push(url);
  };
  for (const url of found) {
    if (isInstagramPostUrl(url)) add(url);
  }
  for (const url of [...seed, ...found]) {
    if (/instagram\.com/i.test(url) && !isInstagramPostUrl(url)) continue;
    add(url);
  }
  return ranked;
}

type Scraped = {
  events: KidsEvent[];
  source: "parallel" | "unavailable";
  pages: number;
  searched: number;
  taskCount: number;
  following: number;
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

async function searchAll(
  handles: string[],
): Promise<{ urls: string[]; pages: ParallelPage[]; error?: string }> {
  const jobs = [...BANGALORE_SEARCHES, ...instagramHandleSearchJobs(handles)];
  const settled = await Promise.allSettled(
    jobs.map((job) =>
      searchPages({
        objective: job.objective,
        searchQueries: job.searchQueries,
        maxResults: 20,
        includeDomains: job.includeDomains,
        afterDate: job.afterDate,
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

async function taskEvents(handles: string[]): Promise<{ events: KidsEvent[]; error?: string }> {
  const task = await runTaskJson<{ events?: TaskEventRow[] }>({
    input: taskInput(handles),
    jsonSchema: BANGALORE_TASK_SCHEMA,
    processor: "core",
    timeoutSec: 180,
  });
  const rows = task.content?.events || [];
  return { events: eventsFromTaskRows(rows), error: task.error };
}

export async function scrapeBangaloreWide(opts?: { force?: boolean }): Promise<Scraped> {
  if (!opts?.force && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  if (!opts?.force && inflight) return inflight;

  inflight = (async () => {
  const following = await refreshFunkaariFollowing();
  const searchPromise = searchAll(following.handles);
  const taskPromise = taskEvents(following.handles).catch((err) => ({
    events: [] as KidsEvent[],
    error: err instanceof Error ? err.message : "task failed",
  }));

  const found = await searchPromise;
  const extractUrls = urlsWorthExtracting(following.handles, found.urls);
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
  const events = await enrichEventLocations(dedupe([...instagram, ...web, ...task.events]), {
    webSearch: true,
    persist: true,
  });

  const value: Scraped = {
    events,
    source: extracted.source,
    pages: pages.length,
    searched: found.urls.length,
    taskCount: task.events.length,
    following: following.handles.length,
    error:
      [following.error, extracted.error, found.error, task.error]
        .filter(Boolean)
        .join(" · ") || undefined,
  };
  cache = { at: Date.now(), value };
  return value;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
