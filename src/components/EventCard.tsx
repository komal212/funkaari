"use client";

import type { KidsEvent } from "@/types/event";
import { formatEventDate, formatAgeRange } from "@/lib/filters";
import {
  eventHasInstagramPost,
  eventInstagramCta,
} from "@/lib/instagram";
import { KIND_STYLE, KindLogoMark } from "@/components/CategoryLogo";
import { LISTING_KIND_LABEL, listingKind } from "@/lib/listing-kind";
import { displayEventTitle, isAggregatorIndexUrl } from "@/lib/event-quality";

interface EventCardProps {
  event: KidsEvent;
}

function sourceCta(event: KidsEvent): { href: string; label: string; kind: "instagram" | "web" } | null {
  const instagram = eventInstagramCta(event);
  if (eventHasInstagramPost(event) && instagram) {
    return { ...instagram, kind: "instagram" };
  }
  const booking = event.bookingUrl;
  const website = event.website;
  const webUrl = booking && !isAggregatorIndexUrl(booking) ? booking : website && !isAggregatorIndexUrl(website) ? website : null;
  if (webUrl && !/instagram\.com/i.test(webUrl)) {
    const host = webUrl.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    const label = /allevents\.in/i.test(webUrl) ? "AllEvents"
      : /bookmyshow/i.test(webUrl) ? "BookMyShow"
      : host.replace(/^www\./, "");
    return { href: webUrl, label, kind: "web" };
  }
  if (instagram) return { ...instagram, kind: "instagram" };
  return null;
}

function dateMark(event: KidsEvent): { month: string; day: string } {
  if (event.ongoing) return { month: "ANY", day: "DAY" };
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) return { month: "—", day: "—" };
  return {
    month: start
      .toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })
      .toUpperCase(),
    day: start.toLocaleDateString("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" }),
  };
}

export function EventCard({ event }: EventCardProps) {
  const cta = sourceCta(event);
  const heading = displayEventTitle(event.title);
  const kind = listingKind(event);
  const style = KIND_STYLE[kind];
  const { month, day } = dateMark(event);
  const price = event.isFree ? "Free" : event.price ?? "Paid";
  const venue = event.venue?.trim() ?? "";
  const area = event.area?.trim() ?? "";
  const place =
    !venue || venue.toLowerCase() === area.toLowerCase()
      ? area
      : area && venue.toLowerCase().includes(area.toLowerCase())
        ? venue
        : area
          ? `${venue}, ${area}`
          : venue;
  const blurb = event.description.trim();

  return (
    <article className="border-b border-lavender-100 py-5 sm:flex sm:items-start sm:gap-8 sm:py-8">
      <div className="flex items-start gap-3 sm:contents">
      <div className="w-12 shrink-0 text-center sm:w-16 sm:pt-1">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted sm:text-xs sm:tracking-[0.22em]">
          {month}
        </p>
        <div className="mx-auto my-1.5 h-px w-6 bg-ink/20 sm:my-2 sm:w-7" />
        <p className="font-display text-3xl font-bold leading-none tracking-tight text-ink sm:text-4xl">
          {day}
        </p>
      </div>
      <div
        className={`aspect-[3/4] w-[7.5rem] shrink-0 overflow-hidden rounded-xl bg-lavender-50 sm:w-48 sm:rounded-none ${style.field}`}
      >
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full min-w-0 object-cover object-center"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <KindLogoMark kind={kind} className="h-16 w-16 sm:h-20 sm:w-20" />
          </div>
        )}
      </div>
      </div>
      <div className="mt-3 min-w-0 sm:mt-0 sm:flex-1 sm:pt-1">
        <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] ${style.label}`}>
          <KindLogoMark kind={kind} className="h-8 w-8" />
          {LISTING_KIND_LABEL[kind]}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink [overflow-wrap:anywhere] sm:text-2xl">
          {heading}
        </h3>
        <div className="mt-2 space-y-1 text-left text-sm leading-snug text-muted">
          <p>{place}</p>
          <p>
            {event.time}
            {" · "}
            {formatAgeRange(event)}
            {" · "}
            {price}
          </p>
          {blurb ? <p className="line-clamp-2 leading-relaxed">{blurb}</p> : null}
        </div>
        {cta ? (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 border-b border-ink/20 pb-0.5 text-sm font-semibold text-ink transition hover:border-lavender-400 hover:text-lavender-500"
          >
            {cta.kind === "instagram" ? "See post" : "View details"}
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
        {event.endDate ? (
          <p className="mt-3 text-xs text-muted">
            {formatEventDate(event.date, event.ongoing, event.endDate)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
