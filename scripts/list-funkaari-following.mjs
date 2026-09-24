#!/usr/bin/env node
/**
 * Pull @funkaari.in following list via Parallel extract. Does not print API keys.
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

const urls = [
  "https://www.instagram.com/funkaari.in/",
  "https://www.instagram.com/funkaari.in/following/",
  "https://www.instagram.com/funkaari.in/followers/",
];

const res = await fetch("https://api.parallel.ai/v1/extract", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  },
  body: JSON.stringify({
    urls,
    objective:
      "From @funkaari.in list every Instagram username the account follows (the Following list). Return as many @handles as possible, plus the following count shown on the profile.",
    search_queries: ["funkaari.in following", "following list", "@"],
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error("extract failed", res.status, body.slice(0, 240));
  process.exit(1);
}

const data = JSON.parse(body);
const texts = (data.results || []).map((row) => ({
  url: row.url,
  text: (row.excerpts || []).join("\n") || row.full_content || "",
}));

const handleRe = /@([A-Za-z0-9._]{2,30})/g;
const pathRe = /instagram\.com\/([A-Za-z0-9._]{2,30})\/?/g;
const skip = new Set([
  "www",
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts",
  "funkaari.in",
  "instagram",
]);
const found = new Set();
for (const row of texts) {
  for (const m of row.text.matchAll(handleRe)) found.add(m[1].toLowerCase());
  for (const m of row.text.matchAll(pathRe)) {
    const h = m[1].toLowerCase();
    if (!skip.has(h)) found.add(h);
  }
}

writeFileSync(
  join(root, "scrape-following-list.json"),
  JSON.stringify(
    {
      pages: texts.map((row) => ({
        url: row.url,
        chars: row.text.length,
        snippet: row.text.replace(/\s+/g, " ").slice(0, 500),
      })),
      handles: [...found].sort(),
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      pages: texts.map((row) => ({ url: row.url, chars: row.text.length })),
      handleCount: found.size,
      handles: [...found].sort(),
    },
    null,
    2,
  ),
);
