import { NextResponse } from "next/server";
import { events as catalog } from "@/data/events";
import { curatedInstagramPosts } from "@/data/instagram-posts";
import { scrapeBangaloreWide } from "@/lib/bangalore-wide-scrape";
import { fetchBrightDataKidsEvents } from "@/lib/instagram-brightdata";
import { fetchApifyKidsEvents } from "@/lib/instagram-apify";
import { fetchInstagramKidsEvents } from "@/lib/instagram-graph";
import { scrapeBangaloreInstagram } from "@/lib/instagram-parallel";
import { mediaToEvent } from "@/lib/instagram-parse";
import { isInListingWindow } from "@/lib/event-date";
import { eventIsListable } from "@/lib/listable";
import { mergeEventFeeds } from "@/lib/merge-events";
import { isTaskStillRunning } from "@/lib/event-quality";
import type { KidsEvent } from "@/types/event";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function bangaloreWindow(events: KidsEvent[]): KidsEvent[] {
  return events.filter(
    (event) =>
      event.city === "bangalore" &&
      eventIsListable(event) &&
      isInListingWindow(event),
  );
}

function payload(source: string, liveEvents: KidsEvent[], warning?: string) {
  const events = bangaloreWindow(mergeEventFeeds(liveEvents, catalog));
  return {
    source,
    count: events.length,
    warning,
    events,
  };
}

export async function GET() {
  const wide = await scrapeBangaloreWide();
  if (wide.source === "parallel" && wide.events.length > 0) {
    const warning = [
      wide.taskCount
        ? `Parallel Search, Extract and Task found ${wide.events.length} dated Bengaluru listings in the next two months.`
        : `Parallel Search and Extract found ${wide.events.length} dated Bengaluru listings in the next two months.`,
      isTaskStillRunning(wide.error) ? undefined : wide.error,
    ]
      .filter(Boolean)
      .join(" ");
    return NextResponse.json(payload("parallel-web", wide.events, warning));
  }

  const parallel = await scrapeBangaloreInstagram();
  if (parallel.source === "parallel" && parallel.events.length > 0) {
    return NextResponse.json(
      payload("parallel-instagram", parallel.events, parallel.error),
    );
  }

  const live = await fetchInstagramKidsEvents();
  if (live.source === "graph" && live.events.length > 0) {
    return NextResponse.json(payload("instagram-graph", live.events, live.error));
  }

  const apify = await fetchApifyKidsEvents();
  if (apify.source === "apify" && apify.events.length > 0) {
    return NextResponse.json(payload("apify", apify.events, apify.error));
  }

  const bright = await fetchBrightDataKidsEvents();
  if (bright.source === "brightdata" && bright.events.length > 0) {
    return NextResponse.json(
      payload("brightdata", bright.events, bright.error),
    );
  }

  const curated = curatedInstagramPosts
    .map(mediaToEvent)
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return NextResponse.json(
    payload(
      "instagram-curated",
      curated,
      "Bengaluru lists dated events with a booking page, website, or public Instagram post.",
    ),
  );
}
