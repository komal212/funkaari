#!/usr/bin/env node
/**
 * Apply validated extract + resolve decisions to db/events.json and db/triage.json,
 * then regenerate src/data/instagram-events.json for the website.
 *
 *   node scripts/ig/apply.mjs --run 2026-10-01 [--dry]
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  EVENTS_FILE,
  SITE_FILE,
  TRIAGE_FILE,
  ageGroupsForRange,
  bookingKey,
  eventRange,
  parseArgs,
  readEvents,
  readExtracts,
  readJson,
  readTriage,
  runDir,
  shortcodeFromUrl,
  slugify,
  todayKolkata,
  updateRunLog,
  writeJson,
} from "./lib.mjs";

const TRACKING = new Set(["organizerHandle", "status", "sources", "matchKeys", "createdAt", "updatedAt", "seeded"]);

function time12(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function isoDate(ymd, hhmm) {
  return `${ymd}T${hhmm || "10:00"}:00+05:30`;
}

function uniqueId(base, taken) {
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

function buildEvent(rec, taken, now) {
  const ev = rec.event;
  const start = ev.startDate || todayKolkata();
  const minYears = ev.ageMinMonths / 12;
  const id = uniqueId(`ig-${ev.organizerHandle}-${start}-${slugify(ev.title, 32)}`, taken);
  const code = shortcodeFromUrl(rec.url);
  const bkey = bookingKey(ev.bookingUrl);
  const event = {
    id,
    title: ev.title.trim(),
    date: isoDate(start, ev.startTime),
    ...(ev.endDate ? { endDate: `${ev.endDate}T23:59:59+05:30` } : {}),
    ...(ev.ongoing ? { ongoing: true } : {}),
    time: ev.timeText || (ev.startTime ? time12(ev.startTime) : "See post"),
    city: "bangalore",
    area: ev.isOnline ? "Online" : ev.area.trim(),
    venue: ev.venue.trim(),
    ageMinMonths: ev.ageMinMonths,
    ...(ev.ageMaxYears != null ? { ageMaxYears: ev.ageMaxYears } : {}),
    ageGroups: ageGroupsForRange(minYears, ev.ageMaxYears ?? 6),
    category: ev.category,
    organizer: ev.organizerName.trim(),
    description: ev.description.trim(),
    instagramHandle: ev.organizerHandle,
    instagramUrl: rec.url,
    fromInstagram: true,
    ...(ev.bookingUrl ? { bookingUrl: ev.bookingUrl } : {}),
    isFree: ev.isFree,
    ...(ev.price ? { price: ev.price } : {}),
    organizerHandle: ev.organizerHandle,
    status: ev.kind === "cancellation" ? "cancelled" : "scheduled",
    sources: [{ postId: rec.postId, url: rec.url, postedBy: rec.handle, kind: ev.kind, seenAt: now }],
    matchKeys: { shortcodes: code ? [code] : [], bookingIds: bkey ? [bkey] : [] },
    createdAt: now,
    updatedAt: now,
  };
  return event;
}

function attach(event, rec, kind, now) {
  const ev = rec.event;
  if (!event.sources.some((s) => s.postId === rec.postId)) {
    event.sources.push({ postId: rec.postId, url: rec.url, postedBy: rec.handle, kind, seenAt: now });
  }
  const code = shortcodeFromUrl(rec.url);
  const bkey = bookingKey(ev?.bookingUrl);
  event.matchKeys ||= { shortcodes: [], bookingIds: [] };
  if (code && !event.matchKeys.shortcodes.includes(code)) event.matchKeys.shortcodes.push(code);
  if (bkey && !event.matchKeys.bookingIds.includes(bkey)) event.matchKeys.bookingIds.push(bkey);
  // The organiser's own post beats a repost as the card link.
  const currentPoster = event.sources.find((s) => s.url === event.instagramUrl)?.postedBy;
  if (rec.handle === event.organizerHandle && currentPoster !== event.organizerHandle) event.instagramUrl = rec.url;
  if (ev?.bookingUrl && !event.bookingUrl) event.bookingUrl = ev.bookingUrl;
  if (ev?.kind === "cancellation") event.status = "cancelled";
  event.updatedAt = now;
}

const CHANGE_FIELDS = new Set(["title", "startDate", "endDate", "startTime", "timeText", "venue", "area", "price", "isFree", "bookingUrl", "description", "ageMinMonths", "ageMaxYears", "status"]);

function applyChanges(event, changes, now) {
  const applied = [];
  for (const [key, value] of Object.entries(changes || {})) {
    if (!CHANGE_FIELDS.has(key) || value == null) continue;
    applied.push(key);
    if (key === "startDate") event.date = isoDate(value, changes.startTime || event.date.slice(11, 16));
    else if (key === "endDate") event.endDate = `${value}T23:59:59+05:30`;
    else if (key === "startTime") {
      event.date = isoDate(event.date.slice(0, 10), value);
      if (!changes.timeText) event.time = time12(value);
    } else if (key === "timeText") event.time = value;
    else if (key === "status") event.status = value === "cancelled" ? "cancelled" : value === "postponed" ? "postponed" : event.status;
    else event[key] = value;
  }
  if (applied.includes("ageMinMonths") || applied.includes("ageMaxYears")) {
    event.ageGroups = ageGroupsForRange(event.ageMinMonths / 12, event.ageMaxYears ?? 6);
  }
  event.updatedAt = now;
  return applied;
}

function siteView(events, today) {
  return events
    .filter((ev) => !ev.seeded && ev.status === "scheduled" && (ev.ongoing || eventRange(ev).end >= today))
    .map((ev) => Object.fromEntries(Object.entries(ev).filter(([k]) => !TRACKING.has(k))))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function main() {
  const args = parseArgs();
  const run = args.run || todayKolkata();
  const dry = Boolean(args.dry);
  const now = new Date().toISOString();
  const today = todayKolkata();
  const dir = runDir(run);

  const { records } = readExtracts(run);
  const plan = readJson(join(dir, "match-plan.json"), null);
  if (!plan) {
    console.error("no match-plan.json; run ig:match first");
    process.exit(1);
  }
  const answers = new Map();
  for (const rp of plan.resolvePackets || []) {
    const parsed = readJson(rp.out, null);
    if (!parsed) {
      console.error(`missing resolve answers: ${rp.out}`);
      process.exit(1);
    }
    for (const a of parsed.answers) answers.set(a.postId, a);
  }

  const db = readEvents();
  const triage = readTriage();
  const byId = new Map(db.events.map((e) => [e.id, e]));
  const taken = new Set(byId.keys());
  const createdIdFor = new Map(); // "new:<postId>" -> real id
  const plans = new Map(plan.plans.map((p) => [p.postId, p]));
  const out = { created: [], attached: [], updated: [], cancelled: [], not_event: 0 };

  const resolveRef = (id) => (id?.startsWith("new:") ? createdIdFor.get(id) : id);

  for (const rec of records) {
    const p = plans.get(rec.postId);
    if (!p) continue;
    const mark = (status, extra = {}) => {
      triage[rec.postId] = { status, at: now, handle: rec.handle, run, ...extra };
    };

    if (p.action === "not_event") {
      mark("not_event", { note: p.note });
      out.not_event += 1;
      continue;
    }
    if (p.action === "attach") {
      const target = byId.get(p.eventId);
      if (!target) {
        mark("error", { note: `attach target ${p.eventId} missing` });
        continue;
      }
      attach(target, rec, rec.event.kind === "announcement" ? "repost" : rec.event.kind, now);
      mark(rec.event.kind === "cancellation" ? "update" : "duplicate", { eventId: target.id });
      (rec.event.kind === "cancellation" ? out.cancelled : out.attached).push(`${target.title} ← @${rec.handle} (${p.via})`);
      continue;
    }

    const ans = p.action === "resolve" ? answers.get(rec.postId) : undefined;
    if (ans && ans.decision !== "different") {
      const targetId = resolveRef(ans.eventId);
      const target = targetId ? byId.get(targetId) : undefined;
      if (!target) {
        mark("error", { note: `resolve target ${ans.eventId} missing` });
        continue;
      }
      if (ans.decision === "update") {
        const applied = applyChanges(target, ans.changes, now);
        attach(target, rec, "update", now);
        mark("update", { eventId: target.id, changed: applied });
        (target.status === "cancelled" ? out.cancelled : out.updated).push(`${target.title} ← @${rec.handle} [${applied.join(", ")}]`);
      } else {
        const kind = rec.handle === target.organizerHandle ? (rec.event.kind === "announcement" ? "reminder" : rec.event.kind) : "repost";
        attach(target, rec, kind, now);
        mark(target.status === "cancelled" ? "update" : "duplicate", { eventId: target.id });
        (target.status === "cancelled" ? out.cancelled : out.attached).push(`${target.title} ← @${rec.handle} (${kind})`);
      }
      continue;
    }

    if (p.action === "new" || (p.action === "resolve" && ans?.decision === "different")) {
      if (!rec.event.startDate && !rec.event.ongoing) {
        mark("not_event", { note: "no date for a new event" });
        out.not_event += 1;
        continue;
      }
      const event = buildEvent(rec, taken, now);
      db.events.push(event);
      byId.set(event.id, event);
      createdIdFor.set(`new:${rec.postId}`, event.id);
      mark("new_event", { eventId: event.id });
      out.created.push(`${event.title} · ${event.date.slice(0, 10)} · ${event.area} · @${event.organizerHandle}`);
      continue;
    }
    mark("error", { note: `unhandled plan ${p.action}` });
  }

  db.events.sort((a, b) => a.date.localeCompare(b.date));
  const site = { generatedAt: now, run, events: siteView(db.events, today) };

  if (!dry) {
    writeJson(EVENTS_FILE, db);
    writeJson(TRIAGE_FILE, triage);
    writeJson(SITE_FILE, site);
    updateRunLog(run, {
      apply: { at: now, created: out.created.length, attached: out.attached.length, updated: out.updated.length, cancelled: out.cancelled.length, notEvent: out.not_event, siteEvents: site.events.length },
    });
  }

  console.log(`${dry ? "[dry run] " : ""}run ${run}`);
  console.log(`created ${out.created.length}`);
  for (const l of out.created) console.log(`  + ${l}`);
  console.log(`attached ${out.attached.length}`);
  for (const l of out.attached) console.log(`  = ${l}`);
  console.log(`updated ${out.updated.length}`);
  for (const l of out.updated) console.log(`  ~ ${l}`);
  console.log(`cancelled ${out.cancelled.length}`);
  for (const l of out.cancelled) console.log(`  x ${l}`);
  console.log(`not events ${out.not_event}`);
  console.log(`site file: ${site.events.length} upcoming events → ${existsSync(SITE_FILE) ? SITE_FILE : "(not written)"}`);
}

main();
