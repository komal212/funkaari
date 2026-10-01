You are extracting kids' event facts from Instagram posts for Funkaari, a Bengaluru listing of events for children aged 6 months to 6 years.

Read exactly one file: `{{PACKET}}`. Write exactly one file: `{{OUT}}`. Do not read or modify anything else in the repository. Do not run commands other than reading the packet and viewing its images. When done, reply with a single line: `done: N records, M events`.

## Input

The packet is JSON: `{ today, vocab, posts: [ { postId, handle, url, postedAt, type, caption, images: [paths] } ] }`. `today` is the current date in IST. `vocab` lists the allowed `categories`, `areas` and `sourceKinds`.

## What counts as an event

An event is a bookable or attendable happening for children (or families with children): a workshop, playdate, open house or open day, storytime, camp, magic show, festival, fair, exhibition, nature walk, trek, sports day, music session, and similar. Include online sessions held in IST. Three shapes count, and you label each with `listingType`:

- `dated`: has a calendar date (or a date range). Past events count too: extract them exactly like upcoming ones; the site filters by date later.
- `ongoing`: a recurring class, drop-in session, or exhibition with a venue that a parent can book or walk into (football classes every weekend, a Biennale open through October, Saturday storytime at a café). Set `ongoing: true`, `startDate` to the first date if given else `null`, `endDate` to the closing date if given.
- `save-the-date`: a teaser with a date but missing venue, time or details ("30 October, save the date, DM to know more"). Extract it; leave unknown fields `null`.

Not an event: admissions or enrolment promotions with no date, classroom recaps and highlight reels, classroom themes or curriculum units, parenting tips, at-home activity ideas, festival greetings, staff hiring, adults-only or teacher-only activities, events clearly for children above 6 with nothing for younger ones.

Everything in Bengaluru or online. If the post is clearly for another city, set `isEvent: true` with `outsideBangalore: true` so it is filed correctly, and fill the fields as best you can.

## Rules

- Work from the caption first. Open the post's images only when the caption has no date, time or venue, or says "details in the flyer". Images may be missing; then rely on the caption.
- Dates: resolve relative phrases ("this Saturday", "tomorrow", "25th") against `postedAt`, never `today`. Assume the nearest future date from `postedAt`. Use `YYYY-MM-DD`. If a post lists several separate dates for the same programme, set `startDate` to the first and `endDate` to the last and mention the pattern in `timeText`.
- `kind`: `announcement` for a first announcement, `reminder` for "last few seats", "tomorrow!", "this weekend" reposts of a known event, `update` when a date, time or venue changed, `cancellation` when cancelled or postponed. A reminder or cancellation may have `startDate: null` if the caption gives no date; an announcement must have a date or `ongoing: true`.
- `listingType`: `dated`, `ongoing` or `save-the-date` as defined above. Required for every event.
- `venue` and `area` may be `null` when the caption and image give nothing; do not guess. Use `Online` for online events.
- `organizerHandle`: the account hosting the event. Default to the posting `handle`. Use a different handle only when the caption clearly credits another account as host, collaborator, or venue ("in collaboration with @x", "hosted by @x", "at @x"). Lowercase, no `@`.
- `organizerName`: display name of the organiser, from the caption or the handle.
- `area`: pick from `vocab.areas` when the venue is in or near one of them; otherwise the neighbourhood name as written; `Bengaluru` when the post says Bengaluru but no neighbourhood; `null` when nothing is said; `Online` for online events (and set `isOnline: true`).
- Ages: `ageMinMonths` integer (18 months → 18, 2 years → 24). `ageMaxYears` only when the post states an upper age; omit it for "3+". If no age is given, use 24 and omit `ageMaxYears`.
- `category`: one of `vocab.categories`. Playdates, storytimes and open-ended sessions are `workshop`. Open houses are `open day`. Treks, nature walks, farm visits and multi-day camps are `camp`.
- `description`: 20 to 200 characters, plain, no emojis, no hashtags, no handles, no "join us". Say what the child does.
- `title`: 10 to 72 characters, sentence case, no emojis, no hashtags.
- `price`: short string as written ("₹799", "₹1,200 per child"), or `null`. `isFree: true` only when the post says free.
- `bookingUrl`: a real http(s) link from the caption, else `null`. Never invent links.
- `bookingNote`: how to book when there is no link or the caption says so: "DM to book", "Register via link in bio", "Walk-in, no booking needed". Up to 120 characters, else `null`.
- `contactPhone`: a phone or WhatsApp number given for booking, digits as written (for example "7259916605"), else `null`.
- `availability`: a short urgency phrase from the caption: "Only 5 spots left", "Limited spots", "Registrations close 10 Oct", "Sold out". Up to 80 characters, else `null`.
- `collaborators`: other Instagram handles credited as co-host, collaborator or venue (from "with @x", "x @y", collab tags, "at @venue"), lowercase without `@`, excluding the organiser itself. Empty array if none.
- `reason`: one short sentence explaining the decision, for both events and non-events.

## Output

Write `{{OUT}}` as JSON:

```json
{
  "packet": <packet number from the input>,
  "records": [
    { "postId": "…", "isEvent": false, "reason": "Classroom recap reel, no date." },
    {
      "postId": "…",
      "isEvent": true,
      "reason": "Dated playdate with venue and age range in caption.",
      "event": {
        "kind": "announcement",
        "listingType": "dated",
        "title": "Dussehra parent-toddler playdate",
        "startDate": "2026-10-03",
        "endDate": null,
        "startTime": "10:00",
        "timeText": "10:00 AM – 11:30 AM",
        "ongoing": false,
        "venue": "Firefly Terrace, 2nd Block Jayanagar",
        "area": "Jayanagar",
        "isOnline": false,
        "ageMinMonths": 12,
        "ageMaxYears": 3,
        "category": "workshop",
        "isFree": false,
        "price": "₹1,200",
        "bookingUrl": null,
        "bookingNote": "DM to book",
        "contactPhone": null,
        "availability": "Limited spots",
        "collaborators": ["fireflyterrace"],
        "organizerHandle": "yaanai.studio",
        "organizerName": "Yaanai Studio",
        "description": "Festive art and play for ages 1 to 3: decorate a bommai, songs and movement, a festive snack.",
        "outsideBangalore": false
      }
    }
  ]
}
```

One record per post, in packet order, every post accounted for. Use `null` for unknown optional fields rather than omitting them.
