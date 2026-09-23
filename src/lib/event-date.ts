import type { KidsEvent } from "@/types/event";

function ymdInKolkata(value: Date): string {
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** Keep events through the end of their day (or last day, if set). */
export function isUpcomingEvent(
  event: Pick<KidsEvent, "date" | "endDate" | "ongoing">,
  now?: Date,
): boolean {
  if (event.ongoing) return true;
  const when = now instanceof Date ? now : new Date();
  const last = new Date(event.endDate || event.date);
  if (Number.isNaN(last.getTime())) return false;
  return ymdInKolkata(last) >= ymdInKolkata(when);
}

/** Ended, but still recent enough to keep on the listing (blurred). */
export function isRecentlyOver(
  event: Pick<KidsEvent, "date" | "endDate" | "ongoing">,
  now?: Date,
  withinDays = 30,
): boolean {
  if (event.ongoing) return false;
  if (isUpcomingEvent(event, now)) return false;
  const when = now instanceof Date ? now : new Date();
  const last = new Date(event.endDate || event.date);
  if (Number.isNaN(last.getTime())) return false;
  const cutoff = new Date(when);
  cutoff.setDate(cutoff.getDate() - withinDays);
  return last.getTime() >= cutoff.getTime();
}

/** Dated listings that start within the next two months. */
export function isInNextTwoMonths(
  event: Pick<KidsEvent, "date" | "endDate" | "ongoing">,
  now?: Date,
): boolean {
  if (!isUpcomingEvent(event, now)) return false;
  if (event.ongoing) return true;
  const when = now instanceof Date ? now : new Date();
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) return false;
  const limit = new Date(when);
  limit.setMonth(limit.getMonth() + 2);
  return start.getTime() <= limit.getTime();
}

export function isInListingWindow(
  event: Pick<KidsEvent, "date" | "endDate" | "ongoing">,
  now?: Date,
): boolean {
  return isInNextTwoMonths(event, now) || isRecentlyOver(event, now);
}

function startMs(event: Pick<KidsEvent, "date">): number {
  const start = new Date(event.date).getTime();
  return Number.isNaN(start) ? 0 : start;
}

function endMs(event: Pick<KidsEvent, "date" | "endDate">): number {
  const end = new Date(event.endDate || event.date).getTime();
  return Number.isNaN(end) ? startMs(event) : end;
}

/** Soonest first: happening now, then the next start date, through to the latest end. */
export function compareListingEvents(a: KidsEvent, b: KidsEvent): number {
  const aUp = isUpcomingEvent(a);
  const bUp = isUpcomingEvent(b);
  if (aUp !== bUp) return aUp ? -1 : 1;

  if (!aUp) {
    return endMs(b) - endMs(a);
  }

  const now = Date.now();
  const aNext = startMs(a) <= now ? now : startMs(a);
  const bNext = startMs(b) <= now ? now : startMs(b);
  if (aNext !== bNext) return aNext - bNext;
  if (startMs(a) !== startMs(b)) return startMs(a) - startMs(b);
  return endMs(a) - endMs(b);
}
