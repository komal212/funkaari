import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FUNKAARI_INSTAGRAM_HANDLE, normalizeHandle } from "@/lib/instagram";
import bundled from "@/data/funkaari-following.json";
import { BANGALORE_FOLLOWED_HANDLES } from "@/data/funkaari-followed-schools";
import { runTaskJson } from "@/lib/parallel-task";

const ACTOR = "apify~instagram-followers-following-scraper";
const SKIP = new Set([
  "www",
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts",
  "instagram",
  FUNKAARI_INSTAGRAM_HANDLE,
]);

/** Extra organisers we already scrape; keep even if a following fetch is short. */
const KNOWN_ORGANISERS = [
  ...BANGALORE_FOLLOWED_HANDLES,
  "play_cove",
  "forumsouthbengaluru",
  "the_two_messy_hands",
  "littlebeatsfestival",
  "ayanaoutdoorsindia",
  "popapuddle",
];

export type FollowingFeed = {
  account: string;
  fetchedAt: string;
  source: string;
  handles: string[];
};

type ApifyRow = {
  username?: string;
  userName?: string;
  handle?: string;
  type?: string;
};

function tidyHandle(raw: string): string | undefined {
  const handle = normalizeHandle(raw).toLowerCase();
  if (!handle || handle.length < 2 || handle.length > 30) return undefined;
  if (SKIP.has(handle)) return undefined;
  if (!/^[a-z0-9._]+$/.test(handle)) return undefined;
  return handle;
}

function uniqueHandles(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const handle = tidyHandle(value);
    if (!handle || seen.has(handle)) continue;
    seen.add(handle);
    out.push(handle);
  }
  return out;
}

export function bundledFollowing(): FollowingFeed {
  const feed = bundled as FollowingFeed;
  return {
    account: FUNKAARI_INSTAGRAM_HANDLE,
    fetchedAt: typeof feed.fetchedAt === "string" ? feed.fetchedAt : "",
    source: typeof feed.source === "string" ? feed.source : "seed",
    handles: uniqueHandles([...(feed.handles || []), ...KNOWN_ORGANISERS]),
  };
}

function persist(root: string, feed: FollowingFeed) {
  writeFileSync(
    join(root, "src/data/funkaari-following.json"),
    `${JSON.stringify(feed, null, 2)}\n`,
    "utf8",
  );
}

function fromApifyRows(rows: ApifyRow[]): string[] {
  return uniqueHandles(
    rows.flatMap((row) => {
      const kind = (row.type || "FOLLOWING").toUpperCase();
      if (kind !== "FOLLOWING") return [];
      return [row.username, row.userName, row.handle].filter(
        (value): value is string => Boolean(value),
      );
    }),
  );
}

async function fetchFollowingFromParallel(): Promise<{
  handles: string[];
  error?: string;
}> {
  const task = await runTaskJson<{ handles?: string[]; followingCount?: number }>({
    input: `List every Instagram username that the public account https://www.instagram.com/funkaari.in/ currently follows (its Following list, not Followers). Return as many real handles as you can verify. Do not invent handles.`,
    jsonSchema: {
      type: "object",
      properties: {
        followingCount: { type: "number" },
        handles: { type: "array", items: { type: "string" } },
      },
      required: ["handles"],
    },
    processor: "core",
    timeoutSec: 180,
  });
  if (task.error) return { handles: [], error: task.error };
  if (task.pending) return { handles: [], error: "parallel_following_pending" };
  return { handles: uniqueHandles(task.content?.handles || []) };
}

async function fetchFollowingFromApify(): Promise<{
  handles: string[];
  error?: string;
}> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) return { handles: [], error: "missing_apify_token" };

  const limit = Number(process.env.APIFY_FOLLOWING_LIMIT || "500");
  const resultsLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 2000) : 500;
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernames: [FUNKAARI_INSTAGRAM_HANDLE],
      dataToScrape: "following",
      resultsLimit,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8 * 60 * 1000),
  });

  if (!res.ok) {
    const body = await res.text();
    return { handles: [], error: `Apify following ${res.status}: ${body.slice(0, 240)}` };
  }

  const rows = (await res.json()) as ApifyRow[];
  if (!Array.isArray(rows)) {
    return { handles: [], error: "Apify following returned a non-list" };
  }
  return { handles: fromApifyRows(rows) };
}

/** Refresh who @funkaari.in follows. Does not invent handles. */
export async function refreshFunkaariFollowing(root?: string): Promise<FollowingFeed & { error?: string }> {
  const dir = root || process.cwd();
  const previous = bundledFollowing();
  try {
    const apify = await fetchFollowingFromApify();
    if (!apify.error && apify.handles.length > 0) {
      const feed: FollowingFeed = {
        account: FUNKAARI_INSTAGRAM_HANDLE,
        fetchedAt: new Date().toISOString(),
        source: "apify-following",
        handles: uniqueHandles([...apify.handles, ...KNOWN_ORGANISERS]),
      };
      if (existsSync(join(dir, "src/data"))) persist(dir, feed);
      return feed;
    }

    if (process.env.PARALLEL_FOLLOWING_TASK === "1") {
      const fetched = await fetchFollowingFromParallel();
      if (!fetched.error && fetched.handles.length > 0) {
        const feed: FollowingFeed = {
          account: FUNKAARI_INSTAGRAM_HANDLE,
          fetchedAt: new Date().toISOString(),
          source: "parallel-task",
          handles: uniqueHandles([...fetched.handles, ...KNOWN_ORGANISERS]),
        };
        if (existsSync(join(dir, "src/data"))) persist(dir, feed);
        return feed;
      }
      return {
        ...previous,
        error: fetched.error || apify.error || "following fetch returned 0 handles",
      };
    }

    return {
      ...previous,
      error: apify.error || "following fetch returned 0 handles; using seed list",
    };
  } catch (err) {
    return {
      ...previous,
      error: err instanceof Error ? err.message : "following fetch failed",
    };
  }
}

export function readFollowingFile(root: string): FollowingFeed {
  const file = join(root, "src/data/funkaari-following.json");
  if (!existsSync(file)) return bundledFollowing();
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as FollowingFeed;
    return {
      account: FUNKAARI_INSTAGRAM_HANDLE,
      fetchedAt: parsed.fetchedAt || "",
      source: parsed.source || "seed",
      handles: uniqueHandles([...(parsed.handles || []), ...KNOWN_ORGANISERS]),
    };
  } catch {
    return bundledFollowing();
  }
}
