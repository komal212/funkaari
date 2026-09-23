import type { KidsEvent } from "@/types/event";
import { AGE_GROUP_LABELS, CATEGORY_LABELS } from "@/data/events";

const SYNONYMS: Record<string, string[]> = {
  yoga: ["yoga", "stretch", "park"],
  football: ["football", "soccer", "kickstart", "sports"],
  soccer: ["football", "soccer", "sports"],
  art: ["art", "clay", "colour", "color", "paint", "craft", "collage"],
  craft: ["art", "craft", "clay"],
  music: ["music", "dance", "bollywood", "rhythm", "swara", "beats"],
  dance: ["dance", "bollywood", "rhythm", "music"],
  baby: ["baby", "babies", "infant", "6 mo", "sign language", "sensory"],
  toddler: ["toddler", "toddlers", "parent-toddler"],
  sensory: ["sensory", "play", "rice"],
  camp: ["camp", "splash", "weekend"],
  open: ["open day", "open house", "tour"],
  preschool: ["preschool", "montessori", "reggio"],
  montessori: ["montessori", "aura", "navashiksha"],
  aura: ["aura", "montessori", "koramangala"],
  playcove: ["playcove", "play cove", "hobby ghar"],
  trek: ["trek", "outdoors", "mugilanchu"],
  free: ["free"],
  koramangala: ["koramangala", "kormangala"],
  kormangala: ["koramangala"],
  hsr: ["hsr layout", "hsr"],
  bellandur: ["bellandur", "haralur", "sarjapur"],
  haralur: ["haralur", "bellandur"],
  "e-city": ["electronic city"],
  ecity: ["electronic city"],
  indiranagar: ["indiranagar", "lalbhag", "lalbagh"],
  whitefield: ["whitefield", "itpl", "hope farm"],
  jpnagar: ["jp nagar"],
  "jp nagar": ["jp nagar"],
  pottery: ["pottery", "clay", "ceramic"],
  clay: ["clay", "pottery", "ceramic"],
  kidzania: ["kidzania", "role play", "noida"],
  gurugram: ["gurugram", "gurgaon"],
  gurgaon: ["gurgaon", "gurugram"],
  noida: ["noida"],
  hauz: ["hauz khas"],
  saket: ["saket"],
  nature: ["nature", "bug", "walk", "wildlings", "lalbagh", "nursery", "farm"],
  gym: ["gym", "balance", "obstacle", "jumpstart"],
  phonics: ["phonics", "reading", "letter"],
  festival: ["festival", "dussehra", "craft"],
  splash: ["splash", "water", "camp"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(" ")
    .filter((t) => t.length >= 2);
}

function expandToken(token: string): string[] {
  const extras = SYNONYMS[token] ?? [];
  return [token, ...extras];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[b.length];
}

function fuzzyIncludes(haystack: string, needle: string): boolean {
  if (haystack.includes(needle)) return true;
  if (needle.length < 4) return false;
  const words = haystack.split(" ");
  return words.some((word) => {
    if (word.length < 4) return false;
    const maxDist = needle.length >= 7 ? 2 : 1;
    return levenshtein(word, needle) <= maxDist;
  });
}

function eventSearchBlob(event: KidsEvent): {
  title: string;
  organizer: string;
  venue: string;
  area: string;
  rest: string;
} {
  const age = event.ageGroups.map((g) => AGE_GROUP_LABELS[g] ?? g).join(" ");
  const category = CATEGORY_LABELS[event.category] ?? event.category;
  return {
    title: normalize(event.title),
    organizer: normalize(event.organizer),
    venue: normalize(event.venue),
    area: normalize(event.area),
    rest: normalize(
      `${event.description} ${category} ${age} ${event.isFree ? "free" : event.price ?? ""}`
    ),
  };
}

function fieldScore(field: string, needles: string[], weight: number): number {
  let score = 0;
  for (const needle of needles) {
    if (field.startsWith(needle) || field.split(" ").some((w) => w.startsWith(needle))) {
      score += weight * 2;
    } else if (field.includes(needle)) {
      score += weight;
    } else if (fuzzyIncludes(field, needle)) {
      score += weight * 0.6;
    }
  }
  return score;
}

export function scoreEventSearch(event: KidsEvent, query: string): number {
  const tokens = tokenize(query);
  if (!tokens.length) return 1;

  const blob = eventSearchBlob(event);
  let total = 0;

  for (const token of tokens) {
    const needles = expandToken(token);
    const tokenScore =
      fieldScore(blob.title, needles, 8) +
      fieldScore(blob.organizer, needles, 6) +
      fieldScore(blob.area, needles, 5) +
      fieldScore(blob.venue, needles, 4) +
      fieldScore(blob.rest, needles, 2);

    if (tokenScore === 0) return 0;
    total += tokenScore;
  }

  return total;
}

export interface SearchSuggestion {
  label: string;
  query: string;
  kind: "event" | "preschool" | "area" | "category";
}

export function buildSearchSuggestions(
  events: KidsEvent[],
  query: string,
  limit = 8
): SearchSuggestion[] {
  const q = normalize(query);
  if (q.length < 1) return [];

  const seen = new Set<string>();
  const out: SearchSuggestion[] = [];

  const push = (item: SearchSuggestion) => {
    const key = `${item.kind}:${normalize(item.label)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };

  for (const event of events) {
    if (normalize(event.title).includes(q) || scoreEventSearch(event, query) > 0) {
      push({ label: event.title, query: event.title, kind: "event" });
    }
    if (normalize(event.organizer).includes(q)) {
      push({ label: event.organizer, query: event.organizer, kind: "preschool" });
    }
    if (normalize(event.area).includes(q) || fuzzyIncludes(normalize(event.area), q)) {
      push({ label: event.area, query: event.area, kind: "area" });
    }
    const cat = CATEGORY_LABELS[event.category];
    if (normalize(cat).includes(q)) {
      push({ label: cat, query: cat, kind: "category" });
    }
    if (out.length >= limit * 3) break;
  }

  return out.slice(0, limit);
}
