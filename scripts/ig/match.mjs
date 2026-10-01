#!/usr/bin/env node
/**
 * Decide, without any model calls, which extracted events are obviously known,
 * which are obviously new, and which need a Sonnet worker to compare against a
 * short list of look-alikes (same dates ±1 day, same or unknown location).
 *
 *   node scripts/ig/match.mjs --run 2026-10-01
 *
 * Writes .context/runs/<run>/match-plan.json and resolve/<n>.json packets.
 */
import { join } from "node:path";
import {
  bookingKey,
  eventRange,
  isGenericArea,
  normalizeArea,
  parseArgs,
  rangesOverlap,
  readEvents,
  readExtracts,
  runDir,
  shortcodeFromUrl,
  todayKolkata,
  tokenOverlap,
  updateRunLog,
  writeJson,
} from "./lib.mjs";

const RESOLVE_BATCH = 8;
const MAX_CANDIDATES = 5;

function summary(ev) {
  return {
    id: ev.id,
    title: ev.title,
    date: ev.date.slice(0, 10),
    endDate: ev.endDate ? ev.endDate.slice(0, 10) : null,
    time: ev.time,
    area: ev.area,
    venue: ev.venue,
    organizerHandle: ev.organizerHandle || ev.instagramHandle,
    organizer: ev.organizer,
    price: ev.price || (ev.isFree ? "free" : null),
    description: String(ev.description || "").slice(0, 200),
    postedBy: (ev.sources || []).map((s) => s.postedBy).filter(Boolean),
  };
}

function incomingRange(ev) {
  if (!ev.startDate) return null;
  return { start: ev.startDate, end: ev.endDate || ev.startDate };
}

function score(incoming, handle, candidate) {
  let s = 0;
  const org = candidate.organizerHandle || candidate.instagramHandle;
  const posters = new Set((candidate.sources || []).map((x) => x.postedBy));
  for (const c of candidate.details?.collaborators || []) posters.add(c);
  const mine = new Set([handle, incoming.organizerHandle, ...(incoming.collaborators || [])]);
  const sameOrg = mine.has(org) || [...mine].some((h) => posters.has(h));
  if (sameOrg) s += 3;
  const sameArea = !isGenericArea(incoming.area) && normalizeArea(incoming.area) === normalizeArea(candidate.area);
  if (sameArea) s += 2;
  const venue = tokenOverlap(incoming.venue, candidate.venue);
  if (venue > 0) s += 1 + venue;
  const title = tokenOverlap(incoming.title, candidate.title);
  s += title * 2;
  const locationOk = sameOrg || sameArea || venue > 0 || isGenericArea(incoming.area) || isGenericArea(candidate.area);
  return { s, locationOk, sameOrg };
}

function main() {
  const args = parseArgs();
  const run = args.run || todayKolkata();
  const today = todayKolkata();
  const { records, missing } = readExtracts(run);
  if (missing.length) {
    console.error(`missing extract files:\n${missing.join("\n")}`);
    process.exit(1);
  }
  const db = readEvents();
  const live = db.events.filter((ev) => ev.status !== "cancelled" && (ev.ongoing || eventRange(ev).end >= today));

  const plans = [];
  const resolveItems = [];
  const batchNew = []; // events created earlier in this same run, so two handles announcing the same new event still collide

  for (const rec of records) {
    if (!rec.isEvent) {
      plans.push({ postId: rec.postId, handle: rec.handle, action: "not_event", note: rec.reason });
      continue;
    }
    const ev = rec.event;
    if (ev.outsideBangalore) {
      plans.push({ postId: rec.postId, handle: rec.handle, action: "not_event", note: `outside Bangalore: ${rec.reason}` });
      continue;
    }
    const code = shortcodeFromUrl(rec.url);
    const bkey = bookingKey(ev.bookingUrl);

    const auto = db.events.find(
      (x) =>
        (code && x.matchKeys?.shortcodes?.includes(code)) ||
        (bkey && !bkey.startsWith("url:") && x.matchKeys?.bookingIds?.includes(bkey)),
    );
    if (auto) {
      plans.push({ postId: rec.postId, handle: rec.handle, action: "attach", eventId: auto.id, via: code && auto.matchKeys.shortcodes.includes(code) ? "shortcode" : "booking" });
      continue;
    }

    const range = incomingRange(ev);
    const pool = [...live, ...batchNew];
    let candidates;
    if (range) {
      candidates = pool
        .map((c) => ({ c, ...score(ev, rec.handle, c) }))
        .filter(({ c, locationOk }) => locationOk && (c.ongoing || rangesOverlap(range, eventRange(c), 1)))
        .sort((a, b) => b.s - a.s)
        .slice(0, MAX_CANDIDATES);
    } else {
      // Undated reminder / cancellation: only the organiser's own upcoming events make sense.
      candidates = pool
        .map((c) => ({ c, ...score(ev, rec.handle, c) }))
        .filter(({ sameOrg }) => sameOrg)
        .sort((a, b) => b.s - a.s)
        .slice(0, MAX_CANDIDATES);
      if (!candidates.length) {
        plans.push({ postId: rec.postId, handle: rec.handle, action: "not_event", note: `${ev.kind} without a date and no matching upcoming event` });
        continue;
      }
    }

    if (!candidates.length) {
      plans.push({ postId: rec.postId, handle: rec.handle, action: "new" });
      batchNew.push({ ...ev, id: `new:${rec.postId}`, date: ev.startDate, endDate: ev.endDate, instagramHandle: ev.organizerHandle, sources: [{ postedBy: rec.handle }] });
      continue;
    }

    plans.push({ postId: rec.postId, handle: rec.handle, action: "resolve" });
    resolveItems.push({
      postId: rec.postId,
      postedBy: rec.handle,
      postUrl: rec.url,
      incoming: {
        title: ev.title,
        kind: ev.kind,
        date: ev.startDate,
        endDate: ev.endDate || null,
        time: ev.timeText || ev.startTime || null,
        area: ev.area,
        venue: ev.venue,
        organizerHandle: ev.organizerHandle,
        organizer: ev.organizerName,
        price: ev.price || (ev.isFree ? "free" : null),
        description: ev.description,
      },
      candidates: candidates.map(({ c }) => summary({ ...c, date: c.date, endDate: c.endDate })),
    });
    // A resolve item may still turn out to be new; keep it visible to later posts in the batch too.
    batchNew.push({ ...ev, id: `new:${rec.postId}`, date: ev.startDate || today, endDate: ev.endDate, instagramHandle: ev.organizerHandle, sources: [{ postedBy: rec.handle }] });
  }

  const dir = runDir(run);
  const resolvePackets = [];
  for (let i = 0; i < resolveItems.length; i += RESOLVE_BATCH) {
    const n = resolvePackets.length + 1;
    const file = join(dir, "resolve", `${n}.json`);
    writeJson(file, { run, packet: n, today, items: resolveItems.slice(i, i + RESOLVE_BATCH) });
    resolvePackets.push({ packet: n, file, out: join(dir, "resolve", `${n}.answers.json`), items: Math.min(RESOLVE_BATCH, resolveItems.length - i) });
  }
  const counts = plans.reduce((acc, p) => ({ ...acc, [p.action]: (acc[p.action] || 0) + 1 }), {});
  writeJson(join(dir, "match-plan.json"), { run, today, counts, plans, resolvePackets });
  updateRunLog(run, { match: { at: new Date().toISOString(), counts, resolvePackets: resolvePackets.length } });

  console.log(`run ${run}: ${records.length} records → ${JSON.stringify(counts)}`);
  for (const p of resolvePackets) console.log(`resolve packet ${p.packet}: ${p.items} items\n  in:  ${p.file}\n  out: ${p.out}`);
  if (!resolvePackets.length) console.log("no resolve step needed");
}

main();
