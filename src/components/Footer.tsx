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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-xs font-display text-lg font-bold leading-snug text-ink">
              Built by a mum, for mums.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Every giggle, every messy art class, every first splash
              in the rain — these are the memories that stay forever.
              We make sure you never miss a moment.
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/#events" className="transition hover:text-ink">All events</Link>
              </li>
              <li>
                <a href="/submit" className="transition hover:text-ink">About Funkaari</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
              Organisers
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <a href="/submit" className="transition hover:text-ink">Submit an event</a>
              </li>
              <li>
                <a href="mailto:hello@funkaari.in?subject=Event%20listing" className="transition hover:text-ink">Email a listing</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
              Connect
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <a
                  href="https://www.instagram.com/funkaari.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-ink"
                >
                  Instagram @funkaari.in
                </a>
              </li>
              <li>
                <a href="mailto:hello@funkaari.in" className="transition hover:text-ink">
                  hello@funkaari.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/60 pt-6 text-center text-xs font-medium text-muted">
          Less scrolling, more giggling.
        </p>
      </div>
    </footer>
  );
}
