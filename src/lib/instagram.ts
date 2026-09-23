/** Build working Instagram web URLs (www.instagram.com). */

export const FUNKAARI_INSTAGRAM_HANDLE = "funkaari.in";
export const FUNKAARI_INSTAGRAM_URL = `https://www.instagram.com/${FUNKAARI_INSTAGRAM_HANDLE}/`;

export function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim();
}

export function instagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${normalizeHandle(handle)}/`;
}

export function instagramSearchUrl(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://www.instagram.com/explore/search/keyword/?q=${q}`;
}

export function isInstagramPostUrl(url: string): boolean {
  return /instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i.test(url);
}

function asPostUrl(url?: string): string | undefined {
  if (!url || !isInstagramPostUrl(url)) return undefined;
  return url;
}

/** First real Instagram /p/ or /reel/ link on the listing. */
export function instagramPostUrl(event: {
  instagramUrl?: string;
  bookingUrl?: string;
  website?: string;
}): string | undefined {
  return (
    asPostUrl(event.instagramUrl) ||
    asPostUrl(event.bookingUrl) ||
    asPostUrl(event.website)
  );
}

export function eventInstagramUrl(event: {
  instagramHandle: string;
  instagramUrl?: string;
  imageUrl?: string;
  bookingUrl?: string;
  website?: string;
}): string {
  return instagramPostUrl(event) || instagramProfileUrl(event.instagramHandle);
}

/** True only for a real /p/ or /reel/ link — never a profile page. */
export function eventHasInstagramPost(event: {
  instagramHandle: string;
  instagramUrl?: string;
  imageUrl?: string;
  bookingUrl?: string;
  website?: string;
}): boolean {
  return Boolean(instagramPostUrl(event));
}

export function eventInstagramCta(event: {
  instagramHandle: string;
  instagramUrl?: string;
  bookingUrl?: string;
  website?: string;
}): { href: string; label: string } | null {
  const post = instagramPostUrl(event);
  if (post) {
    return { href: post, label: "Open post on Instagram" };
  }
  const handle = normalizeHandle(event.instagramHandle || "");
  if (handle && handle !== "instagram") {
    return { href: instagramProfileUrl(handle), label: "Open on Instagram" };
  }
  return null;
}
