import type {
  AgeGroup,
  BangaloreArea,
  EventCategory,
  KidsEvent,
} from "@/types/event";
import { isInstagramPostUrl, normalizeHandle } from "@/lib/instagram";
import { isUpcomingEvent } from "@/lib/event-date";
import { AUDIENCE_MAX_YEARS, ageGroupsForRange, parseAgeMention } from "@/lib/age";
import { isIndiaOnlineSession, isOnlineSession } from "@/lib/online";
import { KIDS_EVENT_KIND } from "@/lib/kids-event";
import { areaFromText } from "@/lib/bangalore-area";

export interface InstagramMedia {
  id: string;
  caption?: string;
  permalink?: string;
  timestamp?: string;
  username?: string;
  displayUrl?: string;
}

const OLDER_KID =
  /\b(7|8|9|10|11|12|13|14|15|16)\s*[-–]?\s*(years?|yrs?|yo)\b/i;
const TEEN = /\b(teen|tweens?|grade\s*[5-9]|class\s*[5-9])\b/i;

const BABY_TODDLER =
  /\b(baby|babies|infant|toddler|preschool|pre-?k|playschool|kindergarten|montessori|6\s*m(?:o|onths?)|under\s*6|0\s*[-–]\s*6|1\s*[-–]\s*6|2\s*[-–]\s*6|3\s*[-–]\s*6)\b/i;

const BLR =
  /\b(bangalore|bengaluru|blr|koramangala|indiranagar|whitefield|hsr|jayanagar|bellandur|jp\s*nagar|malleshwaram|malleswaram|hebbal|electronic\s*city|sarjapur|marathahalli|padmanabhanagar)\b/i;

/** Organisers we have already placed in Bengaluru — captions often skip the city. */
const BANGALORE_ACCOUNTS: Record<string, BangaloreArea> = {
  "prayag.montessori": "JP Nagar",
  play_cove: "Malleshwaram",
  forumsouthbengaluru: "JP Nagar",
  the_two_messy_hands: "Koramangala",
  littlebeatsfestival: "Jayanagar",
  ayanaoutdoorsindia: "Koramangala",
  auramontessori0823: "Koramangala",
  "ekyavana.earlyyears": "Hebbal",
  "eravoo.blr": "Jayanagar",
  beruearlyyears: "Jayanagar",
  acemontessori: "Jayanagar",
  thefreethinkingschool: "Koramangala",
  kara4kidsofficial: "Koramangala",
  jumpstartpreschools: "Koramangala",
  klaypreschools: "Whitefield",
  kangarookidspreschool_official: "Koramangala",
  juniortoes_nagarabhavi: "Malleshwaram",
  "footprints.preschool": "Bellandur",
  vivero_international: "Whitefield",
  neevearlyyears: "Koramangala",
  cherubs_montessori_sompura: "Whitefield",
  _chimes_montessori: "Koramangala",
  cubbytales: "Koramangala",
  boogiewoogiepreschool: "Koramangala",
  airaa_academy: "Jayanagar",
  incarnation_foundation_school: "Koramangala",
  "openhouse.school": "HSR Layout",
  growingwonders_official: "Jayanagar",
  neevliteraturefestival: "Bellandur",
  "kai.early.years": "Whitefield",
  kovebyklay: "Whitefield",
  juniortoes_jpnagar_metro_st: "JP Nagar",
  "eurokids.nagarbhavi": "Malleshwaram",
  littleelly_vijaynagar: "Malleshwaram",
  little_millennium_nallurhalli: "Whitefield",
  arka_learning_space: "Hebbal",
  agreenventurenaturewalks: "Malleshwaram",
  theloorooclub: "Koramangala",
  montivypreschools: "Whitefield",
  paperbirdmalini: "Koramangala",
  popapuddle: "HSR Layout",
};

function knownBangaloreArea(caption: string, username?: string): BangaloreArea | undefined {
  const handle = username ? normalizeHandle(username) : "";
  if (handle && BANGALORE_ACCOUNTS[handle]) return BANGALORE_ACCOUNTS[handle];
  const mentions = caption.match(/@([A-Za-z0-9._]+)/g) || [];
  for (const mention of mentions) {
    const name = normalizeHandle(mention);
    if (BANGALORE_ACCOUNTS[name]) return BANGALORE_ACCOUNTS[name];
  }
  return undefined;
}

function detectArea(text: string, username?: string): string {
  if (isOnlineSession(text)) return "Online";
  return areaFromText(text) || knownBangaloreArea(text, username) || "Bengaluru";
}

function detectCategory(text: string): EventCategory {
  const t = text.toLowerCase();
  if (/\b(workshop|circle time|playdate|play date|story play)\b/.test(t)) return "workshop";
  if (/open\s*(day|house)/.test(t)) return "open day";
  if (/\b(camp|trek)\b/.test(t)) return "camp";
  if (/football|soccer|gym|sports|cricket/.test(t)) return "sports";
  if (/art|clay|paint|craft|colour/.test(t)) return "art";
  if (/music|dance|bollywood|rhythm|song|beats/.test(t)) return "music";
  if (/festival|dussehra|diwali|christmas|holi/.test(t)) return "festival";
  return "workshop";
}

function detectAgeGroups(text: string): AgeGroup[] {
  const groups = new Set<AgeGroup>();
  const t = text.toLowerCase();
  if (/6\s*m|infant|baby|newborn|sign language/.test(t)) groups.add("6-12mo");
  if (/1\s*[-–]\s*2|12\s*m|one year|1 year|toddler/.test(t)) groups.add("1-2yr");
  if (/2\s*[-–]\s*3|2 year|two year/.test(t)) groups.add("2-3yr");
  if (/3\s*[-–]\s*4|3 year|pre-?k|preschool/.test(t)) groups.add("3-4yr");
  if (/4\s*[-–]\s*6|5 year|6 year|kindergarten/.test(t)) groups.add("4-6yr");
  if (groups.size === 0 && BABY_TODDLER.test(text)) {
    groups.add("1-2yr");
    groups.add("2-3yr");
    groups.add("3-4yr");
  }
  return [...groups];
}

function detectVenue(caption: string, area: string): string {
  if (area === "Online" || isOnlineSession(caption)) {
    return "Online";
  }
  const pin = caption.match(/📍\s*([^\n#]+)/);
  if (pin?.[1]) return pin[1].replace(/@\w+/g, "").trim().slice(0, 80);
  const at = caption.match(/\bat\s+([^.,\n]{8,60})/i);
  if (at?.[1] && !/bangalore|bengaluru/i.test(at[1])) return at[1].trim();
  return area;
}

function tidyLine(line: string): string {
  return line
    .replace(/[#@].*$/g, "")
    .replace(/[✨‼️❗🎉🌿🤍💛]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseWords(text: string): string {
  return text
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (/^(at|vs|and|or|the)$/i.test(word)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(/^at /, "At ");
}

export function eventTitleFromCaption(caption: string): string {
  const circle = caption.match(
    /circle time(?:\s+workshop)?(?:\s+at\s+[A-Za-zÁá][\w'’&.\- ]{2,40})?/i,
  );
  if (circle) return titleCaseWords(circle[0].trim());

  const named = caption.match(
    /\b([A-Z][A-Za-z0-9'’&.\- ]{2,40}?)\s+(workshop|playdate|festival|trek|camp|class)\b/i,
  );
  if (named) return titleCaseWords(named[0]);

  const skip = /alert|admissions?|enrol|dm us|limited spots|register|date:|venue:|file picture|oh yess/i;
  const line =
    caption
      .split("\n")
      .map(tidyLine)
      .find((l) => l.length > 8 && l.length < 70 && !skip.test(l)) ?? tidyLine(caption).slice(0, 60);

  return line.replace(/\s+/g, " ").slice(0, 62);
}

export function shortEventBlurb(caption: string): string {
  const withoutMeta = caption
    .replace(/upcoming workshop alert[!！]*/gi, " ")
    .replace(/date:\s*[^.\n]+/gi, " ")
    .replace(/venue:\s*@?\w+/gi, " ")
    .replace(/limited spots[|. ]*/gi, " ")
    .replace(/dm (to know more|us)[!.]*/gi, " ")
    .replace(/register soon[!.]*/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/#[\w]+/g, " ")
    .replace(/📍[^\n]+/g, " ")
    .replace(/📅[^\n]+/g, " ")
    .replace(/⏰[^\n]+/g, " ")
    .replace(/🎟️[^\n]+/g, " ");

  const activity = withoutMeta.match(
    /((?:paint|craft|sing|dance|stor(?:y|ies)|sensory|trek|music|play)[^.]{10,110})/i,
  );
  const raw = (activity?.[1] || withoutMeta.split("\n").map(tidyLine).find((l) => l.length > 24) || "")
    .replace(/\s+/g, " ")
    .trim();

  if (raw.length < 12) return "A kids event in Bangalore. See the Instagram post for details.";
  const sentence = raw.charAt(0).toUpperCase() + raw.slice(1);
  return (sentence.endsWith(".") ? sentence : `${sentence}.`).slice(0, 140);
}

const ACTIVITY = KIDS_EVENT_KIND;

const ADMISSION =
  /\b(admissions?\s*open|enrol(?:l)?(?:\s+today)?|limited seats|nursery admissions|preschool admissions)\b/i;

export function captionHasEventDate(caption: string): boolean {
  return Boolean(
    caption.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
    ) ||
      caption.match(
        /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
      ),
  );
}

export function isBangaloreKidsEventCaption(
  caption: string,
  username?: string,
): boolean {
  if (!caption.trim()) return false;
  if (/followers|profile picture|may be an image of/i.test(caption)) return false;
  if (/\b(garba|dandiya|zumba)\b/i.test(caption)) return false;
  if (ADMISSION.test(caption) && !ACTIVITY.test(caption)) return false;
  if (TEEN.test(caption) && !BABY_TODDLER.test(caption)) return false;
  if (OLDER_KID.test(caption) && !BABY_TODDLER.test(caption)) return false;
  if (!BLR.test(caption) && !knownBangaloreArea(caption, username) && !isIndiaOnlineSession(caption)) {
    return false;
  }
  if (!ACTIVITY.test(caption)) return false;
  if (!captionHasEventDate(caption)) return false;
  return BABY_TODDLER.test(caption) || ACTIVITY.test(caption);
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function monthIndex(raw: string): number | undefined {
  const key = raw.toLowerCase();
  if (key in MONTH_INDEX) return MONTH_INDEX[key];
  return MONTH_INDEX[key.slice(0, 3)];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatClock(hour12: number, minute: string | undefined, ampm: string): string {
  const mins = minute ?? "00";
  const suffix = ampm.toUpperCase();
  return `${hour12}:${mins} ${suffix}`;
}

export function parseCaptionSchedule(
  caption: string,
  fallbackIso?: string,
): { date: string; time: string } {
  const yearMatch = caption.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();

  const dmy = caption.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  );
  const mdy = caption.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );

  let day: number | undefined;
  let month: number | undefined;
  if (dmy) {
    day = Number(dmy[1]);
    month = monthIndex(dmy[2]);
  } else if (mdy) {
    month = monthIndex(mdy[1]);
    day = Number(mdy[2]);
  }

  const range = caption.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*(?:to|–|-|—)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
  );
  const time = range
    ? `${formatClock(Number(range[1]), range[2], range[3])} – ${formatClock(Number(range[4]), range[5], range[6])}`
    : "See post";

  if (day && month !== undefined && day >= 1 && day <= 31) {
    const hour = range ? Number(range[1]) % 12 + (/pm/i.test(range[3]) ? 12 : 0) : 10;
    const minute = range?.[2] ? Number(range[2]) : 0;
    return {
      date: `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`,
      time,
    };
  }

  return { date: fallbackIso || new Date().toISOString(), time };
}

export function mediaToEvent(media: InstagramMedia): KidsEvent | null {
  const caption = media.caption?.trim() ?? "";
  if (!isBangaloreKidsEventCaption(caption, media.username)) return null;

  const mentioned = parseAgeMention(caption);
  const ageGroups = mentioned
    ? ageGroupsForRange(mentioned.minYears, mentioned.maxYears ?? AUDIENCE_MAX_YEARS)
    : detectAgeGroups(caption);
  if (!ageGroups.length) return null;

  const handle = normalizeHandle(media.username || "instagram");
  const permalink = media.permalink && isInstagramPostUrl(media.permalink)
    ? media.permalink
    : undefined;
  const area = detectArea(caption, media.username);
  const when = parseCaptionSchedule(caption, media.timestamp);
  if (!isUpcomingEvent({ date: when.date })) return null;

  return {
    id: `ig-${media.id}`,
    title: eventTitleFromCaption(caption),
    date: when.date,
    time: when.time,
    area,
    venue: detectVenue(caption, area),
    ageMinMonths: mentioned
      ? Math.round(mentioned.minYears * 12)
      : ageGroups.includes("6-12mo")
        ? 6
        : 12,
    ageMaxYears: mentioned && !mentioned.openEnded ? mentioned.maxYears : undefined,
    ageGroups,
    category: detectCategory(caption),
    organizer: handle,
    description: shortEventBlurb(caption),
    instagramHandle: handle,
    instagramUrl: permalink,
    instagramCaption: caption,
    fromInstagram: true,
    city: "bangalore",
    isFree: /\bfree\b/i.test(caption),
  };
}

export const INSTAGRAM_HASHTAGS = [
  "bangalorekids",
  "bangaloretoddlers",
  "kidsinbangalore",
  "bangalorepreschool",
  "toddlerbangalore",
  "preschoolbangalore",
  "bangalorekidsactivities",
];
