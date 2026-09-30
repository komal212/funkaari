"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  EventFilters as Filters,
  AgeGroup,
  KidsEvent,
  CityId,
} from "@/types/event";
import { AGE_GROUP_LABELS, AREAS, events as catalog } from "@/data/events";
import { areasFromEvents } from "@/lib/filters";
import { buildSearchSuggestions } from "@/lib/search";
import { LISTING_KIND_LABEL, LISTING_KINDS } from "@/lib/listing-kind";
import { ListingKindIcon } from "@/components/CategoryLogo";

interface EventFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  events?: KidsEvent[];
  city?: CityId;
}

const selectClass =
  "filter-select h-10 min-w-[8.5rem] appearance-none rounded-full border-0 bg-lavender-50 px-4 pr-9 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-lavender-300";

const SUGGESTION_KIND: Record<string, string> = {
  event: "Event",
  preschool: "Place",
  area: "Area",
};

export function EventFilters({
  filters,
  onChange,
  events = catalog,
  city = "bangalore",
}: EventFiltersProps) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => buildSearchSuggestions(events, filters.search),
    [events, filters.search]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [filters.search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const applySuggestion = (query: string) => {
    update("search", query);
    setOpen(false);
  };

  const areaOptions = areasFromEvents(events);
  const areas = areaOptions.length > 0 ? areaOptions : [...AREAS];

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.kind !== "all" ||
      filters.ageGroup !== "all" ||
      filters.area !== "all",
  );

  const resetFilters = () => {
    onChange({
      search: "",
      ageGroup: "all",
      area: "all",
      time: "all",
      place: "all",
      kind: "all",
    });
  };

  return (
    <div className="space-y-4">
      <div ref={wrapRef} className="relative">
        <label htmlFor="search" className="sr-only">
          Search events
        </label>
        <div className="flex items-center gap-2 rounded-full bg-white py-2 pl-4 pr-2 shadow-soft ring-1 ring-lavender-100 sm:py-2.5 sm:pl-5 sm:pr-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lavender-100 text-lavender-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="search"
            type="search"
            autoComplete="off"
            placeholder={
              city === "delhi"
                ? "Try pottery, KidZania, Gurugram…"
                : "Try circle time, trek, Jayanagar…"
            }
            value={filters.search}
            onChange={(e) => {
              update("search", e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open || suggestions.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && suggestions[activeIndex]) {
                e.preventDefault();
                applySuggestion(suggestions[activeIndex].query);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className="search-input min-w-0 flex-1 border-0 bg-transparent py-2 text-base text-ink placeholder:text-muted/70 focus:outline-none"
          />
          {filters.search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                update("search", "");
                setOpen(false);
              }}
              className="mr-1 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-lavender-50 hover:text-ink"
            >
              ✕
            </button>
          ) : (
            <span className="hidden rounded-full bg-gradient-to-r from-peach-400 to-peach-500 px-5 py-2 text-sm font-bold text-white shadow-pill sm:inline">
              Find
            </span>
          )}
        </div>

        {open && filters.search.trim().length > 0 && suggestions.length > 0 && (
          <ul
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white py-1 shadow-card ring-1 ring-lavender-100"
            role="listbox"
          >
            {suggestions.map((item, index) => (
              <li key={`${item.kind}-${item.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => applySuggestion(item.query)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                    index === activeIndex ? "bg-lavender-50" : "bg-white"
                  }`}
                >
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="shrink-0 text-xs font-semibold text-muted">
                    {SUGGESTION_KIND[item.kind]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Type
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={filters.kind === "all"}
            onClick={() => update("kind", "all")}
            className={
              filters.kind === "all"
                ? "h-10 rounded-full bg-peach-400 px-4 text-sm font-semibold text-white"
                : "h-10 rounded-full bg-white px-4 text-sm font-semibold text-ink/70 ring-1 ring-lavender-100 hover:bg-lavender-50"
            }
          >
            All types
          </button>
          {LISTING_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={filters.kind === kind}
              onClick={() => update("kind", kind)}
              className={
                filters.kind === kind
                  ? "flex h-10 items-center gap-1.5 rounded-full bg-peach-400 px-3 text-sm font-semibold text-white"
                  : "flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-ink/70 ring-1 ring-lavender-100 hover:bg-lavender-50"
              }
            >
              <ListingKindIcon kind={kind} className="h-5 w-5" />
              {LISTING_KIND_LABEL[kind]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Age
          </p>
          <span className="relative inline-block">
            <select
              aria-label="Age"
              value={filters.ageGroup}
              onChange={(e) => update("ageGroup", e.target.value as AgeGroup | "all")}
              className={selectClass}
            >
              <option value="all">Any age</option>
              {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Chevron />
          </span>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Area
          </p>
          <span className="relative inline-block">
            <select
              aria-label="Area"
              value={filters.area}
              onChange={(e) => update("area", e.target.value)}
              className={selectClass}
            >
              <option value="all">Any area</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <Chevron />
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 px-3 text-sm font-semibold text-muted hover:text-ink"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
      </svg>
    </span>
  );
}
