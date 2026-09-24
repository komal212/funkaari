import type { AgeGroup, KidsEvent } from "@/types/event";

/** Funkaari still lists events that include children 6 and under. */
export const AUDIENCE_MAX_YEARS = 6;

export function ageGroupsForRange(minYears: number, maxYears = AUDIENCE_MAX_YEARS): AgeGroup[] {
  const top = maxYears;
  const groups: AgeGroup[] = [];
  if (minYears < 1 && top >= 0.5) groups.push("6-12mo");
  if (minYears < 2 && top >= 1) groups.push("1-2yr");
  if (minYears < 3 && top >= 2) groups.push("2-3yr");
  if (minYears < 4 && top >= 3) groups.push("3-4yr");
  if (minYears <= 6 && top >= 4) groups.push("4-6yr");
  return groups;
}

export function parseAgeMention(text: string): {
  minYears: number;
  maxYears?: number;
  openEnded: boolean;
} | null {
  const monthsToYears = text.match(
    /(\d+)\s*m(?:o|onths?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:yo|yrs?|years?)?/i,
  );
  if (monthsToYears) {
    const minYears = Number(monthsToYears[1]) / 12;
    const maxYears = Number(monthsToYears[2]);
    if (minYears > AUDIENCE_MAX_YEARS) return null;
    return { minYears, maxYears, openEnded: false };
  }

  const range = text.match(
    /(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:yo|yrs?|years?)?/i,
  );
  const plus =
    text.match(/\b(?:ages?|aged)\s*(\d+(?:\.\d+)?)\s*\+/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)\b/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?\s+(?:and|&)\s+(?:up|above)\b/i) ||
    text.trim().match(/^(\d+(?:\.\d+)?)\s*\+$/);

  if (range) {
    const minYears = Number(range[1]);
    const maxYears = Number(range[2]);
    if (minYears > AUDIENCE_MAX_YEARS) return null;
    return { minYears, maxYears, openEnded: false };
  }

  if (plus) {
    const minYears = Number(plus[1]);
    if (Number.isNaN(minYears) || minYears > AUDIENCE_MAX_YEARS) return null;
    return { minYears, openEnded: true };
  }

  return null;
}

export function formatAgeRange(event: Pick<KidsEvent, "ageMinMonths" | "ageMaxYears">): string {
  const max = event.ageMaxYears;
  if (event.ageMinMonths < 12) {
    return max == null ? `${event.ageMinMonths} mo+` : `${event.ageMinMonths} mo – ${max} yrs`;
  }
  const minYears = Math.floor(event.ageMinMonths / 12);
  if (max == null) return `${minYears}+`;
  if (minYears === max) return `${minYears} yrs`;
  return `${minYears}–${max} yrs`;
}
