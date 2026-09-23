import { INSTAGRAM_HASHTAGS, mediaToEvent, type InstagramMedia } from "@/lib/instagram-parse";
import type { KidsEvent } from "@/types/event";

const APIFY_ACTOR =
  process.env.APIFY_ACTOR_ID || "apify~instagram-scraper";

export function apifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN?.trim());
}

type ApifyItem = {
  id?: string;
  shortCode?: string;
  caption?: string;
  url?: string;
  displayUrl?: string;
  ownerUsername?: string;
  owner?: { username?: string };
  timestamp?: string;
  takenAt?: string;
};

function splitCsv(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function hashtagUrls(tags: string[]): string[] {
  return tags.map(
    (tag) => `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`,
  );
}

function toMedia(item: ApifyItem, index: number): InstagramMedia {
  const username = item.ownerUsername || item.owner?.username || "";
  const permalink =
    item.url ||
    (item.shortCode
      ? `https://www.instagram.com/p/${item.shortCode}/`
      : undefined);
  return {
    id: String(item.id || item.shortCode || `apify-${index}`),
    caption: item.caption,
    permalink,
    timestamp: item.timestamp || item.takenAt,
    username,
    displayUrl: item.displayUrl,
  };
}

function actorInput(hashtags: string[], limit: number) {
  const explicitUrls = splitCsv(process.env.APIFY_DIRECT_URLS);
  const profiles = splitCsv(process.env.APIFY_PROFILE_URLS);
  const directUrls =
    explicitUrls.length > 0
      ? explicitUrls
      : [...profiles, ...hashtagUrls(hashtags)].slice(0, 8);

  if (APIFY_ACTOR.includes("hashtag-scraper")) {
    return {
      hashtags,
      resultsType: "posts",
      resultsLimit: limit,
    };
  }

  return {
    resultsType: "posts",
    resultsLimit: limit,
    directUrls,
    addParentData: true,
    onlyPostsNewerThan: process.env.APIFY_NEWER_THAN || "14 days",
  };
}

export async function fetchApifyKidsEvents(): Promise<{
  events: KidsEvent[];
  source: "apify" | "unavailable";
  error?: string;
}> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) {
    return { events: [], source: "unavailable", error: "missing_apify_token" };
  }

  const hashtags = (process.env.INSTAGRAM_HASHTAGS || INSTAGRAM_HASHTAGS.join(","))
    .split(",")
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 5);

  const limit = Number(process.env.APIFY_RESULTS_LIMIT || "20");
  const resultsLimit = Number.isFinite(limit) ? limit : 20;
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput(hashtags, resultsLimit)),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        events: [],
        source: "apify",
        error: `Apify ${res.status}: ${body.slice(0, 240)}`,
      };
    }

    const items = (await res.json()) as ApifyItem[];
    if (!Array.isArray(items)) {
      return { events: [], source: "apify", error: "Unexpected Apify response" };
    }

    const seen = new Set<string>();
    const events: KidsEvent[] = [];
    items.forEach((item, index) => {
      const media = toMedia(item, index);
      if (seen.has(media.id)) return;
      seen.add(media.id);
      const event = mediaToEvent(media);
      if (event) events.push(event);
    });

    return { events, source: "apify" };
  } catch (err) {
    return {
      events: [],
      source: "apify",
      error: err instanceof Error ? err.message : "Apify request failed",
    };
  }
}
