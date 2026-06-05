# Example — Penetration Testing

The canonical sample used to verify the ScrollCast pipeline end-to-end.

## Files
- **[topic-details.md](topic-details.md)** — research input. Produced by Part B of
  [`prompt.md`](../../prompt.md) on claude.ai. Required sections: TL;DR, What it is,
  Why it matters, How it's done (8 numbered steps here), Key comparisons, Recap,
  Suggested visuals.
- **[video-plan.json](video-plan.json)** — generated plan. Output of
  `npm run ingest`. 14 scenes, 480.0 s (8.0 min) total. Saved here as a reference
  so you can diff structural changes to the ingest pipeline.

## To run this example

From the repo root:

```bash
# (Optional) overwrite the active topic with this one
cp examples/penetration-testing/topic-details.md ./topic-details.md

# Build the plan
npm run ingest

# (Optional) generate prompts + images. Without GEMINI_API_KEY this
# writes theme-correct SVG placeholders.
npm run assets:prompts
npm run assets:gen

# Preview
npm run dev

# Render
npm run render:vercel
npm run render:apple
```

## How the plan maps to scenes

| scene id                              | type       | duration | source                                           |
|---------------------------------------|------------|----------|--------------------------------------------------|
| intro                                 | intro      | 14.0 s   | H1 title + TL;DR bullets as tagline             |
| what                                  | concept    | 32.8 s   | First two paragraphs of *What it is*            |
| why                                   | concept    | 32.8 s   | First paragraph of *Why it matters* + bullets   |
| how-scoping-and-rules-of-engagem      | diagram    | 39.8 s   | Step 1 (no code → has `Visual idea:`)           |
| how-reconnaissance                    | code       | 44.5 s   | Step 2 (bash snippet)                            |
| how-scanning-and-enumeration          | code       | 44.5 s   | Step 3 (bash snippet)                            |
| how-vulnerability-analysis            | diagram    | 39.8 s   | Step 4 (no code)                                 |
| how-exploitation                      | code       | 44.5 s   | Step 5 (python snippet)                          |
| how-post-exploitation                 | code       | 44.5 s   | Step 6 (bash snippet)                            |
| how-reporting                         | code       | 44.5 s   | Step 7 (markdown snippet)                        |
| how-retest                            | diagram    | 39.8 s   | Step 8 (no code)                                 |
| comparison                            | comparison | 30.4 s   | *Key comparisons* split A/B                      |
| recap                                 | recap      | 18.7 s   | *Recap* bullets                                  |
| outro                                 | outro      | 9.4 s    | "Thanks for watching" card                       |

Scene types are chosen by `pickStepSceneType` in [`scripts/ingest.ts`](../../scripts/ingest.ts):
fenced code present → `code`, `Visual idea:` present → `diagram`, otherwise `concept`.
