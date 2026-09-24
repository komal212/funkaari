import type { BangaloreArea } from "@/types/event";

/** Neighbourhoods we can stamp from caption, OSM, or a maps snippet. */
export const AREA_MATCH: { re: RegExp; area: BangaloreArea | string }[] = [
  { re: /koramangala|kormangala/i, area: "Koramangala" },
  { re: /indiranagar/i, area: "Indiranagar" },
  { re: /whitefield|itpl|hope farm/i, area: "Whitefield" },
  { re: /hsr/i, area: "HSR Layout" },
  { re: /jayanagar/i, area: "Jayanagar" },
  { re: /bellandur|sarjapur|haralur|kasavanahalli|yemalur/i, area: "Bellandur" },
  { re: /jp\s*nagar|j\.?\s*p\.?\s*nagar|padmanabhanagar/i, area: "JP Nagar" },
  { re: /mallesh?waram|sheshadripuram|sadashivanagar|kumara park|rajaji\s*nagar|vijayanagar|nagarabhavi|nagarbhavi/i, area: "Malleshwaram" },
  { re: /manyata|nagawara|hebbal|yelahanka/i, area: "Hebbal" },
  { re: /electronic\s*city|e-?city/i, area: "Electronic City" },
  { re: /btm\s*layout|\bbtm\b/i, area: "BTM Layout" },
  { re: /marathahalli/i, area: "Marathahalli" },
  { re: /banashankari/i, area: "Banashankari" },
  { re: /basavanagudi/i, area: "Basavanagudi" },
  { re: /richmond\s*town|langford/i, area: "Richmond Town" },
  { re: /frazer\s*town|fraser\s*town|pulakeshinagar/i, area: "Frazer Town" },
  { re: /ulsoor|halasuru/i, area: "Ulsoor" },
  { re: /domlur/i, area: "Domlur" },
  { re: /kalyan\s*nagar|kammanahalli/i, area: "Kalyan Nagar" },
  { re: /hennur/i, area: "Hennur" },
  { re: /mahadevapura/i, area: "Mahadevapura" },
  { re: /bannerghatta/i, area: "Bannerghatta" },
  { re: /\bmg\s*road\b|mahatma gandhi road/i, area: "MG Road" },
];

export function areaFromText(text: string): string | undefined {
  for (const row of AREA_MATCH) {
    if (row.re.test(text)) return row.area;
  }
  return undefined;
}

export function isGenericBangalorePlace(value?: string): boolean {
  const t = (value || "").trim();
  if (!t) return true;
  return /^(bengaluru|bangalore|blr|bengaluru urban|bangalore urban|karnataka|india|see listing|tbd|n\/a)$/i.test(
    t,
  );
}
