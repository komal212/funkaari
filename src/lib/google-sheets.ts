import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { join } from "node:path";
import type { KidsEvent } from "@/types/event";
import {
  eventsToSheetRows,
  sheetRowsToValues,
  statusMapFromSheetValues,
} from "@/lib/events-sheet";

export type GoogleSheetMeta = {
  spreadsheetId: string;
  tab: string;
  url: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

function metaPath(root: string): string {
  return join(root, "src/data/google-sheet.json");
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const file = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  let parsed: unknown;
  try {
    if (raw) parsed = JSON.parse(raw);
    else if (file && existsSync(file)) parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const row = parsed as { client_email?: string; private_key?: string };
  if (!row.client_email || !row.private_key) return null;
  return {
    client_email: row.client_email,
    private_key: row.private_key.replace(/\\n/g, "\n"),
  };
}

async function accessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: account.client_email,
      scope: SCOPES,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${signer.sign(account.private_key, "base64url")}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google auth ${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google auth missing token");
  return data.access_token;
}

async function sheetsFetch(
  token: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export function readSheetMeta(root: string): GoogleSheetMeta | null {
  const fromEnv = process.env.GOOGLE_SHEET_ID?.trim();
  const tab = process.env.GOOGLE_SHEET_TAB?.trim() || "Bengaluru";
  if (fromEnv) {
    return {
      spreadsheetId: fromEnv,
      tab,
      url: `https://docs.google.com/spreadsheets/d/${fromEnv}/edit`,
    };
  }
  const file = metaPath(root);
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as GoogleSheetMeta;
    if (!parsed?.spreadsheetId) return null;
    return {
      spreadsheetId: parsed.spreadsheetId,
      tab: parsed.tab || tab,
      url: parsed.url || `https://docs.google.com/spreadsheets/d/${parsed.spreadsheetId}/edit`,
    };
  } catch {
    return null;
  }
}

function writeSheetMeta(root: string, meta: GoogleSheetMeta) {
  writeFileSync(metaPath(root), `${JSON.stringify(meta, null, 2)}\n`, "utf8");
}

async function createSpreadsheet(token: string, tab: string): Promise<GoogleSheetMeta> {
  const res = await sheetsFetch(token, SHEETS_API, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: "Funkaari Bengaluru events" },
      sheets: [{ properties: { title: tab } }],
    }),
  });
  if (!res.ok) throw new Error(`Google create sheet ${res.status}`);
  const data = (await res.json()) as { spreadsheetId?: string; spreadsheetUrl?: string };
  if (!data.spreadsheetId) throw new Error("Google create sheet missing id");
  return {
    spreadsheetId: data.spreadsheetId,
    tab,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

async function shareSpreadsheet(token: string, spreadsheetId: string, email: string) {
  const res = await sheetsFetch(
    token,
    `${DRIVE_API}/files/${spreadsheetId}/permissions?sendNotificationEmail=true`,
    {
      method: "POST",
      body: JSON.stringify({
        role: "writer",
        type: "user",
        emailAddress: email,
      }),
    },
  );
  if (!res.ok) throw new Error(`Google share sheet ${res.status}`);
}

async function readValues(token: string, meta: GoogleSheetMeta): Promise<string[][]> {
  const range = encodeURIComponent(`${meta.tab}!A:L`);
  const res = await sheetsFetch(
    token,
    `${SHEETS_API}/${meta.spreadsheetId}/values/${range}`,
  );
  if (res.status === 400 || res.status === 404) return [];
  if (!res.ok) throw new Error(`Google read sheet ${res.status}`);
  const data = (await res.json()) as { values?: string[][] };
  return data.values || [];
}

async function writeValues(token: string, meta: GoogleSheetMeta, values: string[][]) {
  const range = encodeURIComponent(`${meta.tab}!A1`);
  const put = await sheetsFetch(
    token,
    `${SHEETS_API}/${meta.spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({
        range: `${meta.tab}!A1`,
        majorDimension: "ROWS",
        values,
      }),
    },
  );
  if (!put.ok) throw new Error(`Google write sheet ${put.status}`);
  const extraStart = values.length + 1;
  await sheetsFetch(
    token,
    `${SHEETS_API}/${meta.spreadsheetId}/values/${encodeURIComponent(`${meta.tab}!A${extraStart}:L1000`)}:clear`,
    { method: "POST", body: "{}" },
  );
}

export async function syncEventsGoogleSheet(
  root: string,
  events: KidsEvent[],
): Promise<{ url?: string; skipped?: string; rows: number }> {
  const account = loadServiceAccount();
  if (!account) {
    return { skipped: "missing_google_service_account", rows: events.length };
  }

  const token = await accessToken(account);
  const tab = process.env.GOOGLE_SHEET_TAB?.trim() || "Bengaluru";
  let meta = readSheetMeta(root);
  if (!meta) {
    meta = await createSpreadsheet(token, tab);
    writeSheetMeta(root, meta);
    const share = process.env.GOOGLE_SHEET_SHARE_EMAIL?.trim();
    if (share) await shareSpreadsheet(token, meta.spreadsheetId, share);
  }

  const existing = await readValues(token, meta);
  const rows = eventsToSheetRows(events, statusMapFromSheetValues(existing));
  await writeValues(token, meta, sheetRowsToValues(rows));
  writeSheetMeta(root, meta);
  return { url: meta.url, rows: rows.length };
}
