import { NextResponse } from "next/server";
import { bundledLiveFeed, listingFromLiveFeed } from "@/lib/live-feed";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const listing = listingFromLiveFeed(bundledLiveFeed());
  return NextResponse.json({
    source: listing.source,
    count: listing.events.length,
    refreshedAt: listing.refreshedAt || undefined,
    warning: listing.warning,
    events: listing.events,
  });
}
