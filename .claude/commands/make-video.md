---
description: Build a polished ScrollCast video from topic-details.md. Runs the full pipeline (ingest → refine → assets → render) using Claude Code's judgment, not just the deterministic scripts.
---

You are making a ScrollCast video. This is your canonical workflow. The user has dropped `topic-details.md` in the repo root (or expects you to use the one already there) and they want the **best possible** 8–15 min animated explainer at `out/scrollcast-{theme}.mp4` — not a mechanical pipeline output.

## Step 0 — Orient

If you haven't already, read `CLAUDE.md` (this is the engine's overview), `project-description.md` (source of truth), and `design-style-guide.md` (token names). Then read the user's `topic-details.md` end to end. You're forming a mental model of the video before you touch any file.

## Step 1 — Baseline plan (mechanical)

```bash
npm run ingest
```

This emits a serviceable `src/video-plan.json`. **It is a draft, not the final plan.** It naively splits sections into scenes and slices bullets verbatim.

## Step 2 — Refine the plan (this is where you earn your keep)

Read `src/video-plan.json` and rewrite it using `Edit` so the result is something a real producer would ship. For each scene:

1. **Title** — short, declarative, parallel across scenes. "What is penetration testing?" beats "What it is".
2. **Kicker** — eyebrow label that frames the scene. "DEFINITION", "IMPACT", "HOW · STEP 3 — RECONNAISSANCE".
3. **Bullets** — 3–5 tight, spoken-friendly lines. Not paragraph dumps. Parallel grammar. Concrete > abstract.
4. **Narration** — what the VO would say. Should flow when read aloud. Keep it tight; pacing matters.
5. **Scene type** — verify the type matches the content:
   - `intro`, `recap`, `outro` — usually correct from ingest
   - `concept` — short / no clear visual idea / no code
   - `diagram` — has a "Visual idea:" line OR represents a flow / architecture
   - `code` — has fenced code blocks worth showing typed live
   - `comparison` — has a "vs" structure or before/after
   - If a step has both a visual idea AND code, pick `code` (typing animation is the marquee) and reference the diagram intent in the asset description.
6. **Asset refs** — for each ref:
   - Rewrite the `description` to be specific, not generic. "Conceptual icon for Reconnaissance" → "Network-topology icon showing radial probes from a center node out to scanned hosts".
   - Make sure the description's keywords will hit a sensible match in `scripts/svg-library.ts` (network → `network`, lock → `lock`, etc.). If it would fall through to the deterministic hash, edit the description to anchor a better keyword.
7. **Durations** — `intro` 12–14 s, `concept` 26–30 s, `diagram` 32–36 s, `code` 36–42 s, `comparison` 24–28 s, `recap` 16–20 s, `outro` 8–10 s. Total should land 480–900 s. Re-run the math if you change durations.

After the edits, validate:

```bash
npx tsc --noEmit
```

(The zod schema check happens at MainVideo's module load, but tsc + a still render below catches everything in practice.)

## Step 3 — Custom scenes (only when needed)

If a topic has a scene that doesn't fit any existing scene type — e.g., a particle simulation, an animated bar race, a 3D plot — write a new component at `src/scenes/Custom{Slug}Scene.tsx`, add a new `SceneType` to `src/video-plan.schema.ts`, and wire it into `src/scenes/SceneRouter.tsx`. Don't do this for every video — only when content genuinely deserves it.

## Step 4 — Assets

```bash
npm run assets:prompts
```

Then inspect a few prompts in `assets/prompts/` to confirm they describe what you intended. Edit the `description` in `video-plan.json` and re-run if they don't.

```bash
npm run assets:gen
```

Behavior depends on the env:
- `GEMINI_API_KEY` set + model available → real images. The default model is `gemini-3.1-flash-image`. If that 404s, run `npm run assets:gen -- --list-models` and switch.
- Otherwise → theme-aware SVGs from `scripts/svg-library.ts`. These are *good* — designed to ship — but you can also **hand-tune individual assets** by writing SVG directly to `public/assets/{theme}/{id}.svg`. Do this for hero/intro/outro assets when you want extra polish.

After assets are in place, the manifest at `public/assets/manifest.json` tracks each asset's hash + path.

## Step 5 — Preview frames

Render stills at scene-representative frames and look at them:

```bash
npx remotion still MainVideo out/preview-intro.jpg     --frame=150  --scale=0.5 --props=examples/props/vercel.json
npx remotion still MainVideo out/preview-concept.jpg   --frame=600  --scale=0.5 --props=examples/props/vercel.json
npx remotion still MainVideo out/preview-code.jpg      --frame=3700 --scale=0.5 --props=examples/props/vercel.json
```

(Use the actual scene boundaries from your plan — `cat src/video-plan.json | grep durationInFrames` gives you the offsets.)

Use the `Read` tool to look at each still. Common things to catch and fix:
- Bullet text clipping off the right edge → shorten the bullet
- Title wrapping awkwardly → shorten or use h2 instead of h1
- Icon doesn't match content → edit `description` in `video-plan.json` or hand-write the SVG
- Code editor has weird blank lines → adjust the snippet in the plan
- Diagram nodes have too much label → truncate the bullet text

Iterate until the stills look like something you'd ship.

## Step 6 — Render the MP4

```bash
npm run render:vercel
# and/or
npm run render:apple
```

For a fast smoke test before committing 8 minutes of render time, render a short segment:

```bash
npx remotion render MainVideo out/preview-segment.mp4 --frames=0-300 --scale=0.5 --props=examples/props/vercel.json
```

## Step 7 — Show the user

Report what scenes you built, where you departed from the ingest baseline, and what assets are real vs SVG fallback. Show one or two preview stills as proof. Ask if they want to render the full MP4 or iterate on a specific scene.

## What success looks like

- The video plan reads like something a script doctor wrote, not a regex parser dumped.
- Every icon makes sense for its scene; no generic clouds where a network mesh belongs.
- Code scenes have realistic code, not stub examples.
- Diagram scenes have node labels that fit on one line each.
- Transitions are smooth; the timeline lands in the 8–15 min window.
- Both themes (`apple` and `vercel`) render cleanly with the same plan.

The deterministic scripts can produce a *working* video. Your job is the *good* one.
