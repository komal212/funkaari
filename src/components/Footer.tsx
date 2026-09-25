"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { InstagramLink } from "@/components/InstagramLink";
import { CITIES, cityMeta } from "@/data/cities";
import type { CityId } from "@/types/event";

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
        <Logo compact />
        <p className="mt-4 max-w-lg font-display text-xl font-bold leading-snug text-ink">
          Built by a mum, for mums.
        </p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          I got tired of digging through WhatsApp groups and Instagram just to
          find one activity for my 1.5-year-old. So I built Funkaari — we
          don&apos;t organise events, we find them so you don&apos;t have to.
        </p>
        <InstagramLink variant="footer" />
        <p className="mt-10 border-t border-white/60 pt-6 text-center text-xs font-medium text-muted">
          Your kids&apos; event guide — updated weekly.
        </p>
      </div>
    </footer>
  );
}
