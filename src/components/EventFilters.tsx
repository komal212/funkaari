"use client";

import { useEffect, useRef, useState } from "react";
import type {
  EventFilters as Filters,
  AgeGroup,
  KidsEvent,
} from "@/types/event";
import { AGE_GROUP_LABELS, AREAS, events as catalog } from "@/data/events";
import { areasFromEvents } from "@/lib/filters";
import { LISTING_KIND_LABEL, LISTING_KINDS } from "@/lib/listing-kind";
import { TypeFilterLogo } from "@/components/CategoryLogo";

interface EventFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  events?: KidsEvent[];
}

const selectClass =
  "filter-select h-10 min-w-[8.5rem] appearance-none rounded-full border-0 bg-lavender-50 px-4 pr-9 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-lavender-300";

export function EventFilters({
  filters,
  onChange,
  events = catalog,
}: EventFiltersProps) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!typeRef.current?.contains(e.target as Node)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Type
          </p>
          <div ref={typeRef} className="relative inline-block">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={typeOpen}
            aria-label="Type"
            onClick={() => setTypeOpen((v) => !v)}
            className={`${selectClass} inline-flex min-w-[11.5rem] items-center gap-2 pl-2.5 text-left`}
          >
            <TypeFilterLogo kind={filters.kind} className="h-8" />
            <span className="flex-1 truncate">
              {filters.kind === "all"
                ? "All types"
                : LISTING_KIND_LABEL[filters.kind]}
            </span>
          </button>
          <Chevron />
          {typeOpen && (
            <ul
              className="absolute left-0 top-full z-30 mt-1 max-h-80 w-[13.5rem] overflow-auto rounded-2xl bg-white py-1 shadow-card ring-1 ring-lavender-100"
              role="listbox"
            >
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={filters.kind === "all"}
                  onClick={() => {
                    update("kind", "all");
                    setTypeOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-semibold ${
                    filters.kind === "all"
                      ? "bg-lavender-50 text-ink"
                      : "text-ink/80 hover:bg-lavender-50"
                  }`}
                >
                  <TypeFilterLogo kind="all" className="h-10" />
                  All types
                </button>
              </li>
              {LISTING_KINDS.map((kind) => (
                <li key={kind}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={filters.kind === kind}
                    onClick={() => {
                      update("kind", kind);
                      setTypeOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-semibold ${
                      filters.kind === kind
                        ? "bg-lavender-50 text-ink"
                        : "text-ink/80 hover:bg-lavender-50"
                    }`}
                  >
                    <TypeFilterLogo kind={kind} className="h-10" />
                    {LISTING_KIND_LABEL[kind]}
                  </button>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>

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
