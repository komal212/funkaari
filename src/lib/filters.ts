import type { EventFilters, KidsEvent } from "@/types/event";
import { scoreEventSearch } from "@/lib/search";
import { eventIsListable } from "@/lib/listable";
import { compareListingEvents, isUpcomingEvent } from "@/lib/event-date";
import { eventIsOnline } from "@/lib/online";

function startOfLocalDay(value: Date): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function eventSpan(eventDate: string, endDate?: string): { start: Date; end: Date } {
  const start = startOfLocalDay(new Date(eventDate));
  const end = startOfLocalDay(new Date(endDate || eventDate));
  return { start, end };
}

function isThisWeek(dateStr: string, endDate?: string): boolean {
  const { start, end } = eventSpan(dateStr, endDate);
  const today = startOfLocalDay(new Date());
  const sunday = startOfLocalDay(new Date());
  const day = today.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  sunday.setDate(today.getDate() + daysUntilSunday);
  sunday.setHours(23, 59, 59, 999);
  return start <= sunday && end >= today;
}

function isThisWeekend(dateStr: string, endDate?: string): boolean {
  const { start, end } = eventSpan(dateStr, endDate);
  const now = new Date();
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
  const saturday = startOfLocalDay(new Date());
  saturday.setDate(now.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);
  return start <= sunday && end >= saturday;
}

export function filterEvents(
  events: KidsEvent[],
  filters: EventFilters
): KidsEvent[] {
  const query = filters.search.trim();

  const matched = events.filter((event) => {
    if (!eventIsListable(event)) return false;

    if (query && scoreEventSearch(event, query) === 0) {
      return false;
    }

    if (filters.ageGroup !== "all" && !event.ageGroups.includes(filters.ageGroup)) {
      return false;
    }

    if (filters.area !== "all" && event.area !== filters.area) {
      return false;
    }

    if (filters.category !== "all" && event.category !== filters.category) {
      return false;
    }

    if (filters.place === "online" && !eventIsOnline(event)) {
      return false;
    }
    if (filters.place === "offline" && eventIsOnline(event)) {
      return false;
    }

    if (filters.time !== "all" && !event.ongoing && !isUpcomingEvent(event)) {
      return false;
    }

    if (filters.time === "this-week" && !event.ongoing && !isThisWeek(event.date, event.endDate)) {
      return false;
    }

    if (
      filters.time === "this-weekend" &&
      !event.ongoing &&
      !isThisWeekend(event.date, event.endDate)
    ) {
      return false;
    }

    return true;
  });

  if (!query) return matched.sort(compareListingEvents);

  return [...matched].sort((a, b) => {
    const byScore = scoreEventSearch(b, query) - scoreEventSearch(a, query);
    if (byScore !== 0) return byScore;
    return compareListingEvents(a, b);
  });
}

export function formatEventDate(
  dateStr: string,
  ongoing?: boolean,
  endDate?: string,
): string {
  if (ongoing) return "Ongoing";
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return dateStr;
  const startLabel = start.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!endDate) return startLabel;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;
  const startDay = start.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const endDay = end.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (startDay === endDay) return startLabel;
  const endLabel = end.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export function areasFromEvents(events: KidsEvent[]): string[] {
  return [...new Set(events.map((event) => event.area).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export { formatAgeRange } from "@/lib/age";
