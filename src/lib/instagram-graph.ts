import {
  INSTAGRAM_HASHTAGS,
  mediaToEvent,
  type InstagramMedia,
} from "@/lib/instagram-parse";
import type { KidsEvent } from "@/types/event";

const GRAPH = "https://graph.facebook.com/v21.0";

function token() {
  return process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || "";
}

function igUserId() {
  return process.env.INSTAGRAM_IG_USER_ID?.trim() || "";
}

export function instagramApiConfigured(): boolean {
  return Boolean(token() && igUserId());
}

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(`${GRAPH}${path}?${qs}`, { next: { revalidate: 1800 } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Instagram Graph ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function hashtagId(tag: string): Promise<string | null> {
  const q = tag.replace(/^#/, "");
  const json = await graph<{ data?: { id: string }[] }>("/ig_hashtag_search", {
    user_id: igUserId(),
    q,
  });
  return json.data?.[0]?.id ?? null;
}

async function recentMedia(hid: string): Promise<InstagramMedia[]> {
  const json = await graph<{ data?: InstagramMedia[] }>(`/${hid}/recent_media`, {
    user_id: igUserId(),
    fields: "id,caption,permalink,timestamp,media_type",
    limit: "50",
  });
  return json.data ?? [];
}

/** Official hashtag feed — 6mo–6yr + Bangalore filter applied in parser. */
export async function fetchInstagramKidsEvents(): Promise<{
  events: KidsEvent[];
  source: "graph" | "unavailable";
  error?: string;
}> {
  if (!instagramApiConfigured()) {
    return { events: [], source: "unavailable", error: "missing_token" };
  }

  const tags = (process.env.INSTAGRAM_HASHTAGS || INSTAGRAM_HASHTAGS.join(","))
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);

  const seen = new Set<string>();
  const events: KidsEvent[] = [];
  const errors: string[] = [];

  for (const tag of tags) {
    try {
      const hid = await hashtagId(tag);
      if (!hid) continue;
      const media = await recentMedia(hid);
      for (const item of media) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        const event = mediaToEvent(item);
        if (event) events.push(event);
      }
    } catch (err) {
      errors.push(`${tag}: ${err instanceof Error ? err.message : "fail"}`);
    }
  }

  return {
    events,
    source: "graph",
    error: errors.length ? errors.join("; ") : undefined,
  };
}
