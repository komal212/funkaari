import type { KidsEvent } from "@/types/event";
import { mediaToEvent, type InstagramMedia } from "@/lib/instagram-parse";
import { isInstagramPostUrl, normalizeHandle } from "@/lib/instagram";

const POST_RE =
  /instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|tv)\/([A-Za-z0-9_-]+)/gi;

function handleFromSource(url: string): string {
  const post = url.match(/instagram\.com\/(?:p|reel|tv)\//i);
  if (post) return "";
  const tag = url.match(/instagram\.com\/explore\/tags\//i);
  if (tag) return "";
  const profile = url.match(/instagram\.com\/([A-Za-z0-9._]+)\/?$/i);
  return profile?.[1] && profile[1] !== "www" ? normalizeHandle(profile[1]) : "";
}

function handleFromChunk(chunk: string): string {
  const at = chunk.match(/@([A-Za-z0-9._]{2,30})/);
  if (at?.[1]) return normalizeHandle(at[1]);
  const path = chunk.match(/instagram\.com\/([A-Za-z0-9._]+)\//i);
  if (path?.[1] && !/^(p|reel|tv|explore|tags)$/i.test(path[1])) {
    return normalizeHandle(path[1]);
  }
  return "";
}

function permalink(code: string): string {
  return `https://www.instagram.com/p/${code}/`;
}

export function parseInstagramExcerpts(
  text: string,
  sourceUrl: string,
): InstagramMedia[] {
  const pageHandle = handleFromSource(sourceUrl);
  const media: InstagramMedia[] = [];
  const seen = new Set<string>();
  const matches = [...text.matchAll(POST_RE)];

  if (matches.length === 0 && isInstagramPostUrl(sourceUrl)) {
    const code = sourceUrl.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i)?.[1];
    if (code) {
      media.push({
        id: `ig-${code}`,
        caption: text,
        permalink: permalink(code),
        username: pageHandle || handleFromChunk(text) || "instagram",
      });
    }
    return media;
  }

  for (let i = 0; i < matches.length; i += 1) {
    const code = matches[i][1];
    if (seen.has(code)) continue;
    seen.add(code);
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    const chunk = text.slice(Math.max(0, start - 500), Math.min(text.length, end + 200));
    media.push({
      id: `ig-${code}`,
      caption: chunk,
      permalink: permalink(code),
      username: pageHandle || handleFromChunk(chunk) || "instagram",
    });
  }

  return media;
}

export function eventsFromInstagramPages(
  pages: { url: string; text: string }[],
): KidsEvent[] {
  const events: KidsEvent[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    for (const media of parseInstagramExcerpts(page.text, page.url)) {
      const event = mediaToEvent(media);
      if (!event?.instagramUrl) continue;
      const key = event.instagramUrl.replace(/\/+$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      events.push(event);
    }
  }
  return events;
}
