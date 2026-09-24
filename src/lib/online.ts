/** Dated live kids sessions parents can join from home. */
export const ONLINE_SESSION =
  /\b(online|virtual|zoom|google\s*meet|gmeet|ms\s*teams|webinar|join\s+from\s+home|from\s+home|live\s+on\s+zoom)\b/i;

const INDIA_TIME =
  /\b(india|indian|ist|gmt\s*\+?\s*5:?30|₹|rs\.?|inr|bangalore|bengaluru|delhi|noida|gurugram)\b/i;

export function isOnlineSession(text: string): boolean {
  return ONLINE_SESSION.test(text);
}

/** Online kids listing that Bengaluru parents can actually join (India / IST / ₹). */
export function isIndiaOnlineSession(text: string): boolean {
  return isOnlineSession(text) && INDIA_TIME.test(text);
}

export function eventIsOnline(event: {
  area?: string;
  venue?: string;
  title?: string;
  description?: string;
}): boolean {
  if (/^online$/i.test(event.area || "") || /^online$/i.test(event.venue || "")) {
    return true;
  }
  return isOnlineSession(
    `${event.area || ""} ${event.venue || ""} ${event.title || ""} ${event.description || ""}`,
  );
}
