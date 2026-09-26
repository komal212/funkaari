import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Submit an Event — Funkaari",
  description:
    "Organisers: list your kids' event on Funkaari for free. Workshops, camps, open days — parents are looking.",
};

const inputClass =
  "mt-2 w-full rounded-2xl border-0 bg-lavender-50/80 px-4 py-3.5 text-sm font-medium ring-1 ring-lavender-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender-300";

export default function SubmitPage() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute -right-8 top-8 h-32 w-32 rounded-full bg-lavender-200/40 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-8 bottom-24 h-28 w-28 rounded-full bg-mint-200/40 blur-2xl" aria-hidden="true" />

      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-full bg-lavender-50 px-4 py-2 text-sm font-bold text-lavender-500 transition hover:bg-lavender-100"
      >
        &larr; Back to events
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-lavender-200 to-peach-200 text-3xl shadow-soft">
          📝
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            List your event
          </h1>
          <p className="mt-1 text-sm font-medium text-lavender-400">
            It&apos;s free &mdash; parents are looking
          </p>
        </div>
      </div>

      <p className="mt-6 leading-relaxed text-muted">
        Running a workshop, camp, open day, or any activity for kids?
        Fill in the details below and we&apos;ll add it to Funkaari &mdash;{" "}
        <strong className="font-bold text-ink">completely free</strong>.
        No Instagram account needed.
      </p>

      <form
        action="mailto:hello@funkaari.co.in?subject=Event%20submission"
        method="POST"
        encType="text/plain"
        className="mt-10 space-y-6 rounded-4xl bg-white/90 p-6 shadow-card ring-1 ring-lavender-100 sm:p-8"
      >
        <div>
          <label htmlFor="eventName" className="block text-sm font-bold text-ink">
            Event name *
          </label>
          <input
            id="eventName"
            name="eventName"
            type="text"
            required
            placeholder="e.g. Messy Play Morning"
            className={inputClass}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="block text-sm font-bold text-ink">
              Date *
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-bold text-ink">
              Time *
            </label>
            <input
              id="time"
              name="time"
              type="text"
              required
              placeholder="e.g. 10:00 AM – 12:00 PM"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="venue" className="block text-sm font-bold text-ink">
            Venue name *
          </label>
          <input
            id="venue"
            name="venue"
            type="text"
            required
            placeholder="e.g. Cubbon Park, Little Elly Koramangala"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-bold text-ink">
            Location / Area *
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            placeholder="e.g. Koramangala, Indiranagar, Whitefield"
            className={inputClass}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="ageGroup" className="block text-sm font-bold text-ink">
              Age group *
            </label>
            <input
              id="ageGroup"
              name="ageGroup"
              type="text"
              required
              placeholder="e.g. 1–3 years, 2–6 years"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-bold text-ink">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="text"
              placeholder="e.g. Free, ₹500, ₹200 per child"
              className={inputClass}
            />
          </div>
        </div>

        <hr className="border-lavender-100" />

        <p className="text-xs font-bold uppercase tracking-widest text-lavender-400">
          Organiser details
        </p>

        <div>
          <label htmlFor="organizer" className="block text-sm font-bold text-ink">
            Organiser / brand name *
          </label>
          <input
            id="organizer"
            name="organizer"
            type="text"
            required
            placeholder="e.g. Tiny Toes Academy"
            className={inputClass}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="instagram" className="block text-sm font-bold text-ink">
              Instagram handle
            </label>
            <input
              id="instagram"
              name="instagram"
              type="text"
              placeholder="@yourpage"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-bold text-ink">
              Phone / WhatsApp *
            </label>
            <input
              id="contact"
              name="contact"
              type="text"
              required
              placeholder="For parents to RSVP or ask questions"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-bold text-ink">
            Event link or post URL
          </label>
          <input
            id="source"
            name="source"
            type="url"
            placeholder="Instagram post, website, or booking page"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-lavender-400 to-lavender-500 py-4 font-display font-bold text-white shadow-card transition hover:from-lavender-500 hover:to-lavender-400 hover:shadow-card-hover"
        >
          Submit event
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
