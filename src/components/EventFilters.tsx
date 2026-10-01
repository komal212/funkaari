"use client";

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

  const typeOptions: Array<typeof filters.kind> = ["all", ...LISTING_KINDS];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Type
        </p>
        <ul
          className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-lavender-100 sm:grid-cols-3 lg:grid-cols-5"
          role="listbox"
          aria-label="Type"
        >
          {typeOptions.map((kind) => {
            const selected = filters.kind === kind;
            return (
              <li key={kind}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => update("kind", kind)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-semibold ${
                    selected
                      ? "bg-lavender-50 text-ink ring-1 ring-lavender-200"
                      : "text-ink/80 hover:bg-lavender-50"
                  }`}
                >
                  <TypeFilterLogo kind={kind} className="h-12 w-12" />
                  <span className="min-w-0 leading-tight">
                    {kind === "all" ? "All types" : LISTING_KIND_LABEL[kind]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
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
