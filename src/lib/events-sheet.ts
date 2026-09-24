import { writeFileSync } from "node:fs";
import type { KidsEvent } from "@/types/event";
import { formatAgeRange } from "@/lib/age";
import { isGenericBangalorePlace } from "@/lib/bangalore-area";
import { eventIsListable } from "@/lib/listable";
import { eventIsOnline } from "@/lib/online";
import { normalizeHandle } from "@/lib/instagram";
import { FUNKAARI_FOLLOWED_SCHOOLS } from "@/data/funkaari-followed-schools";

export const SHEET_HEADERS = [
  "Event Name",
  "Date",
  "Time",
  "Location",
  "Venue Name",
  "Age Group",
  "Price",
  "Organizer Name",
  "Organizer Instagram",
  "Organizer Phone/DM",
  "Source",
  "Status",
] as const;

export type SheetStatus = "Listed" | "Not yet";

export type EventSheetRow = {
  "Event Name": string;
  Date: string;
  Time: string;
  Location: string;
  "Venue Name": string;
  "Age Group": string;
  Price: string;
  "Organizer Name": string;
  "Organizer Instagram": string;
  "Organizer Phone/DM": string;
  Source: string;
  Status: SheetStatus | string;
};

const HANDLE_NAMES = new Map(
  FUNKAARI_FOLLOWED_SCHOOLS.map((school) => [normalizeHandle(school.handle), school.name]),
);

function titleCaseName(value: string): string {
  return value
    .replace(/[._]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function sheetRowKey(name: string, date: string): string {
  return `${name.trim().toLowerCase()}|${date.trim().toLowerCase()}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function kolkataYmd(value: Date): { day: number; month: number; year: number } | null {
  const label = value.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const match = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function formatSheetDay(value: Date): string {
  const parts = kolkataYmd(value);
  if (!parts) return "";
  return `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;
}

function sheetDate(event: KidsEvent): string {
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) return event.date;
  const startLabel = formatSheetDay(start);
  if (!event.endDate) return startLabel;
  const end = new Date(event.endDate);
  if (Number.isNaN(end.getTime()) || !startLabel) return startLabel;
  const startDay = kolkataYmd(start);
  const endDay = kolkataYmd(end);
  if (!endDay || (startDay && startDay.day === endDay.day && startDay.month === endDay.month && startDay.year === endDay.year)) {
    return startLabel;
  }
  return `${startLabel} – ${formatSheetDay(end)}`;
}

function sheetAge(event: KidsEvent): string {
  return formatAgeRange(event)
    .replace(/\bmo\b/g, "months")
    .replace(/\byrs\b/g, "years")
    .replace(/(\d)\+$/, "$1+ years");
}

function sheetPrice(event: KidsEvent): string {
  if (event.isFree) return "Free";
  const raw = event.price?.trim() || "";
  if (!raw) return "";
  if (/^free$/i.test(raw)) return "Free";
  const cleaned = raw.replace(/₹\s*/g, "Rs ").replace(/\s+/g, " ").trim();
  if (/^\d/.test(cleaned)) return `Rs ${cleaned}`;
  return cleaned;
}

function organizerHandle(event: KidsEvent): string {
  const handle = normalizeHandle(event.instagramHandle || "");
  if (!handle || handle === "instagram") return "";
  return handle;
}

function organizerName(event: KidsEvent): string {
  const handle = organizerHandle(event);
  if (handle && HANDLE_NAMES.get(handle)) return HANDLE_NAMES.get(handle) as string;
  const named = event.organizer?.trim() || "";
  if (named && named.toLowerCase() !== handle.toLowerCase() && named !== "Bengaluru organiser") {
    return named;
  }
  if (handle) return titleCaseName(handle);
  return named;
}

function venueName(event: KidsEvent): string {
  if (eventIsOnline(event)) return "Online";
  const venue = event.venue?.trim() || "";
  if (venue && !isGenericBangalorePlace(venue) && venue.toLowerCase() !== (event.area || "").toLowerCase()) {
    return venue.split(",")[0].trim();
  }
  return organizerName(event);
}

function locationLabel(event: KidsEvent): string {
  if (eventIsOnline(event)) return "Online";
  const venue = event.venue?.trim() || "";
  if (/pickup/i.test(`${venue} ${event.time || ""}`)) return "Bengaluru";
  return event.area?.trim() || "Bengaluru";
}

function phoneFromEvent(event: KidsEvent): string {
  const blob = `${event.instagramCaption || ""} ${event.description || ""} ${event.venue || ""}`;
  const match = blob.match(/(?:\+91[\s-]?)?([6-9]\d{9})/);
  return match?.[1] || "";
}

function contactLabel(event: KidsEvent): string {
  const phone = phoneFromEvent(event);
  if (phone) return phone;
  const handle = organizerHandle(event);
  return handle ? `DM @${handle}` : "";
}

function sourceLabel(event: KidsEvent): string {
  const blob = `${event.instagramCaption || ""} ${event.description || ""}`;
  if (/\bwhatsapp\b/i.test(blob)) return "WhatsApp";
  if (event.fromInstagram || event.instagramUrl) return "Instagram";
  const href = event.bookingUrl || event.website || "";
  if (/bookmyshow/i.test(href)) return "BookMyShow";
  if (href) {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return "Website";
    }
  }
  if (event.id.startsWith("task-")) return "Web search";
  if (event.id.startsWith("web-")) return "Website";
  return "Funkaari catalog";
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function eventToSheetRow(
  event: KidsEvent,
  existingStatus?: Map<string, string>,
): EventSheetRow {
  const name = event.title.trim();
  const date = sheetDate(event);
  const key = sheetRowKey(name, date);
  const status = existingStatus?.get(key) || (eventIsListable(event) ? "Listed" : "Not yet");
  return {
    "Event Name": name,
    Date: date,
    Time: event.time?.trim() || "",
    Location: locationLabel(event),
    "Venue Name": venueName(event),
    "Age Group": sheetAge(event),
    Price: sheetPrice(event),
    "Organizer Name": organizerName(event),
    "Organizer Instagram": organizerHandle(event) ? `@${organizerHandle(event)}` : "",
    "Organizer Phone/DM": contactLabel(event),
    Source: sourceLabel(event),
    Status: status,
  };
}

export function eventsToSheetRows(
  events: KidsEvent[],
  existingStatus?: Map<string, string>,
): EventSheetRow[] {
  return events.map((event) => eventToSheetRow(event, existingStatus));
}

export function sheetRowsToValues(rows: EventSheetRow[]): string[][] {
  return [
    [...SHEET_HEADERS],
    ...rows.map((row) => SHEET_HEADERS.map((header) => row[header] || "")),
  ];
}

export function sheetRowsToCsv(rows: EventSheetRow[]): string {
  return sheetRowsToValues(rows)
    .map((line) => line.map(csvCell).join(","))
    .join("\n") + "\n";
}

export function writeEventsSheetCsv(filePath: string, events: KidsEvent[], existingStatus?: Map<string, string>) {
  writeFileSync(filePath, sheetRowsToCsv(eventsToSheetRows(events, existingStatus)), "utf8");
}

export function statusMapFromSheetValues(values: string[][]): Map<string, string> {
  const map = new Map<string, string>();
  if (!values.length) return map;
  const header = values[0].map((cell) => cell.trim());
  const nameIdx = header.indexOf("Event Name");
  const dateIdx = header.indexOf("Date");
  const statusIdx = header.indexOf("Status");
  if (nameIdx < 0 || dateIdx < 0 || statusIdx < 0) return map;
  for (const row of values.slice(1)) {
    const name = row[nameIdx]?.trim();
    const date = row[dateIdx]?.trim();
    const status = row[statusIdx]?.trim();
    if (name && date && status) map.set(sheetRowKey(name, date), status);
  }
  return map;
}
