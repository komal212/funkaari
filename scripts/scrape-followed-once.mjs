#!/usr/bin/env node
/**
 * One-shot Parallel extract of @funkaari.in followed Bangalore profiles.
 * Does not print API keys.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
  const eq = trimmed.indexOf("=");
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
  if (!process.env[key]) process.env[key] = value;
}

const apiKey = process.env.PARALLEL_API_KEY?.trim();
if (!apiKey) {
  console.error("missing PARALLEL_API_KEY");
  process.exit(1);
}

const followed = readFileSync(
  join(root, "src/data/funkaari-followed-schools.ts"),
  "utf8",
);
const handles = [
  ...new Set(
    [
      ...[...followed.matchAll(/handle: "([^"]+)",[\s\S]*?city: "bangalore"/g)].map(
        (m) => m[1],
      ),
      "play_cove",
      "forumsouthbengaluru",
      "the_two_messy_hands",
      "littlebeatsfestival",
      "ayanaoutdoorsindia",
      "funkaari.in",
    ].filter(Boolean),
  ),
];
const urls = handles.map((h) => `https://www.instagram.com/${h}/`);

const OBJECTIVE =
  "Extract upcoming dated kids workshops, playdates, open houses, treks and festivals in Bangalore or Bengaluru. For each event include the Instagram post URL (instagram.com/p/...), full caption, date, time, venue and age range. Skip admissions-only posts, adult events, classroom recaps, and posts with no calendar date.";

const BATCH = 20;
function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function extractBatch(batch) {
  const res = await fetch("https://api.parallel.ai/v1/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      urls: batch,
      objective: OBJECTIVE,
      search_queries: [
        "Bangalore kids workshop",
        "open house playdate",
        "instagram.com/p/",
      ],
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    return { error: `extract ${res.status}: ${body.slice(0, 200)}`, results: [] };
  }
  const data = JSON.parse(body);
  return { error: undefined, results: data.results || [] };
}

const pages = [];
const errors = [];
const batches = chunk(urls, BATCH);
for (let i = 0; i < batches.length; i += 2) {
  const slice = batches.slice(i, i + 2);
  const nested = await Promise.all(slice.map(extractBatch));
  for (const row of nested) {
    if (row.error) errors.push(row.error);
    for (const item of row.results) {
      const text = (item.excerpts || []).join("\n\n") || item.full_content || "";
      if (item.url && String(text).trim()) {
        pages.push({ url: item.url, title: item.title || "", text: String(text) });
      }
    }
  }
}

const postRe = /instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|tv)\/([A-Za-z0-9_-]+)/gi;
const dateRe =
  /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;

const posts = [];
for (const page of pages) {
  const handle = page.url.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1] || "";
  const codes = [...page.text.matchAll(postRe)].map((m) => m[1]);
  posts.push({
    handle,
    url: page.url,
    chars: page.text.length,
    postCodes: [...new Set(codes)].slice(0, 12),
    hasDate: dateRe.test(page.text),
    snippet: page.text.replace(/\s+/g, " ").slice(0, 280),
  });
}

const out = join(root, "scrape-followed-once.json");
writeFileSync(out, JSON.stringify({ handles: handles.length, errors, pages: posts }, null, 2));
console.log(
  JSON.stringify(
    {
      profiles: handles.length,
      pages: pages.length,
      withPosts: posts.filter((p) => p.postCodes.length).length,
      withDates: posts.filter((p) => p.hasDate).length,
      errors: errors.length,
      sample: posts.filter((p) => p.postCodes.length || p.hasDate).slice(0, 15),
    },
    null,
    2,
  ),
);
