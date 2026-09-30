import type { EventCategory, KidsEvent, ListingKind } from "@/types/event";

export type { ListingKind };

export const LISTING_KINDS: ListingKind[] = [
  "playdate",
  "workshop",
  "open-house",
  "nature",
  "art",
  "music",
  "festival",
  "sports",
];

export const LISTING_KIND_LABEL: Record<ListingKind, string> = {
  playdate: "Playdate",
  workshop: "Workshop",
  "open-house": "Open house",
  nature: "Nature",
  art: "Art",
  music: "Music",
  festival: "Festival",
  sports: "Sports",
};

const FROM_CATEGORY: Record<EventCategory, ListingKind> = {
  workshop: "workshop",
  camp: "nature",
  "open day": "open-house",
  sports: "sports",
  art: "art",
  music: "music",
  festival: "festival",
};

export function listingKind(event: KidsEvent): ListingKind {
  const text = `${event.title} ${event.description} ${event.category}`.toLowerCase();
  if (/\bplaydates?|play date|circle time|story ?play|sensory\b/.test(text)) return "playdate";
  if (/\bopen\s*(day|house)\b/.test(text)) return "open-house";
  if (/\b(trek|hike|nature walk|nature|farm|picnic|outing|camp|outdoor)\b/.test(text)) return "nature";
  if (/\b(pottery|paint|craft|clay|collage|colour|color|messy|art)\b/.test(text)) return "art";
  if (/\b(music|beats|drum|sing|song|concert|rhythm)\b/.test(text)) {
    return /\bfestival\b/.test(text) ? "festival" : "music";
  }
  if (/\b(magic|festival|carnival|clown|fair)\b/.test(text)) return "festival";
  if (/\b(football|gym|yoga|sport|kick|turf|marathon|run|race)\b/.test(text)) return "sports";
  return FROM_CATEGORY[event.category] ?? "workshop";
}
