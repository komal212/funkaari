import { INSTAGRAM_HASHTAGS } from "@/lib/instagram-parse";
import { POST_URL } from "@/data/post-photos";
import { BANGALORE_FOLLOWED_HANDLES } from "@/data/funkaari-followed-schools";
import { instagramProfileUrl } from "@/lib/instagram";

const ORGANISER_HANDLES = [
  ...BANGALORE_FOLLOWED_HANDLES,
  "play_cove",
  "forumsouthbengaluru",
  "the_two_messy_hands",
  "littlebeatsfestival",
  "ayanaoutdoorsindia",
  "funkaari.in",
  "popapuddle",
];

export const PARALLEL_INSTAGRAM_OBJECTIVE =
  "Extract upcoming dated events for children aged 6 months to 6 years that Bengaluru parents can join (India / IST): workshops, playdates, open houses, magic shows, play-café sessions, storytime, pottery, music, treks, festivals, and similar. For each event include the Instagram post URL (instagram.com/p/...), full caption, date, time, venue or Online, age range and organiser handle. Skip admissions-only posts, adult events, US-timezone classes, classroom recaps, and posts with no calendar date.";

export const PARALLEL_INSTAGRAM_QUERIES = [
  "Bangalore kids events this weekend",
  "Bengaluru playdate open house magic show",
  "Pop-A-Puddle HSR kids",
  "online Zoom kids workshop India",
];

export function bangaloreInstagramUrls(): string[] {
  const tags = INSTAGRAM_HASHTAGS.slice(0, 3).map(
    (tag) => `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`,
  );
  const profiles = [...new Set(ORGANISER_HANDLES)].map((handle) =>
    instagramProfileUrl(handle),
  );
  const posts = Object.values(POST_URL);
  return [...new Set([...posts, ...profiles, ...tags])];
}
