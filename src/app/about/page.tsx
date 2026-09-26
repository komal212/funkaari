import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Funkaari — Our Story",
  description:
    "Funkaari was started by a mum who wanted to make it easier for parents to find the best kids' events. Here's our story.",
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
        &larr; Back to events
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-lavender-200 to-peach-200 text-3xl shadow-soft">
          &hearts;
        </span>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Our Story
        </h1>
      </div>

      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted">
        <p className="text-lg font-semibold text-ink">
          Funkaari was born from a mother&apos;s heart.
        </p>

        <p>
          I&apos;m a mum to a curious, giggly little one who lights up at every
          new sound, colour, and tiny adventure. And like every parent, I wanted
          to give my child the world &mdash; starting with the world right
          outside our door.
        </p>

        <p>
          But finding things to do? That was a different story. A playdate
          announcement buried in an Instagram story. A workshop I found out about
          the day after it happened. A nature walk someone mentioned in a
          WhatsApp group I wasn&apos;t part of. The events were out there &mdash;
          just scattered across a hundred different places.
        </p>

        <p>
          I&apos;d spend nap times scrolling through pages and groups, trying to
          piece together a weekend plan. And I kept thinking &mdash;{" "}
          <em className="font-semibold text-ink">
            why isn&apos;t there just one place for all of this?
          </em>
        </p>

        <p>
          So I built one.
        </p>

        <p className="text-lg font-semibold text-ink">
          That&apos;s Funkaari.
        </p>

        <p>
          A simple place where parents can find every kids&apos; event happening
          nearby &mdash; playdates in the park, art workshops at a cafe, open
          days at playschools, music sessions, nature walks, festivals &mdash;
          all in one page, always up to date.
        </p>

        <p>
          Because these little years don&apos;t wait. Every giggle, every messy
          painting, every wide-eyed &ldquo;wow&rdquo; &mdash; these are the
          moments that become memories. And no parent should miss out on them
          just because they didn&apos;t see a post in time.
        </p>

        <p className="rounded-3xl bg-lavender-50 px-6 py-5 text-center font-display text-lg font-bold text-ink">
          Less scrolling. More giggling.<br />
          That&apos;s the promise.
        </p>

        <p>
          Funkaari is made with love, late nights, and a whole lot of chai. If
          you&apos;re a parent, I hope this helps you find your next little
          adventure. If you run events for kids, I&apos;d love to{" "}
          <Link
            href="/submit"
            className="font-bold text-lavender-500 hover:text-lavender-400"
          >
            feature your event
          </Link>{" "}
          &mdash; it&apos;s free.
        </p>

        <p className="font-semibold text-ink">
          With love,<br />
          A mum who gets it &hearts;
        </p>
      </div>
    </div>
  );
}
