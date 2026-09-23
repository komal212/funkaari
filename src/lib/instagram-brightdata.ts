import { instagramProfileUrl } from "@/lib/instagram";
import { mediaToEvent, type InstagramMedia } from "@/lib/instagram-parse";
import type { KidsEvent } from "@/types/event";

const PROFILE_DATASET =
  process.env.BRIGHT_DATA_PROFILE_DATASET || "gd_l1vikfch901nx3by4";

export function brightDataConfigured(): boolean {
  return Boolean(process.env.BRIGHT_DATA_API_KEY?.trim());
}

type BrightPost = {
  id?: string;
  caption?: string;
  description?: string;
  url?: string;
  post_url?: string;
  shortcode?: string;
  datetime?: string;
  date?: string;
};

type BrightProfile = {
  account?: string;
  username?: string;
  posts?: BrightPost[];
  error?: string;
};

function profileUrls(): string[] {
  const fromEnv = process.env.BRIGHT_DATA_PROFILE_URLS || "";
  const urls = fromEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (urls.length) return urls.slice(0, 20);

  const handles = (process.env.BRIGHT_DATA_HANDLES || "")
    .split(",")
    .map((s) => s.trim().replace(/^@/, ""))
    .filter(Boolean);
  return handles.slice(0, 20).map((h) => instagramProfileUrl(h));
}

function toMedia(post: BrightPost, username: string, index: number): InstagramMedia {
  const permalink =
    post.url ||
    post.post_url ||
    (post.shortcode ? `https://www.instagram.com/p/${post.shortcode}/` : undefined);
  return {
    id: String(post.id || post.shortcode || `bd-${username}-${index}`),
    caption: post.caption || post.description,
    permalink,
    timestamp: post.datetime || post.date,
    username,
  };
}

export async function fetchBrightDataKidsEvents(): Promise<{
  events: KidsEvent[];
  source: "brightdata" | "unavailable";
  error?: string;
}> {
  const key = process.env.BRIGHT_DATA_API_KEY?.trim();
  if (!key) {
    return { events: [], source: "unavailable", error: "missing_brightdata_key" };
  }

  const urls = profileUrls();
  if (!urls.length) {
    return {
      events: [],
      source: "brightdata",
      error:
        "Set BRIGHT_DATA_PROFILE_URLS (comma-separated Instagram profile links) or BRIGHT_DATA_HANDLES.",
    };
  }

  try {
    const res = await fetch(
      `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${PROFILE_DATASET}&format=json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(urls.map((url) => ({ url }))),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return {
        events: [],
        source: "brightdata",
        error: `Bright Data ${res.status}: ${body.slice(0, 240)}`,
      };
    }

    const data = (await res.json()) as BrightProfile[] | { snapshot_id?: string };
    if (!Array.isArray(data)) {
      return {
        events: [],
        source: "brightdata",
        error:
          "snapshot_id" in data && data.snapshot_id
            ? "Bright Data job is async (snapshot). Retry in a minute or use fewer profile URLs."
            : "Unexpected Bright Data response",
      };
    }

    const events: KidsEvent[] = [];
    const seen = new Set<string>();
    for (const profile of data) {
      const username = profile.username || profile.account || "instagram";
      for (const [index, post] of (profile.posts ?? []).entries()) {
        const media = toMedia(post, username, index);
        if (seen.has(media.id)) continue;
        seen.add(media.id);
        const event = mediaToEvent(media);
        if (event) events.push(event);
      }
    }

    return { events, source: "brightdata" };
  } catch (err) {
    return {
      events: [],
      source: "brightdata",
      error: err instanceof Error ? err.message : "Bright Data request failed",
    };
  }
}
