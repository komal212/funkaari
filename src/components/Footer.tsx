"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { CITIES, cityMeta } from "@/data/cities";
import type { CityId } from "@/types/event";

export function Footer() {
  const pathname = usePathname();
  const cityId = (CITIES.find((city) => pathname.startsWith(city.href))?.id ??
    "bangalore") as CityId;
  const city = cityMeta(pathname === "/" ? "bangalore" : cityId);

  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-br from-lavender-100 via-peach-50 to-mint-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="blob absolute -left-10 bottom-0 h-40 w-40 bg-lavender-200/40" />
        <div className="blob-alt absolute -right-8 top-0 h-32 w-32 bg-mint-200/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-xl text-center">
          <Logo compact />

          <p className="mt-6 font-display text-lg font-bold leading-snug text-ink">
            Built by a mum, for mums.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Hold on to every little moment. Every giggle, every messy
            art class, every first splash in the rain &mdash; these are the
            memories that stay. We make sure you never miss a moment.
          </p>

          <Link
            href="/about"
            className="mt-4 inline-block text-sm font-bold text-lavender-500 transition hover:text-lavender-400"
          >
            Read our story &rarr;
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <Link href="/#events" className="text-ink transition hover:text-lavender-500">
              All events
            </Link>
            <span className="text-lavender-200" aria-hidden="true">&middot;</span>
            <Link href="/submit" className="text-ink transition hover:text-lavender-500">
              Submit an event
            </Link>
            <span className="text-lavender-200" aria-hidden="true">&middot;</span>
            <a
              href="https://www.instagram.com/funkaari.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink transition hover:text-lavender-500"
            >
              @funkaari.in
            </a>
            <span className="text-lavender-200" aria-hidden="true">&middot;</span>
            <a
              href="mailto:hello@funkaari.co.in"
              className="text-ink transition hover:text-lavender-500"
            >
              hello@funkaari.co.in
            </a>
          </div>
        </div>

        <p className="mt-10 border-t border-white/60 pt-6 text-center text-xs font-medium text-muted">
          Less scrolling, more giggling.
        </p>
      </div>
    </footer>
  );
}
