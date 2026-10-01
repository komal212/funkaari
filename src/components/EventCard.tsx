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
  const place = event.venue && event.venue !== event.area ? `${event.venue}, ${event.area}` : event.area;
  const blurb = event.description.trim();

  return (
    <article className="flex flex-col gap-5 border-b border-lavender-100 py-8 sm:flex-row sm:items-start sm:gap-8">
      <div className="flex items-start gap-4 sm:contents">
        <div className="w-16 shrink-0 pt-1 text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-muted">{month}</p>
          <div className="mx-auto my-2 h-px w-7 bg-ink/20" />
          <p className="font-display text-4xl font-bold leading-none tracking-tight text-ink">
            {day}
          </p>
        </div>
        <div
          className={`h-32 w-44 shrink-0 overflow-hidden bg-lavender-50 sm:h-36 sm:w-56 ${style.field}`}
        >
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <KindLogoMark kind={kind} className="h-20 w-20" />
            </div>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1 sm:pt-1">
        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${style.label}`}>
          {LISTING_KIND_LABEL[kind]}
        </p>
        <h3 className="mt-1 font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
          {heading}
        </h3>
        <p className="mt-2 text-sm text-muted">{place}</p>
        <p className="mt-0.5 text-sm text-muted">
          {event.time}
          {" · "}
          {formatAgeRange(event)}
          {" · "}
          {price}
        </p>
        {blurb ? (
          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted">
            {blurb}
          </p>
        ) : null}
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
