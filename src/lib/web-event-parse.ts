import type { AgeGroup, CityId, EventCategory, KidsEvent } from "@/types/event";
import { parseCaptionSchedule } from "@/lib/instagram-parse";
import { isUpcomingEvent } from "@/lib/event-date";
import { AUDIENCE_MAX_YEARS, ageGroupsForRange, parseAgeMention } from "@/lib/age";
import { isIndiaOnlineSession, isOnlineSession } from "@/lib/online";

const SKIP =
  /\b(motorcycle|letsryde|yog nidra|sound immersion|photography exhibition|networking|masterclass|corporate outing|catan|kitty party|visitor registration|palette infinito|click trickk|salsa|flower arrangement|mug painting|mandala|embroidery|botanical watercolor|linocut|gond art|paint and stitch|stand-?up|comedy night|jamming|pub crawl|club night|90s vs|couple pottery|pichwai|crochet|outgoing)\b/i;

const ADULT_EVENT =
  /\b(dandiya|garba|zumba|zumbathon|namma run|wipro .*marathon|gayana samaja|i am worth it|mentorshop|k–12|k-12 schools for parents|pub crawl|club night|stand-?up|comedy night|room of memories|cloud temple|united zumbathon|music marathon|free fitness)\b/i;

const JUNK_TITLE =
  /^(what are|about the event|explore events|file picture|date\b|event\b|venue\b|\||here are|things to do|all events that|no comments|frequently asked|free$)|[?]$/i;

function usableTitle(title: string): boolean {
  const text = title.replace(/^#+\s*/, "").trim();
  if (!text || text.length < 6 || text.length > 80) return false;
  if (JUNK_TITLE.test(text)) return false;
  if (/ssori|no comments yet|things to do in|all events that you vibe|^free$/i.test(text)) {
    return false;
  }
  if (/[)\]]{2}|^\W/.test(text)) return false;
  return true;
}

const WEEKLY_CLASS =
  /\b(every\s+(mon|tue|wed|thu|fri)|mon(?:day)?,\s*wed|tue-?\s*sun|regular classes|monthly \d+ class|phonics classes - online|weekend:\s*sunday|\d+\s*week course)\b/i;

const KIDS =
  /\b(kids?|child(?:ren)?|toddler|preschool|kidzania|kidywidy|playdate|open house|years?\s*old|\d+\s*[-–]\s*\d+\s*(?:yo|yrs?|years)|ages?\s*\d)\b/i;

const KIDS_ACTIVITY = /\b(lippan|hand pottery|kids special|story ?time|sensory|messy play|circle time|workshop|festival|playdate|pottery|story play)\b/i;

const DELHI_PLACE =
  /\b(delhi|ncr|noida|gurgaon|gurugram|pitampura|malviya|vasant|nizamuddin|india gate|kartavya|hauz khas|gk-?1|gk-?2|greater kailash|jor bagh|friends colony|ambience mall|nehru place)\b/i;

const DELHI_HOST =
  /joinin|alive|kidywidy|kidzania|sundernursery|wonderlab|scienceomania|gameonboard|bachpan|claycompany|earthenaura|clayingthoughts|district\.in|taabur/i;

const BLR_PLACE =
  /\b(bangalore|bengaluru|blr|koramangala|indiranagar|whitefield|hsr|jayanagar|bellandur|jp\s*nagar|malleshwaram|malleswaram|hebbal|electronic\s*city|sarjapur|marathahalli|sheshadripuram|padmanabhanagar)\b/i;

const HANDLES: Record<string, string> = {
  JoinIn: "joinin.co.in",
  "Alive Studio": "alivestudio.in",
  "KidZania Delhi NCR": "kidzaniaindia",
  KidyWidy: "kidywidy",
  "Sunder Nursery": "sundernursery",
  "Game On Board": "gameonboard.in",
  "Bachpan Unplugged": "bachpanunplugged",
  WonderLab: "wonderlab",
};

type HeadingBlock = { heading: string; before: string; after: string };

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function parseAge(
  text: string,
): { minMonths: number; maxYears?: number; groups: AgeGroup[] } | null {
  const mentioned = parseAgeMention(text);
  const kids = /\b(kids?|child(?:ren)?)\b/i.test(text);
  const minYears = mentioned?.minYears ?? (kids ? 2 : 3);
  if (minYears > AUDIENCE_MAX_YEARS) return null;

  const openEnded = mentioned ? mentioned.openEnded : true;
  const maxYears = openEnded ? undefined : mentioned?.maxYears;
  const groups = ageGroupsForRange(minYears, maxYears ?? AUDIENCE_MAX_YEARS);
  if (!groups.length) return null;
  return { minMonths: Math.round(minYears * 12), maxYears, groups };
}

function detectCategory(text: string): EventCategory {
  const t = text.toLowerCase();
  if (/pottery|clay|art|paint|craft|lippan|mosaic|canvas/.test(t)) return "art";
  if (/marathon|run|race|gym/.test(t)) return "sports";
  if (/kidzania|open house|festival/.test(t)) return "festival";
  if (/music|dance|piano|sing/.test(t)) return "music";
  if (/camp|farm|garden/.test(t)) return "camp";
  return "workshop";
}

function defaultArea(organizer: string, detected: string): string {
  if (detected !== "Delhi NCR") return detected;
  if (organizer === "Alive Studio") return "Vasant Kunj";
  if (organizer === "KidZania Delhi NCR") return "Noida";
  return detected;
}

function detectArea(text: string, city: CityId): string {
  if (isOnlineSession(text)) return "Online";
  const t = text.toLowerCase();
  if (city === "bangalore") {
    if (/koramangala/.test(t)) return "Koramangala";
    if (/indiranagar/.test(t)) return "Indiranagar";
    if (/whitefield/.test(t)) return "Whitefield";
    if (/hsr/.test(t)) return "HSR Layout";
    if (/jayanagar/.test(t)) return "Jayanagar";
    if (/bellandur|sarjapur/.test(t)) return "Bellandur";
    if (/jp\s*nagar|padmanabhanagar/.test(t)) return "JP Nagar";
    if (/mallesh?waram|sheshadripuram/.test(t)) return "Malleshwaram";
    if (/hebbal/.test(t)) return "Hebbal";
    if (/electronic\s*city/.test(t)) return "Electronic City";
    return "Bengaluru";
  }
  if (/noida/.test(t)) return "Noida";
  if (/gurgaon|gurugram/.test(t)) return "Gurugram";
  if (/pitampura/.test(t)) return "Pitampura";
  if (/malviya/.test(t)) return "Malviya Nagar";
  if (/vasant kunj/.test(t)) return "Vasant Kunj";
  if (/vasant vihar/.test(t)) return "Vasant Vihar";
  if (/nizamuddin|sunder nursery/.test(t)) return "Nizamuddin";
  if (/india gate|kartavya/.test(t)) return "Central Delhi";
  if (/hauz khas/.test(t)) return "Hauz Khas";
  if (/gk-?1|greater kailash/.test(t)) return "Greater Kailash";
  if (/jor bagh/.test(t)) return "Jor Bagh";
  if (/friends colony/.test(t)) return "New Friends Colony";
  if (/nehru place/.test(t)) return "Nehru Place";
  return "Delhi NCR";
}

function organizerFromUrl(url: string): string {
  const host = url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  if (host.includes("joinin")) return "JoinIn";
  if (host.includes("alive")) return "Alive Studio";
  if (host.includes("kidywidy")) return "KidyWidy";
  if (host.includes("kidzania") || host.includes("district.in")) return "KidZania Delhi NCR";
  if (host.includes("sundernursery")) return "Sunder Nursery";
  if (host.includes("wonderlab")) return "WonderLab";
  if (host.includes("scienceomania")) return "Science-O-Mania";
  if (host.includes("gameonboard")) return "Game On Board";
  if (host.includes("bachpan")) return "Bachpan Unplugged";
  if (host.includes("claycompany")) return "The Clay Company";
  if (host.includes("earthenaura")) return "Earthen Aura Ceramics";
  if (host.includes("taabur")) return "Fun With Clay";
  if (host.includes("clayingthoughts")) return "Claying Thoughts";
  return host.split(".")[0];
}

function nextWeekday(targetDay: number, hour = 15, minute = 0): Date {
  const now = new Date();
  const next = new Date(now);
  let delta = (targetDay - now.getDay() + 7) % 7;
  if (delta === 0) {
    const passed =
      now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
    if (passed) delta = 7;
  }
  next.setDate(now.getDate() + delta);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function clockFrom(line: string): { hour: number; minute: number; label: string } | null {
  const match = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (/pm/i.test(match[3]) && hour < 12) hour += 12;
  if (/am/i.test(match[3]) && hour === 12) hour = 0;
  return { hour, minute, label: match[0].toUpperCase() };
}

function weekdaySchedule(line: string): { date: string; time: string } | null {
  const sat = /\bsat(?:urday)?\b/i.test(line);
  const sun = /\bsun(?:day)?\b/i.test(line);
  if (!sat && !sun) return null;
  const clock = clockFrom(line);
  const hour = clock?.hour ?? 15;
  const minute = clock?.minute ?? 0;
  const when = nextWeekday(sat ? 6 : 0, hour, minute);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(hour)}:${pad(minute)}:00+05:30`,
    time: clock?.label || (sat ? "Saturday" : "Sunday"),
  };
}

function hasNamedDate(text: string): boolean {
  return (
    /\b20\d{2}-\d{2}-\d{2}\b/.test(text) ||
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(
      text,
    ) ||
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i.test(
      text,
    )
  );
}

function isoSchedule(text: string): { date: string; time: string } | null {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (!iso) return null;
  const clock = clockFrom(text);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (!clock) return { date: `${iso[1]}T10:00:00+05:30`, time: "See listing" };
  return {
    date: `${iso[1]}T${pad(clock.hour)}:${pad(clock.minute)}:00+05:30`,
    time: clock.label,
  };
}

function scheduleFrom(block: string): { date: string; time: string } | null {
  if (WEEKLY_CLASS.test(block)) return null;
  const iso = isoSchedule(block);
  if (iso && !/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(block)) {
    return iso;
  }
  if (hasNamedDate(block)) {
    const named = parseCaptionSchedule(block);
    const clock = clockFrom(block);
    if (!clock) return named;
    const ymd = named.date.slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      date: `${ymd}T${pad(clock.hour)}:${pad(clock.minute)}:00+05:30`,
      time: clock.label,
    };
  }
  return weekdaySchedule(block);
}

function priceFrom(block: string): { isFree: boolean; price?: string } {
  if (/\b(free|rs\.?\s*0)\b/i.test(block)) return { isFree: true };
  const rupee = block.match(/₹\s*[\d,]+(?:\+)?/);
  if (rupee) return { isFree: false, price: rupee[0].replace(/\s+/g, "") };
  const rs = block.match(/Rs\.?\s*([\d,]+)/i);
  if (rs) return { isFree: false, price: `₹${rs[1]}` };
  return { isFree: false };
}

function bookingFrom(block: string, fallback: string): string {
  const md = block.match(/\((https?:\/\/[^\s)]+)\)/);
  if (md?.[1]) return md[1];
  const raw = block.match(/https?:\/\/[^\s)]+/);
  return raw?.[0] || fallback;
}

function headingBlocks(markdown: string): HeadingBlock[] {
  const lines = markdown.split(/\n/);
  const blocks: HeadingBlock[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^#{1,3}\s+(.+)/);
    if (!heading) continue;
    blocks.push({
      heading: heading[1].replace(/\*+/g, "").trim(),
      before: lines.slice(Math.max(0, i - 4), i).join("\n"),
      after: lines.slice(i + 1, i + 8).join("\n"),
    });
  }
  return blocks;
}

function tidyTitle(line: string): string {
  return line.replace(/^#{1,3}\s+/, "").replace(/\*+/g, "").trim();
}

function looksLikeTitle(line: string): boolean {
  const title = tidyTitle(line);
  if (!title || title.length < 4 || title.length > 80) return false;
  if (/^(rs\.|₹|book |http|#|\.\.\.)/i.test(title)) return false;
  if (hasNamedDate(title) || /^(sat|sun)(?:urday|day)?\b/i.test(title)) return false;
  return true;
}

function tableBlocks(markdown: string): HeadingBlock[] {
  const blocks: HeadingBlock[] = [];
  for (const line of markdown.split("\n")) {
    if (!line.includes("|")) continue;
    const cells = line.split("|").map((cell) => cell.replace(/\*+/g, "").trim()).filter(Boolean);
    if (cells.length < 2) continue;
    if (/^date$/i.test(cells[0]) && /event/i.test(cells[1] || "")) continue;
    const dateCell = cells.find((cell) => hasNamedDate(cell));
    const titleCell = cells.find(
      (cell) => looksLikeTitle(cell) && !hasNamedDate(cell) && !JUNK_TITLE.test(cell),
    );
    if (!dateCell || !titleCell) continue;
    blocks.push({
      heading: titleCell,
      before: dateCell,
      after: cells.join(" | "),
    });
  }
  return blocks;
}

function linkBlocks(markdown: string): HeadingBlock[] {
  const lines = markdown.split("\n");
  const blocks: HeadingBlock[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const nearby = [lines[i - 1], lines[i], lines[i + 1]].filter(Boolean).join("\n");
    if (!hasNamedDate(nearby)) continue;
    const links = [...lines[i].matchAll(/\[([^\]]{6,80})\]\((https?:\/\/[^)\s]+)\)/g)];
    for (const match of links) {
      const title = match[1].replace(/\*+/g, "").trim();
      if (!looksLikeTitle(title) || JUNK_TITLE.test(title)) continue;
      if (/\/(kids|child|children|family)\/?(\?|$)/i.test(match[2])) continue;
      blocks.push({
        heading: title,
        before: nearby,
        after: match[2],
      });
    }
  }
  return blocks;
}
function dateLeadBlocks(markdown: string): HeadingBlock[] {
  const lines = markdown.split(/\n/).map((line) => line.trim());
  const blocks: HeadingBlock[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const dated =
      hasNamedDate(line) || /\b(sat|sun)(?:urday|day)?\b/i.test(line);
    if (!dated) continue;
    const prev = tidyTitle(lines[i - 1] || "");
    const next = tidyTitle(lines[i + 1] || "");
    const title = looksLikeTitle(prev) ? prev : next;
    if (!looksLikeTitle(title)) continue;
    blocks.push({
      heading: title,
      before: line,
      after: lines.slice(i + 1, i + 7).join("\n"),
    });
  }
  return blocks;
}

export function parseWebEvents(
  markdown: string,
  sourceUrl: string,
  city: CityId = "delhi",
): KidsEvent[] {
  const events: KidsEvent[] = [];
  const organizer = organizerFromUrl(sourceUrl);
  const seen = new Set<string>();
  const blocks = [
    ...headingBlocks(markdown),
    ...dateLeadBlocks(markdown),
    ...tableBlocks(markdown),
    ...linkBlocks(markdown),
  ];

  for (const block of blocks) {
    const blob = `${block.before}\n${block.heading}\n${block.after}`;
    const heading = block.heading.replace(/^#+\s*/, "").trim();
    if (SKIP.test(blob) || SKIP.test(heading) || JUNK_TITLE.test(heading) || !usableTitle(heading)) {
      continue;
    }
    if (city === "bangalore" && /outgoing\.world/i.test(sourceUrl)) continue;
    const kidsHeading =
      /\b(kids?|child|children|toddler|preschool|playdate|open house|circle time|story play|montessori|klaydate|clown festival|little beats)\b/i.test(
        heading,
      );
    const alleventsYoung =
      /allevents\.in\/[^/]+\/(?!kids(?:--|\/|$)|children(?:--|\/|$)|family(?:--|\/|$))[a-z0-9-]+\/\d+/i.test(
        sourceUrl,
      ) && /age limit\s*-?\s*[0-6]\b/i.test(blob);
    if (city === "bangalore" && !kidsHeading && !alleventsYoung && !isIndiaOnlineSession(`${heading}\n${blob}`)) {
      continue;
    }
    if (ADULT_EVENT.test(heading) && !/\bkids?\b/i.test(heading)) continue;
    if (
      /^(about the venue|founder's story|follow the fun|opening times|weekend experiences)$/i.test(
        heading,
      )
    ) {
      continue;
    }
    const kidsPage = /allevents\.in\/bangalore\/(kids|children)/i.test(sourceUrl);
    if (
      !kidsPage &&
      !KIDS.test(blob) &&
      !KIDS.test(heading) &&
      !KIDS_ACTIVITY.test(blob) &&
      !KIDS_ACTIVITY.test(heading)
    ) {
      continue;
    }
    const local =
      city === "bangalore"
        ? BLR_PLACE.test(blob) ||
          /bangalore|bengaluru/i.test(sourceUrl) ||
          isIndiaOnlineSession(`${heading}\n${blob}`)
        : DELHI_PLACE.test(blob) || DELHI_HOST.test(sourceUrl);
    if (!local) continue;

    const when = scheduleFrom(blob);
    if (!when) continue;
    if (city === "bangalore" && !hasNamedDate(blob)) continue;

    const age = parseAge(blob);
    if (!age) continue;

    const key = `${heading.toLowerCase()}|${when.date.slice(0, 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const priced = priceFrom(blob);
    const area = isOnlineSession(`${heading}\n${blob}`)
      ? "Online"
      : defaultArea(organizer, detectArea(blob, city));
    const venueLine = area === "Online"
      ? "Online"
      : blob.match(/\|\s*([A-Za-z][^\n|]{3,60})/)?.[1]?.trim() ||
        blob.match(/📍\s*([^\n]+)/)?.[1]?.trim() ||
        area;

    const event: KidsEvent = {
      id: `web-${slug(organizer)}-${slug(heading)}-${when.date.slice(0, 10)}`,
      title: heading.slice(0, 72),
      date: when.date,
      time: when.time,
      city,
      area,
      venue: venueLine,
      ageMinMonths: age.minMonths,
      ageMaxYears: age.maxYears,
      ageGroups: age.groups,
      category: detectCategory(blob),
      organizer,
      description: block.after
        .replace(/\[([^\]]*)\]\((https?:\/\/[^)]*)\)/g, "$1")
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/[#*_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140),
      instagramHandle: HANDLES[organizer] || slug(organizer).replace(/-/g, "") || "instagram",
      bookingUrl: bookingFrom(blob, sourceUrl),
      website: sourceUrl,
      isFree: priced.isFree,
      price: priced.price,
    };

    if (!event.description) event.description = event.title;
    if (!isUpcomingEvent(event)) continue;
    events.push(event);
  }

  return events;
}
