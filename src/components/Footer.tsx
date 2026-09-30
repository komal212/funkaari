"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { InstagramLink } from "@/components/InstagramLink";
import { CITIES, cityMeta } from "@/data/cities";
import {
  FUNKAARI_INSTAGRAM_HANDLE,
  FUNKAARI_INSTAGRAM_URL,
} from "@/lib/instagram";
import type { CityId } from "@/types/event";

const LINK =
  "block rounded-lg py-1 text-sm font-semibold text-ink/70 transition hover:text-lavender-500";

export function Footer() {
  const pathname = usePathname();
  const cityId = (CITIES.find((city) => pathname.startsWith(city.href))?.id ??
    "bangalore") as CityId;
  const city = cityMeta(pathname === "/" ? "bangalore" : cityId);
  const line = city.footerLine;

  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-br from-lavender-100 via-peach-50 to-mint-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="blob absolute -left-10 bottom-0 h-40 w-40 bg-lavender-200/40" />
        <div className="blob-alt absolute -right-8 top-0 h-32 w-32 bg-mint-200/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Logo compact />
            </Link>
            <p className="mt-4 max-w-lg font-display text-xl font-bold leading-snug text-ink">
              One platform. Endless little adventures.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              No more scrolling through endless preschool posts or WhatsApp groups.
              {` ${line}`}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-peach-400">
              6 months – 6 years · Bengaluru
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lavender-400">
              Explore
            </p>
            <nav className="mt-3 space-y-1" aria-label="Explore">
              <Link href="/#events" className={LINK}>
                All events
              </Link>
              <Link href="/about" className={LINK}>
                About Funkaari
              </Link>
              <Link href="/about#listings" className={LINK}>
                How listings work
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lavender-400">
              Organisers
            </p>
            <nav className="mt-3 space-y-1" aria-label="Organisers">
              <Link href="/submit" className={LINK}>
                Submit an event
              </Link>
              <a
                href={`mailto:hello@funkaari.in?subject=${encodeURIComponent("Event submission")}`}
                className={LINK}
              >
                Email a listing
              </a>
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lavender-400">
              Connect
            </p>
            <nav className="mt-3 space-y-1" aria-label="Connect">
              <a
                href={FUNKAARI_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
              >
                Instagram @{FUNKAARI_INSTAGRAM_HANDLE}
              </a>
              <a href="mailto:hello@funkaari.in" className={LINK}>
                hello@funkaari.in
              </a>
            </nav>
            <InstagramLink variant="footer" />
          </div>
        </div>

        <p className="mt-10 border-t border-white/60 pt-6 text-center text-xs font-medium text-muted">
          Every little adventure.
        </p>
      </div>
    </footer>
  );
}
