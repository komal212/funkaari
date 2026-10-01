import type { ReactNode } from "react";
import type { EventCategory, KidsEvent } from "@/types/event";
import {
  LISTING_KIND_LABEL,
  listingKind,
  type ListingKind,
} from "@/lib/listing-kind";

export const KIND_STYLE: Record<
  ListingKind,
  { field: string; badge: string; label: string }
> = {
  playdate: {
    field: "bg-gradient-to-br from-peach-100 via-peach-50 to-lavender-100",
    badge: "bg-peach-100",
    label: "text-peach-500",
  },
  workshop: {
    field: "bg-gradient-to-br from-mint-100 via-mint-50 to-sky-100",
    badge: "bg-mint-100",
    label: "text-mint-500",
  },
  "open-house": {
    field: "bg-gradient-to-br from-lavender-100 via-lavender-50 to-peach-100",
    badge: "bg-lavender-100",
    label: "text-lavender-500",
  },
  nature: {
    field: "bg-gradient-to-br from-sky-100 via-mint-50 to-mint-100",
    badge: "bg-sky-100",
    label: "text-sky-400",
  },
  art: {
    field: "bg-gradient-to-br from-pink-100 via-peach-50 to-lavender-100",
    badge: "bg-pink-100",
    label: "text-pink-500",
  },
  music: {
    field: "bg-gradient-to-br from-sunny-100 via-peach-50 to-lavender-100",
    badge: "bg-sunny-100",
    label: "text-sunny-400",
  },
  festival: {
    field: "bg-gradient-to-br from-orange-100 via-peach-50 to-sunny-100",
    badge: "bg-orange-100",
    label: "text-orange-500",
  },
  sports: {
    field: "bg-gradient-to-br from-peach-100 via-sunny-50 to-sky-100",
    badge: "bg-peach-100",
    label: "text-peach-500",
  },
};

function Svg({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function ListingKindIcon({
  kind,
  className = "h-8 w-8",
}: {
  kind: ListingKind;
  className?: string;
}) {
  switch (kind) {
    case "playdate":
      return (
        <Svg className={className}>
          <ellipse cx="16" cy="33" rx="8" ry="9" fill="#FFD0B5" />
          <ellipse cx="32" cy="33" rx="8" ry="9" fill="#DDD4FF" />
          <circle cx="16" cy="16" r="8" fill="#F4845F" />
          <circle cx="32" cy="16" r="8" fill="#8B7FD4" />
          <circle cx="13.5" cy="14.5" r="1.6" fill="#fff" />
          <circle cx="18.2" cy="14.5" r="1.6" fill="#fff" />
          <circle cx="29.5" cy="14.5" r="1.6" fill="#fff" />
          <circle cx="34.2" cy="14.5" r="1.6" fill="#fff" />
          <circle cx="13.7" cy="14.7" r="0.7" fill="#2D3142" />
          <circle cx="18.4" cy="14.7" r="0.7" fill="#2D3142" />
          <circle cx="29.7" cy="14.7" r="0.7" fill="#2D3142" />
          <circle cx="34.4" cy="14.7" r="0.7" fill="#2D3142" />
          <path d="M13 19c1.4 1.6 4.6 1.6 6 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M29 19c1.4 1.6 4.6 1.6 6 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="13" cy="18" r="1.3" fill="#FF9A76" />
          <circle cx="35" cy="18" r="1.3" fill="#C4B5FD" />
          <circle cx="24" cy="40" r="5" fill="#F5D547" />
          <path d="M24 36.2c1.6 1.4 2.6 2.5 2.6 3.8a2.6 2.6 0 1 1-5.2 0c0-1.3 1-2.4 2.6-3.8z" fill="#E8C030" />
        </Svg>
      );
    case "workshop":
      return (
        <Svg className={className}>
          <rect x="8" y="10" width="24" height="30" rx="4" fill="#fff" />
          <rect x="8" y="10" width="24" height="30" rx="4" fill="none" stroke="#A8EDD4" strokeWidth="1.5" />
          <rect x="13" y="16" width="14" height="3" rx="1.5" fill="#2BB8AD" />
          <rect x="13" y="22" width="11" height="3" rx="1.5" fill="#7EEBCC" />
          <rect x="13" y="28" width="13" height="3" rx="1.5" fill="#FFD0B5" />
          <path d="M30 7l12 4.5-6.5 18-12-4.5L30 7z" fill="#F5D547" />
          <path d="M32 12l7 2.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="39.5" cy="11" r="2.2" fill="#F4845F" />
        </Svg>
      );
    case "open-house":
      return (
        <Svg className={className}>
          <path d="M8 22.5 24 7l16 15.5V41H8V22.5z" fill="#C4B5FD" />
          <path d="M8 22.5 24 7l16 15.5" fill="none" stroke="#8B7FD4" strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="14" y="24" width="8" height="8" rx="1.5" fill="#FFF4C2" />
          <rect x="26" y="24" width="8" height="8" rx="1.5" fill="#FFF4C2" />
          <path d="M21 41v-10h6v10" fill="#fff" />
          <circle cx="25.4" cy="36.2" r="1" fill="#8B7FD4" />
          <path d="M33 10h4v6" fill="#F4845F" />
          <ellipse cx="12" cy="41" rx="5" ry="3" fill="#2BB8AD" />
          <circle cx="12" cy="37" r="3.2" fill="#4ECDC4" />
        </Svg>
      );
    case "nature":
      return (
        <Svg className={className}>
          <circle cx="36" cy="12" r="7" fill="#F5D547" />
          <circle cx="33.5" cy="10" r="2" fill="#fff" opacity="0.55" />
          <ellipse cx="24" cy="40" rx="16" ry="5" fill="#A8EDD4" />
          <path d="M24 38c-8-14-4-24 0-24s8 10 0 24z" fill="#2BB8AD" />
          <path d="M24 38c8-12 14-16 16-12 1 3-6 8-16 12z" fill="#4ECDC4" />
          <rect x="22" y="34" width="4" height="8" rx="1.5" fill="#C4A574" />
          <path d="M10 16c3-1 5 2 3 4" fill="none" stroke="#8B7FD4" strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case "art":
      return (
        <Svg className={className}>
          <ellipse cx="22" cy="26" rx="16" ry="13" fill="#FFE5D4" transform="rotate(-18 22 26)" />
          <circle cx="14" cy="22" r="4.2" fill="#F472B6" />
          <circle cx="23" cy="18" r="4.2" fill="#FB923C" />
          <circle cx="31" cy="24" r="4.2" fill="#A78BFA" />
          <circle cx="18" cy="31" r="4.2" fill="#2BB8AD" />
          <circle cx="27" cy="32" r="3.6" fill="#F5D547" />
          <rect x="32" y="6" width="4.5" height="22" rx="2.2" fill="#E8C030" transform="rotate(38 34 17)" />
          <path d="M41 7.5c2.5 2 3 5.5 1 8-3-1.5-6-4-7-7 2.2-.6 4.2-.8 6-1z" fill="#F472B6" />
        </Svg>
      );
    case "music":
      return (
        <Svg className={className}>
          <circle cx="15" cy="36" r="7" fill="#8B7FD4" />
          <circle cx="33" cy="32" r="7" fill="#F4845F" />
          <rect x="20" y="10" width="3.2" height="26" rx="1.4" fill="#2D3142" />
          <rect x="38" y="6" width="3.2" height="26" rx="1.4" fill="#2D3142" />
          <path d="M23.2 10h18v7H23.2z" fill="#F5D547" />
          <circle cx="13.5" cy="34" r="2" fill="#fff" opacity="0.7" />
          <circle cx="31.5" cy="30" r="2" fill="#fff" opacity="0.7" />
        </Svg>
      );
    case "festival":
      return (
        <Svg className={className}>
          <path d="M6 8h36" stroke="#2D3142" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M10 8l6 18-7 1.5L10 8z" fill="#F4845F" />
          <path d="M21 8l6 20-7 1L21 8z" fill="#8B7FD4" />
          <path d="M33 8l5 17-7 1.5L33 8z" fill="#F5D547" />
          <circle cx="12" cy="40" r="2.2" fill="#F472B6" />
          <circle cx="20" cy="37" r="1.7" fill="#2BB8AD" />
          <circle cx="29" cy="41" r="2" fill="#FB923C" />
          <circle cx="38" cy="36" r="1.8" fill="#A78BFA" />
          <path d="M24 30l1.4 3h3.2l-2.6 2 1 3.2L24 36.4 21 38.2l1-3.2-2.6-2h3.2z" fill="#F5D547" />
        </Svg>
      );
    case "sports":
      return (
        <Svg className={className}>
          <circle cx="24" cy="24" r="15" fill="#FF9A76" />
          <path
            d="M24 9c4.6 4.2 7.5 8.6 7.5 15S28.6 34.8 24 39c-4.6-4.2-7.5-8.6-7.5-15S19.4 13.2 24 9z"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
          />
          <path d="M11 18.5h26M11 29.5h26" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="18" cy="16" r="2.4" fill="#fff" opacity="0.45" />
        </Svg>
      );
  }
}

export function KindLogoMark({
  kind,
  className = "h-9 w-9",
}: {
  kind: ListingKind;
  className?: string;
}) {
  const style = KIND_STYLE[kind];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl shadow-sm ring-2 ring-white ${style.badge} ${className}`}
      aria-hidden="true"
    >
      <ListingKindIcon kind={kind} className="h-[78%] w-[78%]" />
    </span>
  );
}

const ALL_KINDS_PREVIEW: ListingKind[] = [
  "playdate",
  "art",
  "nature",
  "music",
];

export function TypeFilterLogo({
  kind,
  className = "h-12 w-12",
}: {
  kind: ListingKind | "all";
  className?: string;
}) {
  if (kind === "all") {
    return (
      <span
        className={`grid shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-xl shadow-sm ring-2 ring-white ${className}`}
        aria-hidden="true"
      >
        {ALL_KINDS_PREVIEW.map((item) => (
          <span
            key={item}
            className={`flex items-center justify-center ${KIND_STYLE[item].badge}`}
          >
            <ListingKindIcon kind={item} className="h-[78%] w-[78%]" />
          </span>
        ))}
      </span>
    );
  }

  return <KindLogoMark kind={kind} className={className} />;
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
  return <KindLogoMark kind={kind} className={className} />;
}

export function EventLogoCover({ event }: { event: KidsEvent }) {
  const kind = listingKind(event);
  const style = KIND_STYLE[kind];
  const label = LISTING_KIND_LABEL[kind];

  return (
    <div className={`relative h-full w-full ${style.field}`}>
      <div className="pointer-events-none absolute -left-4 -top-6 h-16 w-16 rounded-full bg-white/50 blur-xl" />
      <div className="absolute inset-0 flex items-center gap-2.5 px-3.5">
        <KindLogoMark kind={kind} className="h-10 w-10" />
        <p className={`font-display text-base font-bold ${style.label}`}>{label}</p>
      </div>
    </div>
  );
}
