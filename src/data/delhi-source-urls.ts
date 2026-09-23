import { DELHI_SUPPLIERS_CSV } from "@/data/delhi-suppliers";

/** Known event calendars (not supplier directory rows). */
export const DELHI_SCRAPE_URLS = [
  "https://www.joinin.co.in/",
  "https://www.joinin.co.in/collections/kids",
  "https://go.alivestudio.in/art-cafe-delhi",
  "https://kidywidy.com/",
  "https://www.kidywidy.com/",
  "https://www.district.in/events/kidzania-delhi-ncr-sep26-2026-buy-tickets",
  "https://india.kidzania.com/",
  "https://www.sundernursery.org/summer-workshops-walk-for-kids.php",
  "https://wonderlab.co.in/",
  "https://www.scienceomania.in/",
  "https://www.gameonboard.in/events",
  "https://www.bachpanunplugged.com/",
  "https://www.theclaycompany.in/",
  "https://www.earthenauraceramics.in/",
  "https://taabur.com/in/fun-with-clay-by-shivika-sabharwal",
  "https://clayingthoughts.blogspot.com/p/pottery-classes.html",
];

export const PARALLEL_EXTRACT_OBJECTIVE =
  "Extract upcoming dated kids workshops, play days, festivals, open houses and one-off classes in Delhi, Gurugram, Noida or Delhi NCR for children aged 6 months to 6 years. Include title, calendar date, time, venue, locality, age range, price and booking link. Skip adult-only sessions, online-only wellness, motorcycle classes, and regular weekly courses that have no specific date.";

export const PARALLEL_EXTRACT_QUERIES = [
  "kids workshop Delhi",
  "children event September October",
  "age years",
  "book tickets",
];

function urlsFromCsv(csv: string): string[] {
  const found = csv.match(/https?:\/\/[^\s,"]+/gi) || [];
  return found
    .map((url) => url.replace(/[).]+$/, ""))
    .filter((url) => !/instagram\.com/i.test(url))
    .filter((url) => !/^https?:\/\/(www\.|in\.)?bookmyshow\.com\/?$/i.test(url))
    .filter((url) => !/pvrinox\.com\/?$/i.test(url))
    .filter((url) => !/azurewebsites/i.test(url));
}

/** Unique supplier + calendar URLs, capped for Parallel Extract batches. */
export function delhiScrapeUrls(): string[] {
  return [...new Set([...DELHI_SCRAPE_URLS, ...urlsFromCsv(DELHI_SUPPLIERS_CSV)])].slice(
    0,
    20,
  );
}
