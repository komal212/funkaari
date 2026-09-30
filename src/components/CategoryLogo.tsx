import type { EventCategory, KidsEvent } from "@/types/event";
import {
  LISTING_KIND_LABEL,
  listingKind,
  type ListingKind,
} from "@/lib/listing-kind";

const STYLE: Record<ListingKind, { field: string; badge: string; label: string }> = {
  playdate: {
    field: "bg-gradient-to-br from-peach-100 via-peach-50 to-lavender-100",
    badge: "bg-peach-200",
    label: "text-peach-500",
  },
  workshop: {
    field: "bg-gradient-to-br from-mint-100 via-mint-50 to-sky-100",
    badge: "bg-mint-200",
    label: "text-mint-500",
  },
  "open-house": {
    field: "bg-gradient-to-br from-lavender-100 via-lavender-50 to-peach-100",
    badge: "bg-lavender-200",
    label: "text-lavender-500",
  },
  nature: {
    field: "bg-gradient-to-br from-sky-100 via-mint-50 to-mint-100",
    badge: "bg-sky-200",
    label: "text-sky-400",
  },
  art: {
    field: "bg-gradient-to-br from-pink-100 via-peach-50 to-lavender-100",
    badge: "bg-pink-200",
    label: "text-pink-500",
  },
  music: {
    field: "bg-gradient-to-br from-sunny-100 via-peach-50 to-lavender-100",
    badge: "bg-sunny-200",
    label: "text-sunny-400",
  },
  festival: {
    field: "bg-gradient-to-br from-orange-100 via-peach-50 to-sunny-100",
    badge: "bg-orange-200",
    label: "text-orange-500",
  },
  sports: {
    field: "bg-gradient-to-br from-peach-100 via-sunny-50 to-sky-100",
    badge: "bg-peach-200",
    label: "text-peach-500",
  },
};

export function ListingKindIcon({
  kind,
  className = "h-8 w-8",
}: {
  kind: ListingKind;
  className?: string;
}) {
  const common = className;
  switch (kind) {
    case "playdate":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <circle cx="16" cy="16" r="6" fill="#F4845F" />
          <circle cx="32" cy="16" r="6" fill="#8B7FD4" />
          <path
            d="M8 38c2-8 6-12 8-12s6 2 8 8c2-6 6-8 8-8s6 4 8 12"
            fill="none"
            stroke="#2D3142"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "workshop":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <rect x="8" y="10" width="22" height="28" rx="3" fill="#fff" />
          <rect x="12" y="16" width="14" height="2.5" rx="1.2" fill="#2BB8AD" />
          <rect x="12" y="22" width="12" height="2.5" rx="1.2" fill="#A8EDD4" />
          <path d="M28 8h12l-3 14H26L28 8z" fill="#F5D547" />
        </svg>
      );
    case "open-house":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <path d="M8 22L24 8l16 14v18H8V22z" fill="#C4B5FD" />
          <rect x="20" y="28" width="8" height="12" rx="1.5" fill="#fff" />
          <circle cx="26" cy="34" r="1.1" fill="#8B7FD4" />
        </svg>
      );
    case "nature":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <circle cx="34" cy="12" r="6" fill="#F5D547" />
          <path d="M10 38l8-16 7 10 5-8 12 14H10z" fill="#7DD3FC" />
          <path d="M18 38V24l6 8" fill="none" stroke="#2BB8AD" strokeWidth="2.2" />
        </svg>
      );
    case "art":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <circle cx="16" cy="16" r="7" fill="#F472B6" />
          <circle cx="32" cy="14" r="5.5" fill="#FB923C" />
          <circle cx="24" cy="30" r="8" fill="#A78BFA" />
        </svg>
      );
    case "music":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <path
            d="M16 36a6 6 0 1 1-1.5-4.1V12l20-5v20.4A6 6 0 1 1 32 36V16.4L16 20.2V36z"
            fill="#E8C030"
          />
        </svg>
      );
    case "festival":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <path d="M8 10h32" stroke="#2D3142" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M12 10l6 14-6 2-4-16z" fill="#F4845F" />
          <path d="M24 10l5 16-6 1-3-17z" fill="#8B7FD4" />
          <path d="M36 10l4 15-6 2-4-17z" fill="#F5D547" />
        </svg>
      );
    case "sports":
      return (
        <svg viewBox="0 0 48 48" className={common} aria-hidden="true">
          <circle cx="24" cy="24" r="14" fill="#FDBA74" />
          <path
            d="M24 10c4 4 7 8 7 14s-3 10-7 14c-4-4-7-8-7-14s3-10 7-14z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
          <path d="M12 20h24M12 28h24" fill="none" stroke="#fff" strokeWidth="2" />
        </svg>
      );
  }
}

export function CategoryLogo({
  category,
  className = "h-11 w-11",
}: {
  category: EventCategory;
  className?: string;
}) {
  const kind: ListingKind =
    category === "camp"
      ? "nature"
      : category === "open day"
        ? "open-house"
        : (category as ListingKind);
  const style = STYLE[kind] ?? STYLE.workshop;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl p-1.5 shadow-md ring-2 ring-white ${style.badge} ${className}`}
      aria-hidden="true"
    >
      <ListingKindIcon kind={kind} className="h-full w-full" />
    </span>
  );
}

export function EventLogoCover({ event }: { event: KidsEvent }) {
  const kind = listingKind(event);
  const style = STYLE[kind];
  const label = LISTING_KIND_LABEL[kind];

  return (
    <div className={`relative h-full min-h-[16rem] w-full ${style.field}`}>
      <div className="pointer-events-none absolute -left-8 top-16 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 bottom-20 h-36 w-36 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pb-16 pt-8">
        <span
          className={`flex h-28 w-28 items-center justify-center rounded-[2rem] shadow-card ring-4 ring-white/80 ${style.badge}`}
        >
          <ListingKindIcon kind={kind} className="h-16 w-16" />
        </span>
        <p className={`font-display text-2xl font-bold ${style.label}`}>{label}</p>
      </div>
    </div>
  );
}
