import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { KidsEvent } from "@/types/event";
import { areaFromText, isGenericBangalorePlace } from "@/lib/bangalore-area";
import { eventIsOnline } from "@/lib/online";
import { searchPages } from "@/lib/parallel-web";
import bundled from "@/data/maps-places.json";

export type MapsHit = {
  area: string;
  venue: string;
};

type CacheValue = MapsHit | { miss: true };

const NOMINATIM = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Funkaari/1.0 (https://github.com/komal212/funkaari; kids events Bengaluru)";
const BLR_VIEWBOX = "77.45,13.16,77.80,12.80";
const NOMINATIM_GAP_MS = 1100;

const memory = new Map<string, CacheValue>();

for (const [key, value] of Object.entries(bundled as Record<string, MapsHit | null>)) {
  if (!key) continue;
  memory.set(key, value && typeof value === "object" && "area" in value ? value : { miss: true });
}

let lastNominatim = 0;

function cacheKey(query: string): string {
  return query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function latLonInBengaluru(lat: number, lon: number): boolean {
  return lat >= 12.7 && lat <= 13.25 && lon >= 77.35 && lon <= 77.9;
}

function tokensFromQuery(query: string): string[] {
  return cacheKey(query)
    .replace(/\b(bengaluru|bangalore|india|maps|google)\b/g, " ")
    .split(" ")
    .filter((token) => token.length > 2);
}

function nameMatches(query: string, haystack: string): boolean {
  const hay = cacheKey(haystack);
  const tokens = tokensFromQuery(query);
  if (!tokens.length) return false;
  const hits = tokens.filter((token) => hay.includes(token));
  if (tokens.length === 1) return hits.length === 1;
  return hits.length >= Math.ceil(tokens.length * 0.6);
}

function tidySuburb(name?: string): string | undefined {
  const t = name?.trim();
  if (!t) return undefined;
  if (
    /corporation|urban|karnataka|india|bangalore south|bangalore north|bengaluru south|bengaluru north/i.test(
      t,
    )
  ) {
    return undefined;
  }
  if (/^(bengaluru|bangalore)$/i.test(t)) return undefined;
  return t;
}

function isBengaluruBlob(text: string): boolean {
  return /\b(bengaluru|bangalore)\b/i.test(text);
}

function venueFromDisplay(display: string): string {
  return display
    .replace(/,?\s*India$/i, "")
    .replace(/,?\s*Karnataka(?:,\s*\d{6})?$/i, "")
    .trim()
    .slice(0, 120);
}

function hitFromOsm(query: string, row: {
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
}): MapsHit | null {
  const display = row.display_name || "";
  const name = row.name || "";
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !latLonInBengaluru(lat, lon)) return null;
  if (!isBengaluruBlob(`${name} ${display} ${Object.values(row.address || {}).join(" ")}`)) {
    return null;
  }
  if (!nameMatches(query, `${name} ${display}`)) return null;
  const addr = row.address || {};
  const area =
    areaFromText(`${addr.suburb || ""} ${addr.neighbourhood || ""} ${addr.quarter || ""} ${display}`) ||
    tidySuburb(addr.suburb) ||
    tidySuburb(addr.neighbourhood) ||
    tidySuburb(addr.city_district) ||
    "Bengaluru";
  const road = [addr.house_number, addr.road, addr.suburb || addr.neighbourhood, "Bengaluru"]
    .filter(Boolean)
    .join(", ");
  return {
    area,
    venue: venueFromDisplay(road || display || name),
  };
}

async function nominatimPause() {
  const wait = lastNominatim + NOMINATIM_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatim = Date.now();
}

async function nominatimJson(url: string): Promise<unknown> {
  await nominatimPause();
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function nominatimSearch(query: string): Promise<MapsHit | null> {
  const params = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    limit: "5",
    countrycodes: "in",
    bounded: "1",
    viewbox: BLR_VIEWBOX,
    q: query,
  });
  const data = await nominatimJson(`${NOMINATIM}/search?${params.toString()}`);
  if (!Array.isArray(data)) return null;
  for (const row of data) {
    const hit = hitFromOsm(query, row as Parameters<typeof hitFromOsm>[1]);
    if (hit) return hit;
  }
  return null;
}

async function nominatimReverse(lat: number, lon: number): Promise<MapsHit | null> {
  if (!latLonInBengaluru(lat, lon)) return null;
  const params = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    lat: String(lat),
    lon: String(lon),
    zoom: "18",
  });
  const data = (await nominatimJson(`${NOMINATIM}/reverse?${params.toString()}`)) as {
    name?: string;
    display_name?: string;
    lat?: string;
    lon?: string;
    address?: Record<string, string>;
  } | null;
  if (!data?.display_name) return null;
  const display = data.display_name;
  if (!isBengaluruBlob(display)) return null;
  const addr = data.address || {};
  const area =
    areaFromText(display) ||
    tidySuburb(addr.suburb) ||
    tidySuburb(addr.neighbourhood) ||
    "Bengaluru";
  return { area, venue: venueFromDisplay(display) };
}

function coordsFromMapsUrl(url: string): { lat: number; lon: number } | null {
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lon: Number(at[2]) };
  const bang = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bang) return { lat: Number(bang[1]), lon: Number(bang[2]) };
  const q = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: Number(q[1]), lon: Number(q[2]) };
  return null;
}

function addressFromSnippet(text: string): string | undefined {
  const pin = text.match(
    /([A-Za-z0-9][A-Za-z0-9 .,'#/-]{12,90}(?:Bengaluru|Bangalore)[A-Za-z0-9 ,.-]{0,24}\d{6})/i,
  );
  if (pin?.[1]) return pin[1].replace(/\s+/g, " ").trim().slice(0, 120);
  const line = text.match(
    /(\d{1,4}[A-Za-z]?,?\s+[A-Za-z][^.\n]{10,80}(?:Bengaluru|Bangalore))/i,
  );
  return line?.[1]?.replace(/\s+/g, " ").trim().slice(0, 120);
}

async function searchMapsViaWeb(query: string): Promise<MapsHit | null> {
  const found = await searchPages({
    objective: `Find the Google Maps listing or a street address in Bengaluru for ${query}. Return only a real place in Bengaluru. Do not guess a neighbourhood.`,
    searchQueries: [
      `${query} Bengaluru Google Maps`,
      `${query} Bangalore address`,
    ],
    maxResults: 8,
  });
  if (found.error || !found.pages.length) return null;

  for (const page of found.pages) {
    const blob = `${page.title || ""}\n${page.url}\n${page.text}`;
    if (!nameMatches(query, blob) || !isBengaluruBlob(blob)) continue;
    const coords = coordsFromMapsUrl(page.url);
    if (coords) {
      const reversed = await nominatimReverse(coords.lat, coords.lon);
      if (reversed) {
        const named = page.title?.replace(/\s*[-–|].*$/, "").trim();
        return {
          area: reversed.area,
          venue: named && named.length > 3 ? `${named}, ${reversed.venue}` : reversed.venue,
        };
      }
    }
    const area = areaFromText(blob);
    const venue = addressFromSnippet(blob);
    if (area || venue) {
      return {
        area: area || "Bengaluru",
        venue: venue || area || query,
      };
    }
  }
  return null;
}

function persistCache() {
  try {
    const serial: Record<string, MapsHit | null> = {};
    for (const [key, value] of memory) {
      serial[key] = "miss" in value ? null : value;
    }
    writeFileSync(
      join(process.cwd(), "src/data/maps-places.json"),
      `${JSON.stringify(serial, null, 2)}\n`,
      "utf8",
    );
  } catch {
    // Vercel and other read-only deploys cannot write the cache file.
  }
}

export function locationQueryForEvent(event: KidsEvent): string | null {
  if (event.city !== "bangalore") return null;
  if (eventIsOnline(event) || event.area === "Online") return null;

  const venue = event.venue?.trim() || "";
  const organizer = (event.organizer || "").replace(/[._]/g, " ").trim();
  const titleAt = event.title.match(/\bat\s+([^.,(]{4,60})/i)?.[1]?.trim();

  const venueUsable =
    venue &&
    !isGenericBangalorePlace(venue) &&
    venue.toLowerCase() !== (event.area || "").toLowerCase();

  const raw = venueUsable
    ? venue
    : titleAt && !isGenericBangalorePlace(titleAt)
      ? titleAt
      : organizer;

  if (!raw || /^(instagram|bengaluru organiser|organiser)$/i.test(raw)) return null;
  const query = `${raw} Bengaluru`.replace(/\s+/g, " ").trim();
  if (tokensFromQuery(query).join("").length < 4) return null;
  return query;
}

export function locationNeedsMaps(event: KidsEvent): boolean {
  if (!locationQueryForEvent(event)) return false;
  const areaMissing = isGenericBangalorePlace(event.area);
  const venueMissing =
    isGenericBangalorePlace(event.venue) ||
    (event.venue || "").trim().toLowerCase() === (event.area || "").trim().toLowerCase();
  return areaMissing || venueMissing;
}

async function lookupUncached(query: string, webSearch: boolean): Promise<MapsHit | null> {
  const hit = await nominatimSearch(query);
  if (hit) return hit;
  if (!webSearch) return null;
  return searchMapsViaWeb(query);
}

export async function lookupMapsPlace(
  query: string,
  options?: { webSearch?: boolean; persist?: boolean },
): Promise<MapsHit | null> {
  const key = cacheKey(query);
  const cached = memory.get(key);
  if (cached) return "miss" in cached ? null : cached;

  const hit = await lookupUncached(query, Boolean(options?.webSearch));
  memory.set(key, hit ?? { miss: true });
  if (options?.persist) persistCache();
  return hit;
}

function applyHit(event: KidsEvent, hit: MapsHit): KidsEvent {
  const areaMissing = isGenericBangalorePlace(event.area);
  const venueMissing =
    isGenericBangalorePlace(event.venue) ||
    (event.venue || "").trim().toLowerCase() === (event.area || "").trim().toLowerCase();
  return {
    ...event,
    area: areaMissing ? hit.area : event.area,
    venue: venueMissing ? hit.venue : event.venue,
  };
}

export async function enrichEventLocations(
  events: KidsEvent[],
  options?: { webSearch?: boolean; persist?: boolean; limit?: number },
): Promise<KidsEvent[]> {
  const pending = events.filter(locationNeedsMaps);
  const unique = new Map<string, string>();
  for (const event of pending) {
    const query = locationQueryForEvent(event);
    if (!query) continue;
    const key = cacheKey(query);
    if (!unique.has(key)) unique.set(key, query);
  }

  const cap = options?.limit && options.limit > 0 ? options.limit : unique.size;
  let looked = 0;
  for (const query of unique.values()) {
    if (looked >= cap) break;
    const key = cacheKey(query);
    if (!memory.has(key)) looked += 1;
    await lookupMapsPlace(query, options);
  }
  if (options?.persist) persistCache();

  return events.map((event) => {
    if (!locationNeedsMaps(event)) return event;
    const query = locationQueryForEvent(event);
    if (!query) return event;
    const cached = memory.get(cacheKey(query));
    if (!cached || "miss" in cached) return event;
    return applyHit(event, cached);
  });
}
