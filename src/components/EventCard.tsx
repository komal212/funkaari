"use client";

import type { KidsEvent } from "@/types/event";
import { formatEventDate, formatAgeRange } from "@/lib/filters";
import {
  eventHasInstagramPost,
  eventInstagramCta,
  normalizeHandle,
} from "@/lib/instagram";
import { EventLogoCover } from "@/components/CategoryLogo";
import { displayEventDescription, displayEventTitle, isAggregatorIndexUrl } from "@/lib/event-quality";

interface EventCardProps {
  event: KidsEvent;
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
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
    const label = /allevents\.in/i.test(webUrl) ? "Open on AllEvents"
      : /bookmyshow/i.test(webUrl) ? "Book on BookMyShow"
      : `Open ${host}`;
    return { href: webUrl, label, kind: "web" };
  }
  if (instagram) return { ...instagram, kind: "instagram" };
  return null;
}

export function EventCard({ event }: EventCardProps) {
  const cta = sourceCta(event);
  const heading = displayEventTitle(event.title);

  const cover = <EventLogoCover event={event} />;

  return (
    <article className="activity-card group relative flex flex-col overflow-hidden">
      <div className="relative h-24 overflow-hidden bg-lavender-50">
        {cover}
        <div className="pointer-events-none absolute left-2 top-2 z-10">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
              event.isFree
                ? "bg-white/90 text-mint-500"
                : "bg-white/90 text-peach-500"
            }`}
          >
            {event.isFree ? "Free" : event.price ?? "Paid"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-lavender-500 sm:text-lg">
          {heading}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
          {displayEventDescription(event)}
        </p>

        <dl className="mt-3 space-y-1.5 text-xs sm:text-sm">
          <div className="flex items-start gap-2">
            <dt className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-lavender-50 text-xs">
              📅
            </dt>
            <dd>
              <span className="font-semibold text-ink">
                {formatEventDate(event.date, event.ongoing, event.endDate)}
              </span>
              <span className="text-muted"> · {event.time}</span>
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-mint-50 text-xs">
              📍
            </dt>
            <dd className="line-clamp-2">
              <span className="font-semibold text-ink">{event.area}</span>
              <span className="text-muted"> · {event.venue}</span>
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-peach-50 text-xs">
              👶
            </dt>
            <dd className="font-medium text-ink">{formatAgeRange(event)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-50 text-xs">
              🏫
            </dt>
            <dd className="line-clamp-1 font-medium text-ink">{event.organizer}</dd>
          </div>
        </dl>

        <div className="mt-auto pt-3">
          {event.instagramHandle && event.instagramHandle !== "instagram" ? (
            <p className="text-center text-[11px] font-medium text-muted">
              @{normalizeHandle(event.instagramHandle)}
            </p>
          ) : null}
          {cta ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                cta.kind === "instagram"
                  ? "mt-2 flex items-center justify-center gap-1.5 rounded-full bg-[#E1306C] px-3 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#c42a5d] sm:text-sm"
                  : "mt-2 flex items-center justify-center gap-1.5 rounded-full bg-lavender-500 px-3 py-2 text-xs font-bold text-white shadow-md transition hover:bg-lavender-400 sm:text-sm"
              }
            >
              {cta.kind === "instagram" ? <InstagramGlyph /> : null}
              {cta.label}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
