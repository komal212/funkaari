---
name: funkaari-daily
description: Daily Funkaari pipeline. Fetch new Instagram posts from every followed handle, have Sonnet workers turn them into kids events, dedupe against the event database, publish the site file, commit. Use when asked to run the daily refresh, pull new Instagram posts, or update events.
---

# Funkaari daily run

You are the orchestrator. You run scripts, hand work to Sonnet workers, check their output with scripts, and commit. **You never read captions or images yourself.** Everything model-heavy goes to workers created with `create_agent` using model `anthropic/sonnet-5`, effort `medium`.

Set `RUN` to today's date in IST as `YYYY-MM-DD` (the scripts default to this when `--run` is omitted). Use `--handles a,b,c` on fetch and pack only when asked to test a subset.

## 1. Fetch

```
npm run ig:fetch -- --run $RUN
```

Needs network access outside the sandbox. Exit code 2 means the Instagram token is rejected: stop and tell the user to renew `INSTAGRAM_ACCESS_TOKEN`. The current token is a Facebook Page token and does not expire; if it is ever revoked, the user generates a fresh short-lived token in Graph API Explorer, pastes it into `.env.local`, and you run `node scripts/ig/token.mjs` to mint a permanent one again (needs `FB_APP_ID` and `FB_APP_SECRET` in `.env.local`). Per-handle errors are fine; they are logged and the run continues.

## 2. Pack

```
npm run ig:pack -- --run $RUN
```

Prints up to 5 packets with their input and output paths. If it prints `nothing to extract`, skip to step 6.

## 3. Extract with Sonnet workers

For each packet, create one worker. Read `extract-brief.md` next to this file, replace `{{PACKET}}` with the packet's `in` path and `{{OUT}}` with its `out` path, and pass that text as the agent prompt. Title: `Extract packet N`. Create all packets' workers in one go; they run in parallel. Keep the agent ids: you reuse the workers in step 5.

Wait for every worker to report back. Then:

```
npm run ig:validate -- --run $RUN
```

If it fails, send each failing packet's error lines to the worker that owns that packet with `send_agent_message`, ask it to fix only those records in place, wait, and validate again. Do not fix records yourself.

## 4. Match

```
npm run ig:match -- --run $RUN
```

Prints counts per action and any resolve packets. `no resolve step needed` means skip step 5.

## 5. Resolve look-alikes

For each resolve packet, message an idle worker from step 3 (or create a new Sonnet medium one if none is left). Send `resolve-brief.md` with `{{PACKET}}` and `{{OUT}}` filled in. Wait, then:

```
npm run ig:validate -- --run $RUN --stage resolve
```

Fix-and-retry loop as in step 3.

## 6. Apply and publish

```
npm run ig:apply -- --run $RUN
npm run build
```

Apply prints created, attached, updated and cancelled events. If the build fails, report the error and stop; do not commit.

## 7. Commit

Stage only pipeline outputs: `db/`, `src/data/instagram-events.json`. Commit as `Daily Instagram refresh $RUN`. Show the user the apply summary. Ask before pushing; a push deploys.

## Notes

- Scratch for a run lives in `.context/runs/$RUN/` and is not committed.
- To re-triage a post, delete its line from `db/triage.json` and run again from step 2.
- Workers share this checkout. Their only writes are their own `{{OUT}}` file.
- If a worker goes silent for more than 10 minutes, create a replacement for that packet.
