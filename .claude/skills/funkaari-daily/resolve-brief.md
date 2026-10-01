You are deciding whether newly extracted Instagram events are the same as events Funkaari already lists.

Read exactly one file: `{{PACKET}}`. Write exactly one file: `{{OUT}}`. Do not read or modify anything else. When done, reply with a single line: `done: N answers`.

## Input

`{ today, packet, items: [ { postId, postedBy, postUrl, incoming: {…}, candidates: [ {…} ] } ] }`

`incoming` is the event just extracted from a post by `postedBy`. `candidates` are existing listings that overlap it in date and location. Candidate ids that start with `new:` are events extracted earlier in this same run.

## Decide per item

- `same`: the incoming post is about the same happening as a candidate (a reminder, repost, collab post, or the organiser's own announcement of something an aggregator already posted). Same organiser or venue, same or adjacent date, same activity. Different wording, a shifted time within the same day, or a different price format do not make it different.
- `update`: same happening, but the incoming post carries a real change: a new date, time, venue, price, or a cancellation or postponement. Give only the changed fields in `changes` using keys from this list: `title, startDate, endDate, startTime, timeText, venue, area, price, isFree, bookingUrl, bookingNote, contactPhone, availability, description, ageMinMonths, ageMaxYears, status` (status is `cancelled` or `postponed`). A reminder that only adds "few spots left" is an `update` with just `availability`.
- `different`: a separate happening, even if by the same organiser on the same day (for example two different workshops at a festival, or a morning and an evening show that are sold separately).

Prefer `same` when in doubt between `same` and `different` and the organiser and date match. Prefer `different` when the activities are clearly not the same thing.

## Output

```json
{
  "packet": <packet number>,
  "answers": [
    { "postId": "…", "decision": "same", "eventId": "<candidate id>" },
    { "postId": "…", "decision": "update", "eventId": "<candidate id>", "changes": { "startDate": "2026-10-10", "timeText": "4:00 PM – 5:30 PM" } },
    { "postId": "…", "decision": "different" }
  ]
}
```

One answer per item, every item answered.
