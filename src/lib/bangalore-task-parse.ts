import type { EventCategory, KidsEvent } from "@/types/event";
import { isInNextTwoMonths } from "@/lib/event-date";
import { isInstagramPostUrl } from "@/lib/instagram";
import { eventIsListable } from "@/lib/listable";
import { AUDIENCE_MAX_YEARS, ageGroupsForRange } from "@/lib/age";

export type TaskEventRow = {
  title?: string;
  date?: string;
  endDate?: string;
  time?: string;
  venue?: string;
  area?: string;
  organizer?: string;
  ageMinYears?: number;
  ageMaxYears?: number;
  category?: string;
  sourceUrl?: string;
  instagramUrl?: string;
  bookingUrl?: string;
  price?: string;
  description?: string;
};

export const BANGALORE_TASK_SCHEMA = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          date: { type: "string", description: "Calendar date as YYYY-MM-DD" },
          endDate: { type: "string" },
          time: { type: "string" },
          venue: { type: "string" },
          area: { type: "string" },
          organizer: { type: "string" },
          ageMinYears: { type: "number" },
          ageMaxYears: { type: "number" },
          category: { type: "string" },
          sourceUrl: { type: "string" },
          instagramUrl: { type: "string" },
          bookingUrl: { type: "string" },
          price: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "date", "sourceUrl"],
      },
    },
  },
  required: ["events"],
};

const CATEGORIES: EventCategory[] = [
  "workshop",
  "camp",
  "open day",
  "sports",
  "art",
  "music",
  "festival",
];

function isoDay(value: string): string | null {
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function looksBangalore(row: TaskEventRow): boolean {
  const blob = `${row.title} ${row.venue} ${row.area} ${row.organizer} ${row.sourceUrl} ${row.description}`;
  return /\b(bangalore|bengaluru|blr|koramangala|indiranagar|whitefield|hsr|jayanagar|bellandur|jp\s*nagar|malleshwaram|hebbal)\b/i.test(
    blob,
  );
}

export function eventsFromTaskRows(rows: TaskEventRow[]): KidsEvent[] {
  const events: KidsEvent[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const title = row.title?.trim();
    const day = row.date ? isoDay(row.date) : null;
    const source = row.sourceUrl?.trim() || row.bookingUrl?.trim() || row.instagramUrl?.trim();
    if (!title || title.length < 6 || !day || !source) continue;
    if (!/^https?:\/\//i.test(source)) continue;
    if (!looksBangalore(row)) continue;

    const minYears = Math.max(0.5, Number(row.ageMinYears) || 2);
    if (minYears > AUDIENCE_MAX_YEARS) continue;
    const hasMax = Number.isFinite(Number(row.ageMaxYears));
    const maxYears = hasMax ? Number(row.ageMaxYears) : undefined;
    const groups = ageGroupsForRange(minYears, maxYears ?? AUDIENCE_MAX_YEARS);
    if (!groups.length) continue;

    const key = `${title.toLowerCase()}|${day}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const category = CATEGORIES.includes(row.category as EventCategory)
      ? (row.category as EventCategory)
      : "workshop";
    const instagramUrl = row.instagramUrl && isInstagramPostUrl(row.instagramUrl)
      ? row.instagramUrl
      : undefined;
    const organizer = row.organizer?.trim() || "Bengaluru organiser";
    const event: KidsEvent = {
      id: `task-${slug(organizer)}-${slug(title)}-${day}`,
      title: title.slice(0, 72),
      date: `${day}T10:00:00+05:30`,
      endDate: row.endDate && isoDay(row.endDate) ? `${isoDay(row.endDate)}T18:00:00+05:30` : undefined,
      time: row.time?.trim() || "See listing",
      city: "bangalore",
      area: row.area?.trim() || "Bengaluru",
      venue: row.venue?.trim() || row.area?.trim() || "Bengaluru",
      ageMinMonths: Math.round(minYears * 12),
      ageMaxYears: maxYears,
      ageGroups: groups,
      category,
      organizer,
      description: (row.description || title).slice(0, 160),
      instagramHandle: slug(organizer).replace(/-/g, "") || "instagram",
      instagramUrl,
      fromInstagram: Boolean(instagramUrl),
      bookingUrl: row.bookingUrl || (instagramUrl ? undefined : source),
      website: source,
      isFree: /\bfree\b/i.test(row.price || ""),
      price: row.price,
    };

    if (!eventIsListable(event) || !isInNextTwoMonths(event)) continue;
    events.push(event);
  }

  return events;
}
