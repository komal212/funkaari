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

        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl text-balance">
          Make every little moment count.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
          All kinds of events happening nearby — a small playdate in a park, an
          activity at a local café, or a workshop at a playschool.
        </p>

        <a
          href="#events"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-peach-400 to-peach-500 px-8 py-3.5 font-display font-bold text-white shadow-card transition hover:from-peach-500 hover:to-peach-400"
        >
          See what’s on
        </a>
      </div>
    </section>
  );
}
