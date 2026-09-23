/** Local copies of original Instagram event photos. Never use admissions flyers. */

const BLOCKED = new Set(["DdlQlCuxOxp"]);

export const POST_PHOTO: Record<string, string> = {
  Ddk_ypmgVKk: "/events/posts/Ddk_ypmgVKk.jpg",
  Ddl74RvEqGX: "/events/posts/Ddl74RvEqGX.jpg",
  Ddi6EEpgjE2: "/events/posts/Ddi6EEpgjE2.jpg",
  DdjxfZWzyGg: "/events/posts/DdjxfZWzyGg.jpg",
};

export const POST_URL: Record<string, string> = {
  Ddk_ypmgVKk: "https://www.instagram.com/p/Ddk_ypmgVKk/",
  Ddl74RvEqGX: "https://www.instagram.com/p/Ddl74RvEqGX/",
  Ddi6EEpgjE2: "https://www.instagram.com/p/Ddi6EEpgjE2/",
  DdjxfZWzyGg: "https://www.instagram.com/p/DdjxfZWzyGg/",
  Dda3gUgkWj7: "https://www.instagram.com/p/Dda3gUgkWj7/",
  Ddnckl5T2XL: "https://www.instagram.com/p/Ddnckl5T2XL/",
  DdjGzV0SA8J: "https://www.instagram.com/p/DdjGzV0SA8J/",
  "DdWQ--sqoTY": "https://www.instagram.com/p/DdWQ--sqoTY/",
  "DdYkry6IY-j": "https://www.instagram.com/p/DdYkry6IY-j/",
  DdaYeISJrGy: "https://www.instagram.com/p/DdaYeISJrGy/",
  DdBm5sxBi_t: "https://www.instagram.com/p/DdBm5sxBi_t/",
  DdJtleHH0kK: "https://www.instagram.com/p/DdJtleHH0kK/",
  DcgqY_KGjHq: "https://www.instagram.com/p/DcgqY_KGjHq/",
};

export type EventPostKey = "playcove" | "trek" | "circletime" | "littlebeats";

/** Pair a listing with the matching event post (photo + /p/ URL). */
export const EVENT_POST: Record<
  EventPostKey,
  { imageUrl: string; instagramUrl: string }
> = {
  playcove: {
    imageUrl: POST_PHOTO.Ddk_ypmgVKk,
    instagramUrl: POST_URL.Ddk_ypmgVKk,
  },
  trek: {
    imageUrl: POST_PHOTO.Ddl74RvEqGX,
    instagramUrl: POST_URL.Ddl74RvEqGX,
  },
  circletime: {
    imageUrl: POST_PHOTO.Ddi6EEpgjE2,
    instagramUrl: POST_URL.Ddi6EEpgjE2,
  },
  littlebeats: {
    imageUrl: POST_PHOTO.DdjxfZWzyGg,
    instagramUrl: POST_URL.DdjxfZWzyGg,
  },
};

function shortCodeFromImage(imageUrl?: string): string | undefined {
  const match = imageUrl?.match(/\/events\/posts\/([A-Za-z0-9_-]+)\.\w+$/);
  const code = match?.[1];
  if (!code || BLOCKED.has(code)) return undefined;
  return code;
}

export function postUrlFromImage(imageUrl?: string): string | undefined {
  const code = shortCodeFromImage(imageUrl);
  if (!code) return undefined;
  return POST_URL[code];
}

export function photoForPostUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  const code = match?.[1];
  if (!code || BLOCKED.has(code)) return undefined;
  return POST_PHOTO[code];
}
