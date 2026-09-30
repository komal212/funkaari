#!/usr/bin/env node
/**
 * Turn a short-lived Instagram/Facebook token into one that lasts.
 *
 *   node scripts/ig/token.mjs
 *
 * Reads from .env.local:
 *   FB_APP_ID, FB_APP_SECRET     Meta app credentials (App dashboard → App settings → Basic)
 *   INSTAGRAM_ACCESS_TOKEN       a fresh short-lived user token (Graph API Explorer)
 *   INSTAGRAM_IG_USER_ID         the Instagram professional account id
 *
 * Steps:
 *   1. Exchange the short-lived user token for a 60-day long-lived user token.
 *   2. List the Facebook Pages that user manages; if one is linked to INSTAGRAM_IG_USER_ID,
 *      take its Page token. Page tokens minted from a long-lived user token never expire.
 *   3. Verify the chosen token with business_discovery and debug_token, then write it back
 *      to .env.local as INSTAGRAM_ACCESS_TOKEN.
 *
 * Prints expiry and token type only. Never prints a token.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadEnv, redact } from "./lib.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";

async function get(path, params) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${GRAPH}${path}?${qs}`, { signal: AbortSignal.timeout(30_000) });
  const json = await res.json();
  if (json.error) throw new Error(`${path}: ${redact(json.error.message)} (code ${json.error.code})`);
  return json;
}

function describeExpiry(info) {
  if (!info.expires_at) return "never expires";
  return `expires ${new Date(info.expires_at * 1000).toISOString().slice(0, 10)}`;
}

function writeEnv(token) {
  const file = join(ROOT, ".env.local");
  const lines = readFileSync(file, "utf8").split("\n");
  let done = false;
  const out = lines.map((line) => {
    if (/^\s*INSTAGRAM_ACCESS_TOKEN\s*=/.test(line)) {
      done = true;
      return `INSTAGRAM_ACCESS_TOKEN=${token}`;
    }
    return line;
  });
  if (!done) out.push(`INSTAGRAM_ACCESS_TOKEN=${token}`);
  writeFileSync(file, out.join("\n"), "utf8");
}

async function main() {
  loadEnv();
  const appId = process.env.FB_APP_ID?.trim();
  const appSecret = process.env.FB_APP_SECRET?.trim();
  const shortToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const igUserId = process.env.INSTAGRAM_IG_USER_ID?.trim();
  for (const [name, value] of Object.entries({ FB_APP_ID: appId, FB_APP_SECRET: appSecret, INSTAGRAM_ACCESS_TOKEN: shortToken, INSTAGRAM_IG_USER_ID: igUserId })) {
    if (!value) {
      console.error(`missing ${name} in .env.local`);
      process.exit(1);
    }
  }

  const appToken = `${appId}|${appSecret}`;
  const before = await get("/debug_token", { input_token: shortToken, access_token: appToken });
  console.log(`current token: ${before.data.type} token, ${describeExpiry(before.data)}${before.data.is_valid ? "" : " (INVALID: generate a fresh short-lived token first)"}`);
  if (!before.data.is_valid) process.exit(1);

  const exchanged = await get("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });
  const longUser = exchanged.access_token;
  const longInfo = await get("/debug_token", { input_token: longUser, access_token: appToken });
  console.log(`long-lived user token: ${describeExpiry(longInfo.data)}`);

  let chosen = longUser;
  let chosenLabel = "long-lived user token";
  try {
    const pages = await get("/me/accounts", { fields: "id,name,access_token,instagram_business_account", access_token: longUser });
    const page = (pages.data || []).find((p) => p.instagram_business_account?.id === igUserId);
    if (page) {
      const pageInfo = await get("/debug_token", { input_token: page.access_token, access_token: appToken });
      console.log(`page token for "${page.name}": ${describeExpiry(pageInfo.data)}`);
      chosen = page.access_token;
      chosenLabel = `page token (${page.name})`;
    } else {
      console.log(`no managed Page is linked to Instagram account ${igUserId}; keeping the 60-day user token`);
    }
  } catch (err) {
    console.log(`could not list Pages (${redact(err instanceof Error ? err.message : String(err))}); keeping the 60-day user token`);
  }

  const check = await get(`/${igUserId}`, {
    fields: "username,business_discovery.username(play_cove){media_count}",
    access_token: chosen,
  });
  console.log(`verified: business_discovery works as @${check.username} with the ${chosenLabel}`);
  writeEnv(chosen);
  console.log("wrote INSTAGRAM_ACCESS_TOKEN to .env.local");
}

main().catch((err) => {
  console.error(redact(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
