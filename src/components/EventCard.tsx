"use client";

import type { KidsEvent } from "@/types/event";
import { formatEventDate, formatAgeRange } from "@/lib/filters";
import {
  eventHasInstagramPost,
  eventInstagramCta,
} from "@/lib/instagram";
import { KIND_STYLE } from "@/components/CategoryLogo";
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

export function EventCard({ event }: EventCardProps) {
  const cta = sourceCta(event);
  const heading = displayEventTitle(event.title);
  const kind = listingKind(event);
  const style = KIND_STYLE[kind];

  const price = event.isFree ? "Free" : event.price ?? "Paid";

  return (
    <article className="border-b border-lavender-100 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className={`font-display text-sm font-bold ${style.label}`}>
          {LISTING_KIND_LABEL[kind]}
        </p>
        <p className={`text-sm font-semibold ${event.isFree ? "text-mint-500" : "text-peach-500"}`}>
          {price}
        </p>
      </div>
      <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink sm:text-xl">
        {cta ? (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-lavender-500"
          >
            {heading}
          </a>
        ) : (
          heading
        )}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">
        {formatEventDate(event.date, event.ongoing, event.endDate)}
        {" · "}
        {event.time}
        {" · "}
        {event.area}
        {" · "}
        {formatAgeRange(event)}
        {cta ? (
          <>
            {" · "}
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lavender-500 hover:text-lavender-400"
            >
              {cta.kind === "instagram" ? "See post" : cta.label}
            </a>
          </>
        ) : null}
      </p>
    </article>
  );
}
