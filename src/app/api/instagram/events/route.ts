import { NextResponse } from "next/server";
import { events as catalog } from "@/data/events";
import { mergeEventFeeds } from "@/lib/merge-events";
import { bundledLiveFeed, listingFromLiveFeed } from "@/lib/live-feed";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  try {
    const listing = listingFromLiveFeed(bundledLiveFeed());
    return NextResponse.json({
      source: listing.source,
      count: listing.events.length,
      refreshedAt: listing.refreshedAt || undefined,
      warning: listing.warning,
      events: listing.events,
    });
  } catch {
    const events = mergeEventFeeds([], catalog);
    return NextResponse.json({
      source: "catalog",
      count: events.length,
      events,
    });
  }
}
