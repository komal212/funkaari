import type { Metadata } from "next";
import Link from "next/link";
import { FUNKAARI_INSTAGRAM_HANDLE, FUNKAARI_INSTAGRAM_URL } from "@/lib/instagram";

export const metadata: Metadata = {
  title: "About — Funkaari",
  description:
    "Funkaari was started by a mum so Bengaluru parents can find dated playdates, workshops, and nearby fun for children aged 6 months to 6 years — in one place.",
};

export default function AboutPage() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div
        className="pointer-events-none absolute -right-8 top-8 h-32 w-32 rounded-full bg-lavender-200/40 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-8 bottom-24 h-28 w-28 rounded-full bg-mint-200/40 blur-2xl"
        aria-hidden="true"
      />

      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-full bg-lavender-50 px-4 py-2 text-sm font-bold text-lavender-500 transition hover:bg-lavender-100"
      >
        ← Back to events
      </Link>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-peach-400">
        Started by a mum
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
        About Funkaari
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ink/85">
        Funkaari was started by a mum who knew that feeling: a Saturday with a
        little one, and no idea what was actually on. The playdate lived in a
        WhatsApp group. The café morning was an Instagram story that vanished.
        The workshop was three scrolls down a preschool page, between last
        week&apos;s photos and an admissions flyer. By the time she found it, it
        was already over.
      </p>
      <p className="mt-5 leading-relaxed text-muted">
        These years are short —{" "}
        <strong className="font-bold text-ink">6 months to 6 years</strong> —
        and they should not be spent hunting. Funkaari is one calm place for
        dated things little kids can go to in Bengaluru: a park playdate, a
        local café, a playschool workshop, a magic show, a nature walk, or an
        India/IST morning online. Not a school directory. Just what&apos;s on,
        while the little moment is still in front of you.
      </p>

      <h2 id="listings" className="mt-10 font-display text-xl font-bold text-ink">
        How listings work
      </h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
        <li>Every card has a real calendar date. Past days drop off by themselves.</li>
        <li>
          We look at public event pages and Instagram posts — not profile homepages
          or undated weekly class flyers.
        </li>
        <li>We do not invent dates, venues, or events.</li>
        <li>Funkaari is not a school or preschool directory.</li>
      </ul>

      <h2 className="mt-10 font-display text-xl font-bold text-ink">
        Organisers
      </h2>
      <p className="mt-4 leading-relaxed text-muted">
        Running something for this age group?{" "}
        <Link href="/submit" className="font-bold text-lavender-500 hover:text-lavender-400">
          Submit an event
        </Link>{" "}
        or tag{" "}
        <a
          href={FUNKAARI_INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-lavender-500 hover:text-lavender-400"
        >
          @{FUNKAARI_INSTAGRAM_HANDLE}
        </a>
        . Every listing is reviewed first — we post it only after it is approved.
      </p>

      <p className="mt-10 text-sm text-muted">
        Questions? Write to{" "}
        <a
          href="mailto:hello@funkaari.in"
          className="font-bold text-lavender-500 hover:text-lavender-400"
        >
          hello@funkaari.in
        </a>
        .
      </p>
    </div>
  );
}
