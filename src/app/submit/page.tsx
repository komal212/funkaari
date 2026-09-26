import type { Metadata } from "next";
import Link from "next/link";
import { FUNKAARI_INSTAGRAM_HANDLE, FUNKAARI_INSTAGRAM_URL } from "@/lib/instagram";

export const metadata: Metadata = {
  title: "Submit an Event — Funkaari",
  description:
    "Preschools and activity centers: share your Instagram event post to be listed for Bangalore parents.",
};

export default function SubmitPage() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute -right-8 top-8 h-32 w-32 rounded-full bg-lavender-200/40 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-8 bottom-24 h-28 w-28 rounded-full bg-mint-200/40 blur-2xl" aria-hidden="true" />

      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-full bg-lavender-50 px-4 py-2 text-sm font-bold text-lavender-500 transition hover:bg-lavender-100"
      >
        ← Back to events
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-lavender-200 to-peach-200 text-3xl shadow-soft">
          📝
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Submit an event
          </h1>
          <p className="mt-1 text-sm font-medium text-lavender-400">
            Share your event with Bangalore parents
          </p>
        </div>
      </div>

      <p className="mt-6 leading-relaxed text-muted">
        Running a workshop, camp, or open day for children{" "}
        <strong className="font-bold text-ink">6 months to 6 years</strong> in Bangalore?
        Share your Instagram post (or tag{" "}
        <a
          href={FUNKAARI_INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-lavender-500 hover:text-lavender-400"
        >
          @{FUNKAARI_INSTAGRAM_HANDLE}
        </a>
        ) and we&apos;ll add it to our curated feed — free for MVP.
      </p>

      <form
        action="mailto:hello@funkaari.co.in?subject=Event%20submission"
        method="POST"
        encType="text/plain"
        className="mt-10 space-y-6 rounded-4xl bg-white/90 p-6 shadow-card ring-1 ring-lavender-100 sm:p-8"
      >
        <div>
          <label htmlFor="preschool" className="block text-sm font-bold text-ink">
            Preschool / organizer name
          </label>
          <input
            id="preschool"
            name="preschool"
            type="text"
            required
            placeholder="e.g. Little Sprouts Montessori"
            className="mt-2 w-full rounded-2xl border-0 bg-lavender-50/80 px-4 py-3.5 text-sm font-medium ring-1 ring-lavender-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-300"
          />
        </div>

        <div>
          <label htmlFor="instagram" className="block text-sm font-bold text-ink">
            Instagram post URL
          </label>
          <input
            id="instagram"
            name="instagram"
            type="url"
            required
            placeholder="https://www.instagram.com/yourpreschool/"
            className="mt-2 w-full rounded-2xl border-0 bg-lavender-50/80 px-4 py-3.5 text-sm font-medium ring-1 ring-lavender-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-300"
          />
        </div>

        <div>
          <label htmlFor="details" className="block text-sm font-bold text-ink">
            Event details (optional)
          </label>
          <textarea
            id="details"
            name="details"
            rows={4}
            placeholder="Date, time, location, age range, and anything else parents should know"
            className="mt-2 w-full rounded-2xl border-0 bg-lavender-50/80 px-4 py-3.5 text-sm font-medium ring-1 ring-lavender-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-300"
          />
        </div>

        <div>
          <label htmlFor="contact" className="block text-sm font-bold text-ink">
            Your email or phone
          </label>
          <input
            id="contact"
            name="contact"
            type="text"
            required
            placeholder="We'll reach out if we need more info"
            className="mt-2 w-full rounded-2xl border-0 bg-lavender-50/80 px-4 py-3.5 text-sm font-medium ring-1 ring-lavender-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-300"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-lavender-400 to-lavender-500 py-4 font-display font-bold text-white shadow-card transition hover:from-lavender-500 hover:to-lavender-400 hover:shadow-card-hover"
        >
          Send submission ✨
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Prefer email? Write to{" "}
        <a
          href="mailto:hello@funkaari.co.in?subject=Event%20submission"
          className="font-bold text-lavender-500 hover:text-lavender-400"
        >
          hello@funkaari.co.in
        </a>
      </p>
    </div>
  );
}
