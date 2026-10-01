#!/usr/bin/env node
/**
 * Validate worker output before anything touches the database.
 *
 *   node scripts/ig/validate.mjs --run 2026-10-01                 # extract stage
 *   node scripts/ig/validate.mjs --run 2026-10-01 --stage resolve # resolve stage
 *
 * Exit 1 with a per-packet error list when anything is off, so the orchestrator can
 * send the exact errors back to the worker that produced them.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  CATEGORIES,
  DECISIONS,
  SOURCE_KINDS,
  isUrl,
  isValidYmd,
  packetIndex,
  parseArgs,
  readJson,
  runDir,
  todayKolkata,
} from "./lib.mjs";

const HANDLE_RE = /^[a-z0-9._]{2,30}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function str(v) {
  return typeof v === "string" ? v.trim() : "";
}

function validateEvent(ev, errors, where) {
  const e = (msg) => errors.push(`${where}: ${msg}`);
  if (!ev || typeof ev !== "object") return e("event must be an object when isEvent is true");
  const title = str(ev.title);
  if (title.length < 10 || title.length > 72) e(`title must be 10-72 chars (got ${title.length})`);
  const kind = str(ev.kind);
  if (!SOURCE_KINDS.includes(kind) || kind === "repost") e(`kind must be one of announcement|reminder|update|cancellation`);
  if (ev.startDate != null && !isValidYmd(ev.startDate)) e("startDate must be YYYY-MM-DD or null");
  if (!["dated", "ongoing", "save-the-date"].includes(ev.listingType)) e("listingType must be dated|ongoing|save-the-date");
  if (ev.listingType === "ongoing" && ev.ongoing !== true) e("listingType ongoing requires ongoing: true");
  if (ev.listingType !== "ongoing" && ev.startDate == null && kind === "announcement") e("dated or save-the-date announcement needs a startDate");
  if (ev.endDate != null) {
    if (!isValidYmd(ev.endDate)) e("endDate must be YYYY-MM-DD or null");
    else if (ev.startDate && ev.endDate < ev.startDate) e("endDate before startDate");
  }
  if (ev.startTime != null && !TIME_RE.test(String(ev.startTime))) e("startTime must be HH:MM (24h) or null");
  if (ev.timeText != null && typeof ev.timeText !== "string") e("timeText must be a string or null");
  if (ev.ongoing != null && typeof ev.ongoing !== "boolean") e("ongoing must be boolean");
  if (ev.venue != null && !str(ev.venue)) e("venue must be a non-empty string or null");
  if (ev.area != null && !str(ev.area)) e("area must be a non-empty string or null");
  if (!Number.isInteger(ev.ageMinMonths) || ev.ageMinMonths < 0 || ev.ageMinMonths > 72) e("ageMinMonths must be an integer 0-72");
  if (ev.ageMaxYears != null && (typeof ev.ageMaxYears !== "number" || ev.ageMaxYears < 1 || ev.ageMaxYears > 18)) e("ageMaxYears must be a number 1-18 or null");
  if (!CATEGORIES.includes(ev.category)) e(`category must be one of ${CATEGORIES.join("|")}`);
  if (typeof ev.isFree !== "boolean") e("isFree must be boolean");
  if (ev.price != null && typeof ev.price !== "string") e("price must be a string or null");
  if (ev.bookingUrl != null && !isUrl(ev.bookingUrl)) e("bookingUrl must be an http(s) URL or null");
  if (!HANDLE_RE.test(str(ev.organizerHandle))) e("organizerHandle must be a lowercase Instagram handle without @");
  if (!str(ev.organizerName)) e("organizerName required");
  const desc = str(ev.description);
  if (desc.length < 20 || desc.length > 200) e(`description must be 20-200 chars (got ${desc.length})`);
  if (ev.outsideBangalore != null && typeof ev.outsideBangalore !== "boolean") e("outsideBangalore must be boolean");
  if (ev.isOnline != null && typeof ev.isOnline !== "boolean") e("isOnline must be boolean");
  if (ev.bookingNote != null && (typeof ev.bookingNote !== "string" || ev.bookingNote.length > 120)) e("bookingNote must be a string up to 120 chars or null");
  if (ev.contactPhone != null && (typeof ev.contactPhone !== "string" || !/^\+?[\d\s\-()]{8,20}$/.test(ev.contactPhone))) e("contactPhone must be a phone number string or null");
  if (ev.availability != null && (typeof ev.availability !== "string" || ev.availability.length > 80)) e("availability must be a string up to 80 chars or null");
  if (ev.collaborators != null) {
    if (!Array.isArray(ev.collaborators)) e("collaborators must be an array of handles");
    else for (const h of ev.collaborators) if (!HANDLE_RE.test(String(h))) e(`collaborator "${h}" must be a lowercase handle without @`);
  }
}

function validateExtract(run) {
  const index = packetIndex(run);
  if (!index) return { errors: [`no packets for run ${run}`], ok: [] };
  const errors = [];
  const ok = [];
  for (const packet of index.packets) {
    const expected = new Set((readJson(packet.file, { posts: [] }).posts || []).map((p) => p.postId));
    const parsed = readJson(packet.out, null);
    if (!parsed) {
      errors.push(`packet ${packet.packet}: output file missing at ${packet.out}`);
      continue;
    }
    const before = errors.length;
    const records = Array.isArray(parsed.records) ? parsed.records : null;
    if (!records) {
      errors.push(`packet ${packet.packet}: output must be { "packet": ${packet.packet}, "records": [...] }`);
      continue;
    }
    const seen = new Set();
    records.forEach((rec, i) => {
      const where = `packet ${packet.packet} record ${i} (postId ${rec?.postId ?? "?"})`;
      if (!rec || typeof rec !== "object") return errors.push(`${where}: not an object`);
      if (!expected.has(rec.postId)) errors.push(`${where}: postId not in this packet`);
      if (seen.has(rec.postId)) errors.push(`${where}: duplicate postId`);
      seen.add(rec.postId);
      if (typeof rec.isEvent !== "boolean") errors.push(`${where}: isEvent must be boolean`);
      if (str(rec.reason).length < 3 || str(rec.reason).length > 160) errors.push(`${where}: reason must be 3-160 chars`);
      if (rec.isEvent) validateEvent(rec.event, errors, where);
    });
    for (const id of expected) if (!seen.has(id)) errors.push(`packet ${packet.packet}: no record for postId ${id}`);
    if (errors.length === before) ok.push(`packet ${packet.packet}: ${records.length} records ok`);
  }
  return { errors, ok };
}

function validateResolve(run) {
  const dir = join(runDir(run), "resolve");
  if (!existsSync(dir)) return { errors: [], ok: ["no resolve packets"] };
  const files = readdirSync(dir).filter((f) => /^\d+\.json$/.test(f));
  const errors = [];
  const ok = [];
  for (const file of files) {
    const packet = readJson(join(dir, file), { items: [] });
    const outFile = join(dir, file.replace(/\.json$/, ".answers.json"));
    const answers = readJson(outFile, null);
    const label = `resolve packet ${packet.packet}`;
    if (!answers) {
      errors.push(`${label}: answers file missing at ${outFile}`);
      continue;
    }
    const before = errors.length;
    const list = Array.isArray(answers.answers) ? answers.answers : null;
    if (!list) {
      errors.push(`${label}: output must be { "packet": ${packet.packet}, "answers": [...] }`);
      continue;
    }
    const items = new Map(packet.items.map((it) => [it.postId, it]));
    const seen = new Set();
    for (const ans of list) {
      const where = `${label} postId ${ans?.postId ?? "?"}`;
      const item = items.get(ans?.postId);
      if (!item) {
        errors.push(`${where}: postId not in this packet`);
        continue;
      }
      seen.add(ans.postId);
      if (!DECISIONS.includes(ans.decision)) errors.push(`${where}: decision must be same|update|different`);
      if (ans.decision !== "different") {
        const ids = new Set(item.candidates.map((c) => c.id));
        if (!ids.has(ans.eventId)) errors.push(`${where}: eventId must be one of the candidate ids`);
      }
      if (ans.decision === "update" && (!ans.changes || typeof ans.changes !== "object")) {
        errors.push(`${where}: update needs a changes object`);
      }
    }
    for (const id of items.keys()) if (!seen.has(id)) errors.push(`${label}: no answer for postId ${id}`);
    if (errors.length === before) ok.push(`${label}: ${list.length} answers ok`);
  }
  return { errors, ok };
}

function main() {
  const args = parseArgs();
  const run = args.run || todayKolkata();
  const stage = args.stage || "extract";
  const result = stage === "resolve" ? validateResolve(run) : validateExtract(run);
  for (const line of result.ok) console.log(line);
  if (result.errors.length) {
    console.error(`\n${result.errors.length} problem(s):`);
    for (const line of result.errors) console.error(`- ${line}`);
    process.exit(1);
  }
  console.log(`${stage} output valid`);
}

main();
