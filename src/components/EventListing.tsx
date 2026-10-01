"use client";

import { useEffect, useMemo, useState } from "react";
import type { CityId, EventFilters as Filters, KidsEvent } from "@/types/event";
import { events as bangaloreEvents, delhiEvents } from "@/data/events";
import { cityMeta } from "@/data/cities";
import { filterEvents } from "@/lib/filters";
import { EventFilters } from "@/components/EventFilters";
import { EventCard } from "@/components/EventCard";
import { presentEvent } from "@/lib/event-quality";

const defaultFilters: Filters = {
  search: "",
  ageGroup: "all",
  area: "all",
  time: "all",
  place: "all",
  kind: "all",
};

interface EventListingProps {
  city: CityId;
}

export function EventListing({ city }: EventListingProps) {
  const meta = cityMeta(city);
  const fallback = useMemo(
    () => (city === "delhi" ? delhiEvents : bangaloreEvents).map(presentEvent),
    [city],
  );
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [feed, setFeed] = useState<KidsEvent[]>(fallback);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilters(defaultFilters);
    setFeed(fallback);
    setWarning(null);
    setLoading(true);
    let cancelled = false;
    const endpoint =
      city === "delhi" ? "/api/delhi/events" : "/api/instagram/events";
    fetch(endpoint)
      .then(async (res) => {
        if (!res.ok) throw new Error("events api");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.events) && data.events.length > 0) {
          setFeed(data.events.map(presentEvent));
        }
        if (typeof data.warning === "string" && !/parallel|408|still active|ref_id/i.test(data.warning)) {
          setWarning(data.warning);
        }
      })
      .catch(() => {
        if (!cancelled) setFeed(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, fallback]);

  const filteredEvents = useMemo(
    () => filterEvents(feed, filters),
    [feed, filters],
  );

  return (
    <section id="events" className="mx-auto max-w-7xl px-4 pb-12 pt-2 sm:px-6 sm:pb-16 sm:pt-4">
      <div className="relative mb-2 overflow-x-clip sm:mb-8 sm:min-h-[17.5rem] lg:min-h-[20rem]">
        <div className="relative z-10 max-w-xl pt-4 sm:max-w-[50%] sm:py-8 lg:max-w-lg lg:py-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What’s on in {meta.label}
          </h1>
          <p className="mt-2 font-display text-lg font-semibold text-peach-500 sm:text-xl">
            For your little ones.
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Playdates, workshops, open houses, nature walks — scattered across
            Instagram, websites and a hundred other places.
          </p>
          <p className="mt-3 font-display text-lg font-bold text-ink">
            We bring them all here.
          </p>
        </div>
        <img
          src="/listing-playdate-scene.webp"
          alt=""
          width={1280}
          height={720}
          aria-hidden="true"
          className="pointer-events-none mx-auto mt-2 block h-auto w-[min(100%,24rem)] select-none [mask-image:radial-gradient(ellipse_90%_84%_at_58%_52%,#000_42%,transparent_80%)] [-webkit-mask-image:radial-gradient(ellipse_90%_84%_at_58%_52%,#000_42%,transparent_80%)] sm:absolute sm:right-0 sm:top-1/2 sm:mx-0 sm:mt-0 sm:w-[min(46%,34rem)] sm:-translate-y-1/2"
        />
      </div>
      {loading && (
        <p className="mb-4 text-sm font-medium text-muted">Loading events…</p>
      )}
      {warning && (
        <p className="mb-4 rounded-2xl bg-lavender-50 px-4 py-3 text-xs text-lavender-500">
          {warning}
        </p>
      )}

      <EventFilters filters={filters} onChange={setFilters} events={feed} />

      <p className="mt-6 text-sm text-muted">
        {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
      </p>

      {filteredEvents.length === 0 ? (
        <div className="mt-12 rounded-4xl border-2 border-dashed border-lavender-200 bg-lavender-50/50 px-6 py-16 text-center">
          <span className="text-5xl" aria-hidden="true">
            🔎
          </span>
          <p className="mt-4 font-display text-xl font-bold text-ink">
            No events match
          </p>
          <p className="mt-2 text-muted">Try another type, age, or area.</p>
        </div>
      ) : (
        <div className="mt-2">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
