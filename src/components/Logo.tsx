interface LogoMarkProps {
  className?: string;
}

/** Small kid mid-jump. */
export function LogoMark({ className = "h-10 w-10" }: LogoMarkProps) {
  return (
    <span
      className={`relative inline-block overflow-hidden rounded-2xl bg-[#FFF6E8] shadow-sm ring-1 ring-peach-100 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        className="h-full w-full object-cover object-center"
      />
    </span>
  );
}

/** The u in Funkaari is a smile with two eyes. */
function SmileU() {
  return (
    <span
      className="relative mx-[0.02em] inline-block h-[1em] w-[0.78em] align-[-0.08em]"
      aria-hidden="true"
    >
      <span className="absolute left-[18%] top-[10%] h-[0.15em] w-[0.15em] rounded-full bg-current" />
      <span className="absolute right-[18%] top-[10%] h-[0.15em] w-[0.15em] rounded-full bg-current" />
      <svg
        viewBox="0 0 36 28"
        className="absolute inset-x-0 bottom-[0.02em] h-[0.72em] w-full"
        fill="none"
      >
        <path
          d="M5 2c.4 13 6.8 22 13 22S30.6 15 31 2"
          stroke="currentColor"
          strokeWidth="5.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function FunkaariWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline ${className}`} aria-label="Funkaari">
      <span aria-hidden="true">F</span>
      <SmileU />
      <span aria-hidden="true">nkaari</span>
    </span>
  );
}

interface LogoProps {
  compact?: boolean;
  subtitle?: boolean;
}

export function Logo({ compact = false, subtitle = true }: LogoProps) {
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <LogoMark className={compact ? "h-10 w-10" : "h-12 w-12"} />
      <span className="min-w-0">
        <span className="block font-display text-lg font-bold leading-none tracking-tight text-ink sm:text-xl">
          <FunkaariWordmark />
        </span>
        {subtitle && !compact && (
          <span className="mt-1 hidden text-[11px] font-semibold uppercase tracking-wider text-peach-400 sm:block">
            every little moment
          </span>
        )}
      </span>
    </span>
  );
}
