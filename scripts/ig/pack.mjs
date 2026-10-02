#!/usr/bin/env node
/**
 * Group pending (untriaged) posts into packets for the Sonnet extract workers.
 *
 *   node scripts/ig/pack.mjs --run 2026-10-01 [--packets 5] [--triage-days 30] [--handles a,b] [--no-filter]
 *
 * Writes .context/runs/<run>/packets/<n>.json and packets/index.json.
 * Posts older than --triage-days are marked skipped_old in db/triage.json without review,
 * because any event they announced has almost certainly passed.
 * Posts whose caption has no date, event keyword or booking cue (and is not a near-empty flyer caption)
 * are marked skipped_filter without review; --no-filter sends every pending post to the workers.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AREAS,
  CATEGORIES,
  TRIAGE_FILE,
  eventSignal,
  parseArgs,
  readAllPosts,
  readTriage,
  runDir,
  todayKolkata,
  updateRunLog,
  writeJson,
} from "./lib.mjs";

function imagesFor(run, shortcode) {
  const dir = join(runDir(run), "media", shortcode || "");
  if (!shortcode || !existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".jpg"))
    .sort()
    .map((f) => join(dir, f));
}

function main() {
  const args = parseArgs();
  const run = args.run || todayKolkata();
  const packetCount = Math.max(1, Number(args.packets || 5));
  const triageDays = Number(args["triage-days"] || 30);
  const useFilter = !args["no-filter"];
  const handles = args.handles
    ? String(args.handles).split(",").map((h) => h.trim().toLowerCase()).filter(Boolean)
    : undefined;

  const triage = readTriage();
  const cutoff = new Date(Date.now() - triageDays * 86_400_000).toISOString();
  const now = new Date().toISOString();

  const byHandle = new Map();
  let skippedOld = 0;
  let duplicates = 0;
  let filtered = 0;
  for (const file of readAllPosts(handles)) {
    // Identical captions within one handle (campus-by-campus reposts) are triaged once.
    const seenCaption = new Map();
    for (const post of [...file.posts].sort((a, b) => String(a.postedAt).localeCompare(String(b.postedAt)))) {
      if (triage[post.id]) continue;
      if (!post.postedAt || post.postedAt < cutoff) {
        triage[post.id] = { status: "skipped_old", at: now, handle: file.handle };
        skippedOld += 1;
        continue;
      }
      const key = String(post.caption || "").toLowerCase().replace(/\s+/g, " ").trim();
      if (key.length > 40 && seenCaption.has(key)) {
        triage[post.id] = { status: "duplicate_post", at: now, handle: file.handle, ofPostId: seenCaption.get(key) };
        duplicates += 1;
        continue;
      }
      if (key.length > 40) seenCaption.set(key, post.id);
      if (useFilter && !eventSignal(post.caption)) {
        triage[post.id] = { status: "skipped_filter", at: now, handle: file.handle };
        filtered += 1;
        continue;
      }
      if (!byHandle.has(file.handle)) byHandle.set(file.handle, []);
      byHandle.get(file.handle).push({
        postId: post.id,
        handle: file.handle,
        shortcode: post.shortcode,
        url: post.url,
        postedAt: post.postedAt,
        type: post.type,
        likes: post.likes ?? null,
        comments: post.comments ?? null,
        caption: post.caption,
        images: imagesFor(run, post.shortcode),
      });
    }
  }
  if (skippedOld || duplicates || filtered) writeJson(TRIAGE_FILE, triage);

  // Greedy balance: biggest handle groups first, each into the lightest packet.
  const groups = [...byHandle.values()].sort((a, b) => b.length - a.length);
  const pending = groups.reduce((n, g) => n + g.length, 0);
  const packets = Array.from({ length: Math.min(packetCount, Math.max(groups.length, 1)) }, () => []);
  for (const group of groups) {
    packets.sort((a, b) => a.length - b.length);
    packets[0].push(...group);
  }
  const filled = packets.filter((p) => p.length > 0);

  const dir = join(runDir(run), "packets");
  const index = { run, today: todayKolkata(), pending, skippedOld, filtered, packets: [] };
  filled.forEach((posts, i) => {
    const n = i + 1;
    const file = join(dir, `${n}.json`);
    writeJson(file, {
      run,
      packet: n,
      today: todayKolkata(),
      vocab: {
        categories: CATEGORIES,
        areas: [...AREAS, "Bengaluru", "Online"],
        sourceKinds: ["announcement", "reminder", "update", "cancellation"],
      },
      posts,
    });
    index.packets.push({
      packet: n,
      file,
      out: join(runDir(run), "extract", `${n}.json`),
      posts: posts.length,
      handles: [...new Set(posts.map((p) => p.handle))],
    });
  });
  writeJson(join(dir, "index.json"), index);
  updateRunLog(run, { pack: { at: now, pending, skippedOld, duplicates, filtered, packets: index.packets.map((p) => ({ packet: p.packet, posts: p.posts })) } });

  console.log(`run ${run}: ${pending} pending posts across ${byHandle.size} handles; ${skippedOld} skipped as older than ${triageDays} days; ${duplicates} duplicate captions; ${filtered} without event signals`);
  for (const p of index.packets) console.log(`packet ${p.packet}: ${p.posts} posts (${p.handles.join(", ")})\n  in:  ${p.file}\n  out: ${p.out}`);
  if (!index.packets.length) console.log("nothing to extract");
}

main();
