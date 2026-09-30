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
    <section id="events" className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          What’s on in {meta.label}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Playdates, workshops, open houses, nature walks — scattered across
          Instagram, websites and a hundred other places.
        </p>
        <p className="mt-3 max-w-2xl font-display text-lg font-bold text-ink">
          We bring them all here.
        </p>
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
            Try another type, age, or area
            {city === "delhi"
              ? " — or search pottery, Noida, Gurugram."
              : " — or search workshop, trek, Koramangala."}
          </p>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
