"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { CITIES, cityMeta } from "@/data/cities";
import type { CityId } from "@/types/event";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

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
              Hold on to every little moment. Every giggle, every messy
              art class, every first splash in the rain &mdash; these are the
              memories that stay. We make sure you never miss a moment.
            </p>
          </div>

          <div>
            <Link
              href="/about"
              className="font-display text-sm font-bold uppercase tracking-widest text-ink transition hover:text-lavender-500"
            >
              Our Story &rarr;
            </Link>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/#events" className="transition hover:text-ink">All events</Link>
              </li>
              <li>
                <Link href="/submit" className="transition hover:text-ink">Submit an event</Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-ink">Our story</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-ink">
              Connect
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>
                <a
                  href="https://www.instagram.com/funkaari.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-ink"
                >
                  <InstagramIcon />
                  @funkaari.in
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@funkaari.co.in"
                  className="inline-flex items-center gap-2 transition hover:text-ink"
                >
                  <EmailIcon />
                  hello@funkaari.co.in
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
