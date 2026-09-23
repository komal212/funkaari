import Link from "next/link";
import { FUNKAARI_INSTAGRAM_HANDLE, FUNKAARI_INSTAGRAM_URL } from "@/lib/instagram";
import { FunkaariWordmark } from "@/components/Logo";

export function CityPicker() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="blob absolute -left-16 top-0 h-56 w-56 bg-lavender-200/50 sm:h-72 sm:w-72" />
        <div className="blob-alt absolute -right-12 top-20 h-48 w-48 bg-mint-200/40 sm:h-64 sm:w-64" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach-400">
          <FunkaariWordmark />
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl text-balance">
          Where shall we play?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink/80">
          Pick a city for workshops, playdates and weekend adventures — ages 6
          months to 6 years.
        </p>

        <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
          <Link
            href="/bangalore"
            className="group rounded-4xl bg-white p-8 text-left shadow-card ring-1 ring-lavender-100 transition hover:-translate-y-1 hover:shadow-card-hover"
          >
            <span className="text-3xl" aria-hidden="true">
              🌳
            </span>
            <span className="mt-4 block font-display text-2xl font-bold text-ink group-hover:text-lavender-500">
              Bengaluru
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">
              What’s on for the next two months.
            </span>
          </Link>

          <Link
            href="/delhi"
            className="group rounded-4xl bg-white p-8 text-left shadow-card ring-1 ring-lavender-100 transition hover:-translate-y-1 hover:shadow-card-hover"
          >
            <span className="text-3xl" aria-hidden="true">
              🕌
            </span>
            <span className="mt-4 block font-display text-2xl font-bold text-ink group-hover:text-peach-500">
              Delhi
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-muted">
              What’s on this week across NCR.
            </span>
          </Link>
        </div>

        <p className="mt-10 text-sm text-muted">
          Follow{" "}
          <a
            href={FUNKAARI_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-lavender-500 hover:text-lavender-400"
          >
            @{FUNKAARI_INSTAGRAM_HANDLE}
          </a>{" "}
          for new little adventures.
        </p>
      </div>
    </section>
  );
}
