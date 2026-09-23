import { NextResponse } from "next/server";
import { delhiEvents } from "@/data/delhi-calendar";
import { scrapeDelhiEvents } from "@/lib/delhi-scrape";
import { mergeDelhiFeeds } from "@/lib/merge-events";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const live = await scrapeDelhiEvents();

  let warning: string | undefined;
  if (live.error === "missing_parallel_api_key") {
    warning =
      "Add PARALLEL_API_KEY to live-scrape supplier pages. Showing dated events we already found.";
  } else if (live.error) {
    warning = `Parallel scrape failed: ${live.error}`;
  } else if (live.source === "parallel" && live.events.length === 0) {
    warning =
      "Parallel ran on supplier sites but found no new dated 6-and-under listings.";
  }

  const events = mergeDelhiFeeds(live.events, delhiEvents);

  return NextResponse.json({
    source:
      live.source === "parallel" && live.events.length > 0
        ? "parallel"
        : "delhi-suppliers",
    scraped: live.events.length,
    pages: live.pages,
    count: events.length,
    warning,
    events,
  });
}
