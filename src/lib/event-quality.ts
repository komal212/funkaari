import { instagramPostUrl } from "@/lib/instagram";
import type { EventCategory, KidsEvent } from "@/types/event";

function stripListingChrome(value: string): string {
  return value
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/@/g, " at ")
    .replace(
      /\s*[·|]\s*(thumpn|allevents|happeningnext|stayhappening|eventbrite)\b.*$/i,
      "",
    )
    .replace(/\s+is here!?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Clean card headings: no shouty caps, handles, or leftover caption chrome. */
export function displayEventTitle(title: string): string {
  let t = stripListingChrome(title);

  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length > 4 && letters === letters.toUpperCase()) {
    t = t.toLowerCase().replace(/(^|[\s/])[a-z]/g, (chunk) => chunk.toUpperCase());
  }

  return t.replace(/\s+/g, " ").trim();
}

const JUNK_DESCRIPTION =
  /\[\]\(|google calendar|outlook calendar|ical calendar|add to calendar|cozy craft session|profile picture|followers|happeningnext|stayhappening|thumpn|allevents/i;

export function displayEventDescription(event: KidsEvent): string {
  const title = displayEventTitle(event.title);
  let text = stripListingChrome(event.description || "")
    .replace(/\[([^\]]*)\]\((https?:\/\/[^)]*)\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    !text ||
    text.length < 20 ||
    JUNK_DESCRIPTION.test(text) ||
    /\bworkshop\s+\w[\w'’ ]{0,40}\s+workshop\b/i.test(text)
  ) {
    const place =
      event.area && !/^bengaluru|bangalore|delhi ncr$/i.test(event.area)
        ? ` in ${event.area}`
        : "";
    return `${title}${place}.`;
  }

  if (!/[.!?]$/.test(text)) text = `${text}.`;
  return text.slice(0, 160);
}

/** Headings scraped from directory pages, Instagram chrome, or truncated captions. */
export function isJunkTitle(title: string): boolean {
  const t = displayEventTitle(title);
  if (t.length < 8 || t.length > 72) return true;
  if (
    /followers|profile picture|open app|^allevents$|^highlights$|^sports$|^festivals$|^workshops$|^schedule$/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /list of all upcoming|kids events in bangalore|check out happening|happeningnext|section:/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^[*•\s]*[\d,]+\s*followers/i.test(t)) return true;
  if (/^(n us |ontessori|ssori|we offer children)/i.test(t)) return true;
  if (/may be an image of/i.test(t)) return true;
  if (/\.\.\.\s*-\s*allevents/i.test(t)) return true;
  if (/^[a-z]{1,4}\s/.test(t) && !/^(at|the|art|kids|new)\b/i.test(t)) return true;
  return false;
}

export function isOffBriefListing(event: KidsEvent): boolean {
  if (isJunkTitle(event.title)) return true;
  const title = displayEventTitle(event.title);
  const blob = `${title} ${event.description} ${event.organizer} ${event.bookingUrl || ""} ${event.website || ""}`;

  if (/\b(couple|date night|pichwai|crochet|garba|dandiya|zumba)\b/i.test(title)) {
    return true;
  }
  if (/\b(wheel pottery)\b/i.test(title) && !/\bkids?\b/i.test(title)) return true;
  if (/outgoing\.world|\boutgoing\b/i.test(blob) && !/\bkids?\b/i.test(title)) {
    return true;
  }
  if (/\bstem masters\b/i.test(title)) return true;
  if (/\btrek\b/i.test(title) && !/\bkids?\b/i.test(title) && !/mugilanchu/i.test(title)) {
    return true;
  }

  const live = /^(web-|ig-|task-)/.test(event.id);
  if (live) {
    const kidsish =
      /\b(kids?|child|children|toddler|preschool|playdate|play date|open house|circle time|story play|montessori)\b/i.test(
        title,
      );
    if (!kidsish) return true;
    if (JUNK_DESCRIPTION.test(event.description || "")) return true;
  }
  return false;
}

/** Aggregator city/category indexes — not a specific event page. */
export function isAggregatorIndexUrl(url?: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  if (/instagram\.com\/(?:p|reel|tv)\//i.test(u)) return false;
  if (/instagram\.com\/[a-z0-9._]+\/?(?:\?|$)/i.test(u)) return true;
  if (/allevents\.in\/[^/]+\/(?:kids|children|family|festivals)(?:--|$|\/|\?)/i.test(u)) {
    return true;
  }
  if (/allevents\.in\/[^/]+\/[a-z0-9-]+\/\d+/i.test(u)) return false;
  if (/allevents\.in\/[^/]+\/?(?:\?|$)/i.test(u)) return true;
  if (/allevents\.in\/.*open%20house/i.test(u)) return true;
  if (/stayhappening\.com\/[^/]*bangalore/i.test(u) && !/\/e\//i.test(u)) return true;
  if (/happeningnext\.com\/[^/]+\/kids/i.test(u)) return true;
  if (/eventbrite\.[^/]+\/d\//i.test(u)) return true;
  if (/bookmyshow\.com\/explore\//i.test(u)) return true;
  return false;
}

export function isTaskStillRunning(message?: string): boolean {
  if (!message) return false;
  return /408|still active|run still/i.test(message);
}

const COVER_BY_ID: Record<string, string> = {
  "playcove-rhino-pancakes": "/events/story-play.png",
  "mugilanchu-sunday-trek": "/events/sunday-trek.png",
  "aura-circle-time": "/events/circle-time.png",
  "allevents-clown-festival": "/events/around-the-world.png",
  "allevents-kids-baking-hobby-ghar": "/events/story-play.png",
  "forum-south-around-the-world": "/events/around-the-world.png",
  "prayag-open-house": "/events/prayag-open-house.png",
  "ekya-vana-open-house": "/events/ekya-vana-open-house.png",
  "eravoo-art-play-october": "/events/eravoo-art-play.png",
  "neev-literature-festival-2026": "/events/neev-literature-festival.png",
  "growing-wonders-open-house": "/events/growing-wonders-open-house.png",
  "looroo-ganesha-playdate": "/events/looroo-ganesha-playdate.png",
  "openhouse-ganesha-painting": "/events/openhouse-ganesha-painting.png",
  "green-venture-lalbagh-walk": "/events/lalbagh-nature-walk.png",
  "delhi-kidzania-open-house": "/events/kidzania-open-house.png",
  "delhi-joinin-hand-pottery": "/events/hand-pottery.png",
  "delhi-kidywidy-marathon": "/events/kidywidy-marathon.png",
  "delhi-joinin-lippan": "/events/lippan-art.png",
  "delhi-alive-clay-garden": "/events/clay-garden.png",
};

const COVER_BY_CODE: Record<string, string> = {
  Ddk_ypmgVKk: "/events/story-play.png",
  Ddl74RvEqGX: "/events/sunday-trek.png",
  Ddi6EEpgjE2: "/events/circle-time.png",
  DdjxfZWzyGg: "/events/little-beats.png",
  Dda3gUgkWj7: "/events/around-the-world.png",
  Ddnckl5T2XL: "/events/prayag-open-house.png",
  DdjGzV0SA8J: "/events/ekya-vana-open-house.png",
  "DdWQ--sqoTY": "/events/eravoo-art-play.png",
  "DdYkry6IY-j": "/events/neev-literature-festival.png",
  DdaYeISJrGy: "/events/growing-wonders-open-house.png",
  DdBm5sxBi_t: "/events/looroo-ganesha-playdate.png",
  DdJtleHH0kK: "/events/openhouse-ganesha-painting.png",
  DcgqY_KGjHq: "/events/lalbagh-nature-walk.png",
};

const COVER_BY_KIND: Record<EventCategory, string> = {
  workshop: "/events/story-play.png",
  camp: "/events/sunday-trek.png",
  "open day": "/events/prayag-open-house.png",
  sports: "/events/kidywidy-marathon.png",
  art: "/events/eravoo-art-play.png",
  music: "/events/little-beats.png",
  festival: "/events/around-the-world.png",
};

function localCover(url?: string): string | undefined {
  if (url && url.startsWith("/events/") && !url.includes("/posts/")) return url;
  return undefined;
}

function codeFromUrl(url?: string): string | undefined {
  const match = url?.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return match?.[1];
}

function coverFromTitle(title: string): string | undefined {
  const t = title.toLowerCase();
  if (/around the world|forum south/.test(t)) return "/events/around-the-world.png";
  if (/hobby ghar|story play|playcove|rhino/.test(t)) return "/events/story-play.png";
  if (/mugilanchu|ayana/.test(t)) return "/events/sunday-trek.png";
  if (/circle time|áura|aura montessori/.test(t)) return "/events/circle-time.png";
  if (/clown festival/.test(t)) return "/events/around-the-world.png";
  if (/kids baking|cupcake|hobby ghar/.test(t)) return "/events/story-play.png";
  if (/prayag/.test(t)) return "/events/prayag-open-house.png";
  if (/ekya|vana/.test(t)) return "/events/ekya-vana-open-house.png";
  if (/eravoo/.test(t)) return "/events/eravoo-art-play.png";
  if (/neev/.test(t)) return "/events/neev-literature-festival.png";
  if (/growing wonders/.test(t)) return "/events/growing-wonders-open-house.png";
  if (/looroo|ganesha playdate/.test(t)) return "/events/looroo-ganesha-playdate.png";
  if (/paint your own ganesha/.test(t)) return "/events/openhouse-ganesha-painting.png";
  if (/lalbagh|green venture/.test(t)) return "/events/lalbagh-nature-walk.png";
  if (/kidzania/.test(t)) return "/events/kidzania-open-house.png";
  if (/pottery/.test(t)) return "/events/hand-pottery.png";
  if (/marathon|kidywidy/.test(t)) return "/events/kidywidy-marathon.png";
  if (/lippan/.test(t)) return "/events/lippan-art.png";
  if (/clay garden/.test(t)) return "/events/clay-garden.png";
  return undefined;
}

/** Always a local illustration — never a missing image or Instagram flyer. */
export function coverForEvent(event: KidsEvent, kind: EventCategory): string {
  const fromId = COVER_BY_ID[event.id];
  if (fromId) return fromId;
  const fromFile = localCover(event.imageUrl);
  if (fromFile) return fromFile;
  const code =
    codeFromUrl(event.instagramUrl) ||
    codeFromUrl(event.bookingUrl) ||
    codeFromUrl(event.website);
  if (code && COVER_BY_CODE[code]) return COVER_BY_CODE[code];
  const fromTitle = coverFromTitle(`${event.title} ${event.organizer}`);
  if (fromTitle) return fromTitle;
  return COVER_BY_KIND[kind] || COVER_BY_KIND.workshop;
}

/** Clean blurb plus a local cover, for every listing. */
export function presentEvent(event: KidsEvent): KidsEvent {
  const title = displayEventTitle(event.title);
  const cleaned = { ...event, title };
  return {
    ...cleaned,
    description: displayEventDescription(cleaned),
    imageUrl: coverForEvent(cleaned, cleaned.category),
    instagramUrl: instagramPostUrl(cleaned) || cleaned.instagramUrl,
  };
}
