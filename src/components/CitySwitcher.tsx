"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CITIES } from "@/data/cities";

export function CitySwitcher() {
  const pathname = usePathname();
  if (pathname === "/" || CITIES.length < 2) return null;

  return (
    <nav
      aria-label="City"
      className="flex items-center gap-1 rounded-full bg-lavender-50 p-1"
    >
      {CITIES.map((city) => {
        const active =
          pathname === city.href || pathname.startsWith(`${city.href}/`);
        return (
          <Link
            key={city.id}
            href={city.href}
            className={
              active
                ? "rounded-full bg-ink px-3.5 py-1.5 text-sm font-bold text-white"
                : "rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink/70 hover:bg-white hover:text-ink"
            }
          >
            {city.label}
          </Link>
        );
      })}
    </nav>
  );
}
