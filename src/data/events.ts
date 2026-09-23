import type { KidsEvent } from "@/types/event";
import { buildTwoMonthCalendar } from "@/data/calendar";
import { delhiEvents } from "@/data/delhi-calendar";

/** Dated workshops / playdates / festivals for the next two months. */
export const events: KidsEvent[] = buildTwoMonthCalendar();

export { delhiEvents };

export const AGE_GROUP_LABELS: Record<string, string> = {
  "6-12mo": "6–12 months",
  "1-2yr": "1–2 years",
  "2-3yr": "2–3 years",
  "3-4yr": "3–4 years",
  "4-6yr": "4–6 years",
};

export const CATEGORY_LABELS: Record<string, string> = {
  workshop: "Workshop",
  camp: "Camp",
  "open day": "Open Day",
  sports: "Sports",
  art: "Art",
  music: "Music",
  festival: "Festival",
};

export const AREAS = [
  "Koramangala",
  "Indiranagar",
  "Whitefield",
  "HSR Layout",
  "Jayanagar",
  "Bellandur",
  "JP Nagar",
  "Malleshwaram",
  "Hebbal",
  "Electronic City",
] as const;
