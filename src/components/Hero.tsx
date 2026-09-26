import type { CityId } from "@/types/event";
import { FunkaariWordmark } from "@/components/Logo";
import { cityMeta } from "@/data/cities";

export function Hero({ city = "bangalore" }: { city?: CityId }) {
  const place = cityMeta(city).label;

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="blob absolute -left-16 top-0 h-56 w-56 bg-lavender-200/50 sm:h-72 sm:w-72" />
        <div className="blob-alt absolute -right-12 top-20 h-48 w-48 bg-mint-200/40 sm:h-64 sm:w-64" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="inline-flex items-baseline justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-peach-400">
          <FunkaariWordmark />
          <span aria-hidden="true">·</span>
          {place}
        </p>

        <h1 className="mt-4 flex flex-col items-center gap-1 font-display text-4xl font-bold text-ink sm:text-5xl sm:gap-2">
          <span>Little humans.</span>
          <span>Big adventures.</span>
          <span>All in one place.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink/80">
          Playdates, workshops, open houses, nature walks —
          scattered across Instagram, websites and a hundred
          other places.
        </p>
        <p className="mx-auto mt-2 max-w-lg text-lg font-semibold text-ink">
          We bring them all here. Ages 6&nbsp;mo–6&nbsp;yr.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#events"
            className="inline-flex rounded-full bg-gradient-to-r from-peach-400 to-peach-500 px-8 py-3.5 font-display font-bold text-white shadow-card transition hover:from-peach-500 hover:to-peach-400"
          >
            Explore events
          </a>
          <a
            href="/submit"
            className="inline-flex rounded-full border-2 border-lavender-300 px-8 py-3.5 font-display font-bold text-lavender-500 transition hover:bg-lavender-50"
          >
            Organisers: Add your event
          </a>
        </div>
      </div>
    </section>
  );
}
