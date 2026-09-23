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
];

export const PARALLEL_INSTAGRAM_OBJECTIVE =
  "Extract upcoming dated kids workshops, playdates, open houses, treks and festivals in Bangalore or Bengaluru for children aged 6 months to 6 years. For each event include the Instagram post URL (instagram.com/p/...), full caption, date, time, venue, neighbourhood, age range and organiser handle. Skip admissions-only posts, adult events, classroom recaps, and posts with no calendar date.";

export const PARALLEL_INSTAGRAM_QUERIES = [
  "Bangalore kids workshop",
  "Bengaluru playdate open house",
  "toddler preschool September October",
  "instagram.com/p/",
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
