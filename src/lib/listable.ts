import type { KidsEvent } from "@/types/event";
import { isUpcomingEvent } from "@/lib/event-date";
import { eventHasInstagramPost } from "@/lib/instagram";
import {
  isAggregatorIndexUrl,
  isOffBriefListing,
} from "@/lib/event-quality";

function hasEventPage(event: KidsEvent): boolean {
  if (eventHasInstagramPost(event)) return true;
  if (event.bookingUrl && !isAggregatorIndexUrl(event.bookingUrl)) return true;
  if (event.website && !isAggregatorIndexUrl(event.website)) return true;
  return false;
}

/** A listing needs a real title, a date that has not passed, and a booking page, website, or Instagram post. Past events drop off the diary — do not keep a Just got over section. */
export function eventIsListable(event: KidsEvent): boolean {
  if (!isUpcomingEvent(event)) return false;
  if (isOffBriefListing(event)) return false;
  return hasEventPage(event);
}
