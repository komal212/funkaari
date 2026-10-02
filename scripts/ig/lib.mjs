/**
 * Shared helpers for the Instagram → events pipeline (scripts/ig/*).
 * Plain Node ESM, no dependencies. Never prints secrets.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DB_DIR = join(ROOT, "db");
export const POSTS_DIR = join(DB_DIR, "posts");
export const RUNS_DIR = join(DB_DIR, "runs");
export const EVENTS_FILE = join(DB_DIR, "events.json");
export const TRIAGE_FILE = join(DB_DIR, "triage.json");
export const SITE_FILE = join(ROOT, "src/data/instagram-events.json");
export const FOLLOWING_FILE = join(ROOT, "src/data/funkaari-following.json");
export const CONTEXT_RUNS = join(ROOT, ".context/runs");

export const CATEGORIES = ["workshop", "camp", "open day", "sports", "art", "music", "festival"];
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
];
export const GENERIC_AREAS = new Set(["", "bengaluru", "bangalore", "online", "multiple"]);
export const SOURCE_KINDS = ["announcement", "reminder", "update", "cancellation", "repost"];
export const DECISIONS = ["same", "update", "different"];

export function loadEnv() {
  const envFile = join(ROOT, ".env.local");
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

export function redact(text) {
  return String(text).replace(/[A-Za-z0-9_\-]{40,}/g, "[redacted]");
}

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      out._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

export function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`cannot parse ${file}: ${err instanceof Error ? err.message : err}`);
  }
}

export function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function todayKolkata(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function runDir(run) {
  return join(CONTEXT_RUNS, run);
}

export function runLogFile(run) {
  return join(RUNS_DIR, `${run}.json`);
}

export function updateRunLog(run, patch) {
  const file = runLogFile(run);
  const current = readJson(file, { run });
  writeJson(file, { ...current, ...patch, updatedAt: new Date().toISOString() });
}

export function followingHandles() {
  const feed = readJson(FOLLOWING_FILE, { handles: [] });
  return [...new Set((feed.handles || []).map((h) => String(h).toLowerCase()))];
}

export function postsFile(handle) {
  return join(POSTS_DIR, `${handle}.json`);
}

export function readPostsFile(handle) {
  return readJson(postsFile(handle), {
    handle,
    latestPostAt: null,
    lastFetchedAt: null,
    fetchError: null,
    posts: [],
  });
}

export function readAllPosts(handles) {
  if (!existsSync(POSTS_DIR)) return [];
  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"));
  const wanted = handles ? new Set(handles) : null;
  const out = [];
  for (const file of files) {
    const handle = file.replace(/\.json$/, "");
    if (wanted && !wanted.has(handle)) continue;
    out.push(readPostsFile(handle));
  }
  return out;
}

export function readTriage() {
  return readJson(TRIAGE_FILE, {});
}

export function readEvents() {
  const db = readJson(EVENTS_FILE, { events: [] });
  if (!Array.isArray(db.events)) db.events = [];
  return db;
}

export function shortcodeFromUrl(url) {
  const match = String(url || "").match(/instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return match?.[1];
}

/** Stable key for a booking page so reposts with the same ticket link match for free. */
export function bookingKey(url) {
  if (!url) return undefined;
  const u = String(url).trim();
  const bms = u.match(/\/(ET\d{8,})/i);
  if (bms) return `bms:${bms[1].toUpperCase()}`;
  const allevents = u.match(/allevents\.in\/[^/]+\/[^/]+\/(\d{6,})/i);
  if (allevents) return `allevents:${allevents[1]}`;
  const ig = shortcodeFromUrl(u);
  if (ig) return `ig:${ig}`;
  try {
    const parsed = new URL(u);
    return `url:${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return undefined;
  }
}

export function slugify(text, max = 40) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, max)
    .replace(/-+$/, "");
}

const FILLER = new Set([
  "a", "an", "the", "at", "in", "on", "for", "of", "and", "with", "to", "by", "kids", "kid", "children",
  "child", "toddler", "toddlers", "workshop", "event", "session", "bangalore", "bengaluru", "blr",
  "little", "ones", "your", "our", "this", "come", "join", "us", "x", "–", "-", "|",
]);

export function significantTokens(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !FILLER.has(t)),
  );
}

export function tokenOverlap(a, b) {
  const ta = significantTokens(a);
  const tb = significantTokens(b);
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.min(ta.size, tb.size);
}

const MONTH = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const DATE_SIGNAL = new RegExp(
  [
    `\\b\\d{1,2}(?:st|nd|rd|th)?\\s*(?:of\\s+)?(?:${MONTH})\\b`,
    `\\b(?:${MONTH})\\.?\\s*\\d{1,2}(?:st|nd|rd|th)?\\b`,
    "\\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\\b",
    "\\b\\d{1,2}\\s*[/.-]\\s*\\d{1,2}(?:\\s*[/.-]\\s*\\d{2,4})?\\b",
    "\\b\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)\\b",
    "\\b(?:this|next) (?:weekend|week)\\b",
    "\\bsave the date\\b",
  ].join("|"),
  "i",
);
// Booking cues and specific event types only. Broad words ("family", "ages", "music", "celebration")
// appear in nearly every preschool post and made the filter useless; see the 2026-10-02 audit in the handoff.
const EVENT_SIGNAL = new RegExp(
  "\\b(?:" +
    [
      // how to attend
      "register(?:ed)?", "registrations?", "rsvp", "book (?:now|your|a)", "bookings?", "tickets?", "slots?",
      "seats?", "spots? (?:left|available)", "sign ?up", "venue", "entry", "fees?", "link in bio", "dm (?:to|us|for)",
      // what
      "workshops?", "play ?dates?", "story ?time", "open (?:house|day)s?", "drop[ -]?in", "trial class(?:es)?",
      "camps?", "exhibitions?", "biennale", "treks?", "nature walks?", "puppet(?:ry)?", "magic show", "concerts?",
      "screenings?", "carnivals?", "melas?", "fairs?", "masterclass(?:es)?", "meet ?ups?",
    ].join("|") +
    ")\\b|₹|\\brs\\.?\\s*\\d",
  "i",
);

/** Caption with hashtags, mentions, links and emoji removed, whitespace collapsed. */
export function captionText(caption) {
  return String(caption || "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#@][\p{L}\p{N}_.]+/gu, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Sc}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Why a post is worth sending to an extract worker, or null if it is not.
 * `flyer` when the caption is near-empty (details are likely in the image), else `date` or `keyword`.
 */
export function eventSignal(caption) {
  const text = captionText(caption);
  if (text.length < 60) return "flyer";
  if (DATE_SIGNAL.test(text)) return "date";
  if (EVENT_SIGNAL.test(text)) return "keyword";
  return null;
}

export function normalizeArea(area) {
  return String(area || "").trim().toLowerCase();
}

export function isGenericArea(area) {
  return GENERIC_AREAS.has(normalizeArea(area));
}

/** Copy of src/lib/age.ts so scripts stay dependency-free. */
export function ageGroupsForRange(minYears, maxYears = 6) {
  const top = maxYears;
  const groups = [];
  if (minYears < 1 && top >= 0.5) groups.push("6-12mo");
  if (minYears < 2 && top >= 1) groups.push("1-2yr");
  if (minYears < 3 && top >= 2) groups.push("2-3yr");
  if (minYears < 4 && top >= 3) groups.push("3-4yr");
  if (minYears <= 6 && top >= 4) groups.push("4-6yr");
  return groups;
}

export function ymd(iso) {
  return String(iso || "").slice(0, 10);
}

export function addDays(ymdText, days) {
  const d = new Date(`${ymdText}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function eventRange(event) {
  const start = ymd(event.date);
  const end = ymd(event.endDate) || start;
  return { start, end };
}

export function rangesOverlap(a, b, slackDays = 1) {
  return addDays(a.start, -slackDays) <= b.end && addDays(a.end, slackDays) >= b.start;
}

export function isValidYmd(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(text || ""))) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

export function isUrl(text) {
  try {
    const u = new URL(String(text));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function packetIndex(run) {
  return readJson(join(runDir(run), "packets", "index.json"), null);
}

export function readExtracts(run) {
  const index = packetIndex(run);
  if (!index) throw new Error(`no packets for run ${run}; run ig:pack first`);
  const records = [];
  const missing = [];
  for (const packet of index.packets) {
    const file = join(runDir(run), "extract", `${packet.packet}.json`);
    const parsed = readJson(file, null);
    if (!parsed) {
      missing.push(file);
      continue;
    }
    // Workers return only postId; join back the post metadata (handle, url, postedAt) from the packet.
    const posts = new Map((readJson(packet.file, { posts: [] }).posts || []).map((p) => [p.postId, p]));
    for (const record of parsed.records || []) {
      const post = posts.get(record.postId) || {};
      records.push({
        ...record,
        packet: packet.packet,
        handle: post.handle,
        shortcode: post.shortcode,
        url: post.url,
        postedAt: post.postedAt,
        likes: post.likes ?? null,
        comments: post.comments ?? null,
        images: post.images || [],
      });
    }
  }
  return { index, records, missing };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
