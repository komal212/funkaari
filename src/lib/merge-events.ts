import type { KidsEvent } from "@/types/event";
import { eventIsListable } from "@/lib/listable";
import { compareListingEvents } from "@/lib/event-date";
import { isInstagramPostUrl } from "@/lib/instagram";
import { presentEvent } from "@/lib/event-quality";

function linkKey(event: KidsEvent): string | undefined {
  const urls = [event.instagramUrl, event.bookingUrl, event.website];
  for (const url of urls) {
    if (!url) continue;
    if (isInstagramPostUrl(url)) return url.replace(/\/+$/, "").toLowerCase();
    const bms = url.match(/\/(ET\d{8,})/i);
    if (bms) return `bms:${bms[1].toUpperCase()}`;
  }
  return undefined;
}

function eventKey(event: KidsEvent): string {
  return (
    linkKey(event) ||
    `${event.title.toLowerCase().trim()}|${event.date.slice(0, 10)}|${event.city}`
  );
}

/** Catalog listings win when the same Instagram post appears twice. */
export function mergeEventFeeds(
  live: KidsEvent[],
  catalog: KidsEvent[],
): KidsEvent[] {
  const map = new Map<string, KidsEvent>();
  for (const event of live) map.set(eventKey(event), event);
  for (const event of catalog) {
    const key = eventKey(event);
    const liveHit = map.get(key);
    map.set(key, {
      ...liveHit,
      ...event,
      imageUrl: event.imageUrl || liveHit?.imageUrl,
      instagramUrl: event.instagramUrl || liveHit?.instagramUrl,
    });
  }
  return [...map.values()]
    .filter(eventIsListable)
    .map(presentEvent)
    .sort(compareListingEvents);
}

function delhiKey(event: KidsEvent): string {
  const org = event.organizer.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${org}|${event.date.slice(0, 10)}|${event.area.toLowerCase()}`;
}

/** Live Parallel scrapes plus dated catalog; catalog wins on the same organiser/day/area. */
export function mergeDelhiFeeds(
  live: KidsEvent[],
  catalog: KidsEvent[],
): KidsEvent[] {
  const map = new Map<string, KidsEvent>();
  for (const event of live) map.set(delhiKey(event), event);
  for (const event of catalog) {
    const key = delhiKey(event);
    const liveHit = map.get(key);
    map.set(key, liveHit ? { ...liveHit, ...event } : event);
  }
  return [...map.values()]
    .filter(eventIsListable)
    .map(presentEvent)
    .sort(compareListingEvents);
}
