import type { KidsEvent } from "@/types/event";
import { events as catalog } from "@/data/events";
import { mergeEventFeeds } from "@/lib/merge-events";
import bundled from "@/data/live-bangalore.json";

export type LiveBangaloreFeed = {
  refreshedAt: string;
  source: string;
  events: KidsEvent[];
};

const STALE_MS = 36 * 60 * 60 * 1000;

export function bundledLiveFeed(): LiveBangaloreFeed {
  const feed = bundled as LiveBangaloreFeed;
  return {
    refreshedAt: typeof feed.refreshedAt === "string" ? feed.refreshedAt : "",
    source: typeof feed.source === "string" ? feed.source : "snapshot",
    events: Array.isArray(feed.events) ? (feed.events as KidsEvent[]) : [],
  };
}

export function listingFromLiveFeed(feed: LiveBangaloreFeed): {
  events: KidsEvent[];
  source: string;
  refreshedAt: string;
  warning?: string;
} {
  const events = mergeEventFeeds(feed.events, catalog);
  const refreshedAt = feed.refreshedAt;
  const age = refreshedAt ? Date.now() - new Date(refreshedAt).getTime() : Number.POSITIVE_INFINITY;
  const warning =
    Number.isFinite(age) && age > STALE_MS
      ? "Listings are more than a day old. The nightly refresh may have missed a run."
      : undefined;
  return {
    events,
    source: feed.source || "snapshot",
    refreshedAt,
    warning,
  };
}
