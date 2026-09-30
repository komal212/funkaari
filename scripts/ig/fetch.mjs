#!/usr/bin/env node
/**
 * Pull new Instagram posts for followed handles via the Meta Graph API
 * (business_discovery) into db/posts/<handle>.json.
 *
 *   node scripts/ig/fetch.mjs                       # all handles in funkaari-following.json
 *   node scripts/ig/fetch.mjs --handles a,b,c
 *   node scripts/ig/fetch.mjs --backfill-days 60    # first fetch window per handle (default 60)
 *   node scripts/ig/fetch.mjs --image-days 30       # download images for posts newer than this
 *   node scripts/ig/fetch.mjs --run 2026-10-01      # run id (default: today in IST)
 *
 * Only posts newer than each handle's watermark (minus 2 days of slack) are requested.
 * Posts are deduped by id, so overlaps are harmless. Never prints the token.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  followingHandles,
  loadEnv,
  parseArgs,
  readPostsFile,
  redact,
  runDir,
  shortcodeFromUrl,
  sleep,
  todayKolkata,
  updateRunLog,
  writeJson,
  postsFile,
} from "./lib.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";
const PAGE = 50;
const MAX_PAGES = 10;
const MEDIA_FIELDS =
  "id,timestamp,permalink,media_type,caption,media_url,thumbnail_url,children{media_url,media_type}";

class TokenError extends Error {}

function toIso(ts) {
  const d = new Date(String(ts || "").replace(/(\d{2})(\d{2})$/, "$1:$2"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function graphGet(userId, token, fields) {
  const qs = new URLSearchParams({ fields, access_token: token });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(`${GRAPH}/${userId}?${qs}`, { signal: AbortSignal.timeout(60_000) });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Graph ${res.status}: ${redact(text.slice(0, 200))}`);
    }
    if (!json.error) return json;
    const { code, message } = json.error;
    if (code === 190) throw new TokenError(`Instagram token rejected (code 190): ${redact(message)}`);
    if ([4, 17, 32, 613].includes(code) && attempt === 0) {
      console.error(`rate limited (code ${code}); waiting 60s`);
      await sleep(60_000);
      continue;
    }
    throw new Error(`Graph error ${code}: ${redact(message)}`);
  }
  throw new Error("Graph request failed after retry");
}

async function fetchHandle(userId, token, handle, sinceIso) {
  const since = Math.floor(new Date(sinceIso).getTime() / 1000);
  const items = [];
  let after;
  let mediaCount;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const cursor = after ? `.after(${after})` : "";
    const fields = `business_discovery.username(${handle}){username,media_count,media.since(${since}).limit(${PAGE})${cursor}{${MEDIA_FIELDS}}}`;
    const json = await graphGet(userId, token, fields);
    const bd = json.business_discovery;
    if (!bd) throw new Error("no business_discovery in response");
    mediaCount = bd.media_count;
    const data = bd.media?.data || [];
    items.push(...data);
    after = bd.media?.paging?.cursors?.after;
    if (data.length < PAGE || !after) break;
  }
  return { items, mediaCount };
}

function mediaUrls(item) {
  const urls = [];
  if (item.media_type === "VIDEO") {
    if (item.thumbnail_url) urls.push(item.thumbnail_url);
  } else if (item.media_url) {
    urls.push(item.media_url);
  }
  for (const child of item.children?.data || []) {
    const url = child.media_type === "VIDEO" ? undefined : child.media_url;
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls.slice(0, 3);
}

async function downloadImages(dir, urls) {
  mkdirSync(dir, { recursive: true });
  let saved = 0;
  await Promise.all(
    urls.map(async (url, i) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) return;
        const buf = Buffer.from(await res.arrayBuffer());
        writeFileSync(join(dir, `${i + 1}.jpg`), buf);
        saved += 1;
      } catch {
        /* image is optional */
      }
    }),
  );
  return saved;
}

async function main() {
  loadEnv();
  const args = parseArgs();
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const userId = process.env.INSTAGRAM_IG_USER_ID?.trim();
  if (!token || !userId) {
    console.error("missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_IG_USER_ID in .env.local");
    process.exit(1);
  }

  const run = args.run || todayKolkata();
  const backfillDays = Number(args["backfill-days"] || 60);
  const imageDays = Number(args["image-days"] || 30);
  const handles = args.handles
    ? String(args.handles).split(",").map((h) => h.trim().toLowerCase()).filter(Boolean)
    : followingHandles();
  const mediaRoot = join(runDir(run), "media");
  const now = new Date();
  const imageCutoff = new Date(now.getTime() - imageDays * 86_400_000).toISOString();

  const summary = [];
  for (const handle of handles) {
    const file = readPostsFile(handle);
    const known = new Set(file.posts.map((p) => p.id));
    const sinceIso = file.latestPostAt
      ? new Date(new Date(file.latestPostAt).getTime() - 2 * 86_400_000).toISOString()
      : new Date(now.getTime() - backfillDays * 86_400_000).toISOString();

    let fetched = 0;
    let added = 0;
    let images = 0;
    let error = null;
    try {
      const { items, mediaCount } = await fetchHandle(userId, token, handle, sinceIso);
      fetched = items.length;
      const fresh = [];
      for (const item of items) {
        if (!item.id || known.has(item.id)) continue;
        known.add(item.id);
        const postedAt = toIso(item.timestamp);
        const post = {
          id: String(item.id),
          shortcode: shortcodeFromUrl(item.permalink) || null,
          url: item.permalink || null,
          type: item.media_type || null,
          postedAt,
          caption: item.caption || "",
          mediaCount: 1 + (item.children?.data?.length || 0),
          fetchedAt: now.toISOString(),
        };
        fresh.push(post);
        if (postedAt && postedAt >= imageCutoff && post.shortcode) {
          images += await downloadImages(join(mediaRoot, post.shortcode), mediaUrls(item));
        }
      }
      added = fresh.length;
      file.posts = [...fresh, ...file.posts].sort((a, b) =>
        String(b.postedAt).localeCompare(String(a.postedAt)),
      );
      file.mediaCount = mediaCount ?? file.mediaCount ?? null;
      file.latestPostAt = file.posts[0]?.postedAt || file.latestPostAt;
      file.lastFetchedAt = now.toISOString();
      file.fetchError = null;
    } catch (err) {
      if (err instanceof TokenError) {
        console.error(err.message);
        console.error(
          "Renew the token: generate a new long-lived Instagram token for the funkaari account and update INSTAGRAM_ACCESS_TOKEN in .env.local.",
        );
        process.exit(2);
      }
      error = err instanceof Error ? err.message : String(err);
      file.fetchError = error;
      file.lastFetchedAt = now.toISOString();
    }
    writeJson(postsFile(handle), file);
    summary.push({ handle, fetched, added, images, error });
    console.log(
      `${handle.padEnd(32)} fetched ${String(fetched).padStart(3)}  new ${String(added).padStart(3)}  images ${String(images).padStart(3)}${error ? `  ERROR ${error}` : ""}`,
    );
  }

  const totals = summary.reduce(
    (acc, row) => ({
      handles: acc.handles + 1,
      fetched: acc.fetched + row.fetched,
      added: acc.added + row.added,
      images: acc.images + row.images,
      errors: acc.errors + (row.error ? 1 : 0),
    }),
    { handles: 0, fetched: 0, added: 0, images: 0, errors: 0 },
  );
  updateRunLog(run, { fetch: { at: now.toISOString(), ...totals, handles: summary } });
  if (!existsSync(mediaRoot)) mkdirSync(mediaRoot, { recursive: true });
  console.log(
    `\nrun ${run}: ${totals.handles} handles, ${totals.added} new posts, ${totals.images} images, ${totals.errors} errors`,
  );
}

main().catch((err) => {
  console.error(redact(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
