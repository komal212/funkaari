export type CityId = "bangalore" | "delhi";

export type EventCategory =
  | "workshop"
  | "camp"
  | "open day"
  | "sports"
  | "art"
  | "music"
  | "festival";

export type AgeGroup = "6-12mo" | "1-2yr" | "2-3yr" | "3-4yr" | "4-6yr";

export type BangaloreArea =
  | "Koramangala"
  | "Indiranagar"
  | "Whitefield"
  | "HSR Layout"
  | "Jayanagar"
  | "Bellandur"
  | "JP Nagar"
  | "Malleshwaram"
  | "Hebbal"
  | "Electronic City";

export type EventArea = string;

export interface KidsEvent {
  id: string;
  title: string;
  date: string;
  /** Last day for multi-day events. After this date the listing is removed. */
  endDate?: string;
  /** Drop-in / repeating workshop with no single calendar date. */
  ongoing?: boolean;
  time: string;
  city: CityId;
  area: EventArea;
  venue: string;
  ageMinMonths: number;
  /** Omit when the source only says 3+ / 5+ — do not invent an upper age. */
  ageMaxYears?: number;
  ageGroups: AgeGroup[];
  category: EventCategory;
  organizer: string;
  description: string;
  /** Instagram username without @ — opens a real profile page. */
  instagramHandle: string;
  /** Cover photo for the card (Instagram display image). */
  imageUrl?: string;
  /** Instagram post URL. Cards only open this when it is a real /p/ or /reel/ link. */
  instagramUrl?: string;
  instagramCaption?: string;
  fromInstagram?: boolean;
  bookingUrl?: string;
  website?: string;
  isFree: boolean;
  price?: string;
}

export type TimeFilter = "all" | "this-week" | "this-weekend";

export type PlaceFilter = "all" | "offline" | "online";

export interface EventFilters {
  search: string;
  ageGroup: AgeGroup | "all";
  area: EventArea | "all";
  time: TimeFilter;
  place: PlaceFilter;
}
