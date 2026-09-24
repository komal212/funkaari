import type { AgeGroup, EventCategory, KidsEvent } from "@/types/event";
import { isInstagramPostUrl, normalizeHandle } from "@/lib/instagram";
import { AUDIENCE_MAX_YEARS, ageGroupsForRange, parseAgeMention } from "@/lib/age";

export const DELHI_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1jsyvxM-Ux8zQAyCgboDTwbFFT4tiufUFC4aNtYn2_n0/export?format=csv&gid=981476459";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function prettyCity(city: string): string {
  const value = city.trim();
  if (/gurgaon|gurugram/i.test(value)) return "Gurugram";
  if (/greater\s*noida/i.test(value)) return "Greater Noida";
  if (/noida/i.test(value)) return "Noida";
  if (/delhi\s*ncr/i.test(value)) return "Delhi NCR";
  if (/delhi/i.test(value)) return "Delhi";
  return value || "Delhi NCR";
}

function areaFrom(city: string, locality: string): string {
  const loc = locality.replace(/\s*\/\s*Delhi$/i, "").trim();
  const place = `${city} ${loc}`;
  if (/greater\s*noida/i.test(place)) return "Greater Noida";
  if (/gurgaon|gurugram/i.test(place)) return "Gurugram";
  if (/noida/i.test(place)) return "Noida";
  if (!loc || /multiple|delhi ncr/i.test(loc)) return "Delhi NCR";
  if (/gk-?2|greater kailash/i.test(loc)) return "Greater Kailash";
  if (/cr\s*park/i.test(loc)) return "Chittaranjan Park";
  return loc;
}

function detectCategory(text: string): EventCategory {
  const t = text.toLowerCase();
  if (/pottery|clay|art|paint|craft|lippan|mosaic|canvas|diy|baking|cookie/.test(t)) {
    return "art";
  }
  if (/garden|farm|outdoor|nature|camp/.test(t)) return "camp";
  if (/festival|pop-?up/.test(t)) return "festival";
  if (/sport|gym/.test(t)) return "sports";
  if (/music|dance/.test(t)) return "music";
  return "workshop";
}

function parseAge(raw: string): {
  minMonths: number;
  maxYears?: number;
  groups: AgeGroup[];
} | null {
  const text = raw.toLowerCase().trim();
  if (!text) {
    return { minMonths: 24, groups: ageGroupsForRange(2) };
  }

  const mentioned = parseAgeMention(text);
  const kidsFamily = /kids\/?family|family|kids|varies/.test(text);
  const minYears = mentioned?.minYears ?? (kidsFamily ? 2 : 2);
  if (minYears > AUDIENCE_MAX_YEARS) return null;
  const maxYears = mentioned && !mentioned.openEnded ? mentioned.maxYears : undefined;
  const groups = ageGroupsForRange(minYears, maxYears ?? AUDIENCE_MAX_YEARS);
  if (!groups.length) return null;
  return { minMonths: Math.round(minYears * 12), maxYears, groups };
}

function firstUrl(...values: string[]): string | undefined {
  for (const value of values) {
    const match = value.match(/https?:\/\/[^\s,]+/i);
    if (match) return match[0].replace(/[).]+$/, "");
  }
  return undefined;
}

function isGenericBooking(url: string): boolean {
  return /^https?:\/\/(www\.|in\.)?bookmyshow\.com\/?$/i.test(url);
}

function tidyPrice(raw: string): { isFree: boolean; price?: string } {
  const text = raw.replace(/^~/, "").trim();
  if (!text || /^varies$/i.test(text) || /^on request$/i.test(text)) {
    return { isFree: false };
  }
  if (/^free$/i.test(text)) return { isFree: true };
  return { isFree: false, price: text };
}

function rowMap(headers: string[], cells: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((header, index) => {
    out[header.trim().toLowerCase()] = (cells[index] || "").trim();
  });
  return out;
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  return "";
}

export function parseDelhiSupplierCsv(csv: string): KidsEvent[] {
  const table = parseCsv(csv);
  if (table.length < 2) return [];
  const headers = table[0].map((h) => h.trim().toLowerCase());
  const events: KidsEvent[] = [];

  for (const cells of table.slice(1)) {
    const row = rowMap(headers, cells);
    const host = pick(row, "supplier / host", "host", "name");
    if (!host) continue;

    const fit = pick(row, "moonie fit", "fit").toLowerCase();
    if (fit.includes("needs verification")) continue;

    const age = parseAge(pick(row, "age"));
    if (!age) continue;

    const cityLabel = prettyCity(pick(row, "city"));
    const locality = pick(row, "locality");
    const area = areaFrom(pick(row, "city"), locality);
    const experience = pick(row, "category / experience", "category");
    const format = pick(row, "format");
    const handle = normalizeHandle(pick(row, "instagram").replace(/^@/, ""));
    const website = firstUrl(pick(row, "website"));
    const bookingRaw = firstUrl(pick(row, "booking / source", "booking", "source"));
    const bookingUrl =
      bookingRaw && !isGenericBooking(bookingRaw) ? bookingRaw : website;
    const instagramUrl =
      bookingRaw && isInstagramPostUrl(bookingRaw) ? bookingRaw : undefined;
    const priced = tidyPrice(pick(row, "typical price", "price"));
    const venueBits = [locality.replace(/\s*\/\s*Delhi$/i, "").trim(), cityLabel]
      .filter((bit) => bit && !/^multiple$/i.test(bit))
      .filter((bit, index, all) => all.indexOf(bit) === index);

    events.push({
      id: `delhi-${slug(host)}`,
      title: host.replace(/\s*\/\s*/g, " / "),
      date: "2099-12-31T10:00:00+05:30",
      ongoing: true,
      time: format || "Drop-in & weekend workshops",
      city: "delhi",
      area,
      venue: venueBits.join(", ") || "Delhi NCR",
      ageMinMonths: age.minMonths,
      ageMaxYears: age.maxYears,
      ageGroups: age.groups,
      category: detectCategory(`${experience} ${format}`),
      organizer: host.split(" / ")[0].split(" - ")[0].trim(),
      description: [experience, format].filter(Boolean).join(" · "),
      instagramHandle: handle || "instagram",
      instagramUrl,
      bookingUrl: bookingUrl || bookingRaw,
      website,
      isFree: priced.isFree,
      price: priced.price,
    });
  }

  return events;
}

export async function fetchDelhiSheetEvents(): Promise<{
  events: KidsEvent[];
  source: "sheet" | "snapshot";
  warning?: string;
}> {
  const url = process.env.DELHI_SHEET_CSV_URL || DELHI_SHEET_CSV_URL;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Funkaari/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return {
        events: [],
        source: "snapshot",
        warning: `Delhi sheet returned ${res.status}. Showing saved listings.`,
      };
    }
    const csv = await res.text();
    if (/sign-in|accounts\.google/i.test(csv.slice(0, 400))) {
      return {
        events: [],
        source: "snapshot",
        warning: "Delhi sheet needs public access. Showing saved listings.",
      };
    }
    const events = parseDelhiSupplierCsv(csv);
    if (!events.length) {
      return {
        events: [],
        source: "snapshot",
        warning: "No Delhi listings parsed from the sheet.",
      };
    }
    return { events, source: "sheet" };
  } catch {
    return {
      events: [],
      source: "snapshot",
      warning: "Could not refresh the Delhi sheet.",
    };
  }
}
