import type { EventCategory, KidsEvent } from "@/types/event";
import { coverForEvent } from "@/lib/event-quality";

const wrap: Record<EventCategory, { bg: string; ring: string; wash: string }> = {
  workshop: {
    bg: "bg-mint-100",
    ring: "ring-mint-200",
    wash: "from-mint-200 to-mint-400",
  },
  camp: {
    bg: "bg-sky-100",
    ring: "ring-sky-200",
    wash: "from-sky-200 to-sky-400",
  },
  "open day": {
    bg: "bg-lavender-100",
    ring: "ring-lavender-200",
    wash: "from-lavender-200 to-lavender-400",
  },
  sports: {
    bg: "bg-peach-100",
    ring: "ring-peach-200",
    wash: "from-peach-200 to-peach-400",
  },
  art: {
    bg: "bg-pink-100",
    ring: "ring-pink-200",
    wash: "from-pink-200 to-pink-400",
  },
  music: {
    bg: "bg-sunny-100",
    ring: "ring-sunny-200",
    wash: "from-sunny-200 to-sunny-300",
  },
  festival: {
    bg: "bg-orange-100",
    ring: "ring-orange-200",
    wash: "from-orange-200 to-orange-400",
  },
};

/** Illustration that matches this listing — never an Instagram flyer. */
export function eventCoverImage(event: KidsEvent): string {
  return coverForEvent(event, eventLogoKind(event));
}

export function eventLogoKind(event: KidsEvent): EventCategory {
  const text = `${event.title} ${event.description}`.toLowerCase();
  if (/paint|craft|clay|collage|colour|color|messy|circle time/.test(text)) return "art";
  if (/trek|hike|nature|farm|camp|walk|outdoor/.test(text)) return "camp";
  if (/music|beats|drum|sing|song|shaker/.test(text)) {
    return event.category === "festival" ? "festival" : "music";
  }
  if (/football|gym|yoga|sport|kick|turf/.test(text)) return "sports";
  if (/story|book|library|playdate|sensory/.test(text)) return "workshop";
  if (/kidzania|role.?play|open house/.test(text)) return "festival";
  if (/marathon|run|race/.test(text)) return "sports";
  return event.category;
}

function Icon({ kind }: { kind: EventCategory }) {
  const common = "h-full w-full";
  switch (kind) {
    case "art":
      return (
        <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
          <circle cx="10" cy="11" r="4" fill="#F472B6" />
          <circle cx="22" cy="10" r="3.2" fill="#FB923C" />
          <circle cx="16" cy="20" r="4.2" fill="#A78BFA" />
          <path
            d="M8 24c2-5 6-8 10-8 3 0 6 1 8 4"
            fill="none"
            stroke="#5B4B8A"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "sports":
      return (
        <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="#FDBA74" />
          <path
            d="M16 6c3 3 5 6 5 10s-2 7-5 10c-3-3-5-6-5-10s2-7 5-10z"
            fill="none"
            stroke="#fff"
            strokeWidth="1.4"
          />
          <path d="M7 12h18M7 20h18" fill="none" stroke="#fff" strokeWidth="1.4" />
        </svg>
      );
    case "music":
    case "festival":
      return (
        <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
          <path
            d="M12 22a4 4 0 1 1-1-2.8V9l12-3v13.2A4 4 0 1 1 22 22V10.2L12 13v9z"
            fill="#EAB308"
          />
        </svg>
      );
    case "camp":
      return (
        <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
          <path d="M4 22l6-10 5 7 3-5 10 8H4z" fill="#7DD3FC" />
          <circle cx="22" cy="9" r="3" fill="#FDE047" />
        </svg>
      );
    case "open day":
      return (
        <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
          <path d="M6 14l10-8 10 8v12H6V14z" fill="#C4B5FD" />
          <rect x="13" y="18" width="6" height="8" rx="1" fill="#fff" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" className={common} aria-hidden="true">
          <rect x="6" y="8" width="14" height="18" rx="1.5" fill="#fff" />
          <rect x="8" y="11" width="10" height="1.4" rx="0.7" fill="#34D399" />
          <rect x="8" y="15" width="8" height="1.4" rx="0.7" fill="#A8EDD4" />
          <path d="M18 6h6l-2 8h-6L18 6z" fill="#FBBF24" />
        </svg>
      );
  }
}

interface CategoryLogoProps {
  category: EventCategory;
  className?: string;
}

export function CategoryLogo({ category, className = "h-11 w-11" }: CategoryLogoProps) {
  const style = wrap[category] ?? wrap.workshop;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl p-1.5 shadow-md ring-2 ring-white ${style.bg} ${style.ring} ${className}`}
      aria-hidden="true"
    >
      <Icon kind={category} />
    </span>
  );
}

export function EventLogoCover({ event }: { event: KidsEvent }) {
  const kind = eventLogoKind(event);
  const cover = eventCoverImage(event);

  return (
    <div className="relative h-full min-h-[16rem] w-full bg-lavender-50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        onError={(e) => {
          e.currentTarget.src = "/events/story-play.png";
        }}
      />
    </div>
  );
}
