"use client";

import { useEffect, useMemo, useState } from "react";
import type { CityId, EventFilters as Filters, KidsEvent } from "@/types/event";
import { events as bangaloreEvents, delhiEvents } from "@/data/events";
import { cityMeta } from "@/data/cities";
import { filterEvents } from "@/lib/filters";
import { compareListingEvents, isUpcomingEvent } from "@/lib/event-date";
import { EventFilters } from "@/components/EventFilters";
import { EventCard } from "@/components/EventCard";
import { presentEvent } from "@/lib/event-quality";

const defaultFilters: Filters = {
  search: "",
  ageGroup: "all",
  category: "all",
  area: "all",
  time: "all",
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
      .then((res) => res.json())
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
        if (!cancelled) {
          setWarning(
            city === "delhi"
              ? "Could not refresh the Delhi list."
              : "Could not refresh Bengaluru events.",
          );
        }
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
  const upcomingEvents = useMemo(
    () => filteredEvents.filter((event) => isUpcomingEvent(event)).sort(compareListingEvents),
    [filteredEvents],
  );
  const overEvents = useMemo(
    () => filteredEvents.filter((event) => !isUpcomingEvent(event)).sort(compareListingEvents),
    [filteredEvents],
  );

  return (
    <section id="events" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-peach-400">
          {meta.label} diary
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          What’s on in {meta.label}
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          {meta.listingLine}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-peach-100 px-3.5 py-1.5 text-xs font-bold text-peach-500">
            6 months – 6 years
          </span>
          <span className="rounded-full bg-mint-100 px-3.5 py-1.5 text-xs font-bold text-mint-500">
            {city === "delhi" ? "This week & weekend" : "Next 2 months"}
          </span>
          <span className="rounded-full bg-lavender-100 px-3.5 py-1.5 text-xs font-bold text-lavender-500">
            {meta.chip}
          </span>
        </div>
      </div>
      {loading && (
        <p className="mb-4 text-sm font-medium text-muted">Loading events…</p>
      )}
      {warning && (
        <p className="mb-4 rounded-2xl bg-lavender-50 px-4 py-3 text-xs text-lavender-500">
          {warning}
        </p>
      )}

      <EventFilters
        filters={filters}
        onChange={setFilters}
        events={feed}
        city={city}
      />

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
          <p className="mt-2 text-muted">
            Try a simpler word
            {city === "delhi"
              ? " (pottery, Noida, Gurugram)"
              : " (workshop, trek, Koramangala)"}{" "}
            or pick another area.
          </p>
        </div>
      ) : (
        <>
          {upcomingEvents.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : null}
          {overEvents.length > 0 ? (
            <div className="mt-12">
              <h3 className="font-display text-2xl font-bold text-ink">
                Just got over
              </h3>
              <p className="mt-1 text-sm text-muted">
                Recently finished, still on the page.
              </p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {overEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
