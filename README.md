# ScrollCast

A clone-and-run video engine that turns a single research file (`topic-details.md`) into a polished long-form (8–15 min, **1920×1080 @ 30fps**) animated technical explainer video — ByteByteGo style — built with **Remotion**, **Claude Code**, and **Gemini Imagen** for asset generation.

Two themes only:
- **`apple`** — light, clean, soft shadows, blue accent
- **`vercel`** — dark, Geist, hairline borders, monochrome

> Source-of-truth specs (read in order): [project-description.md](project-description.md) · [project-phases.md](project-phases.md) · [design-style-guide.md](design-style-guide.md)

---

## Per-video workflow

```
[claude.ai web]                            [this repo]
  research prompt        topic-details.md     ingest        assets         dev / render
 ─────────────────►   ────────────────►   ───────────►   ───────►   ──────────────────►
                                            video-plan.json    public/assets/{theme}/   out/*.mp4
```

1. **Research** — on claude.ai web, use the research prompt in [prompt.md](prompt.md) (Part B) for your topic. Save the output as `topic-details.md` and drop it into the repo root.
2. **Ingest** — `npm run ingest` → parses `topic-details.md` into `src/video-plan.json` (scene list, durations, narration, asset refs).
3. **Asset prompts** — `npm run assets:prompts` → writes Gemini Imagen prompts to `assets/prompts/*.json`, one variant per theme.
4. **Asset generation** — `npm run assets:gen` → calls Gemini Imagen, writes images to `public/assets/{theme}/`. Content-hash cached so re-runs don't re-bill.
5. **Preview** — `npm run dev` → opens Remotion Studio.
6. **Render** — `npm run render -- --props='{"theme":"vercel"}'` → MP4 in `/out`. Theme is switchable per render with no layout breakage.

> Audio: **no AI voiceover.** A background-music slot exists; you record/add your own VO in post.

---

## Setup (clone-and-run)

```bash
git clone <this repo>
cd scrollcast
npm install
cp .env.example .env   # then add your GEMINI_API_KEY (needed from Phase 4 onward)
npm run dev            # opens Remotion Studio at 1920x1080 / 30fps
```

The `GEMINI_API_KEY` is loaded by `scripts/*` via `dotenv` and is **never** bundled into the render output.

---

## npm scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Open Remotion Studio (preview at 1920×1080 / 30 fps) |
| `npm run render` | Render `MainVideo` to `out/scrollcast.mp4` (defaults to `vercel`) |
| `npm run render:vercel` | Render the Vercel/Geist theme to `out/scrollcast-vercel.mp4` |
| `npm run render:apple` | Render the Apple theme to `out/scrollcast-apple.mp4` |
| `npm run render:both` | Both theme renders, sequentially |
| `npm run ingest` | `topic-details.md` → `src/video-plan.json` |
| `npm run assets:prompts` | `video-plan.json` → `assets/prompts/*.json` (32 files for the sample) |
| `npm run assets:gen` | prompts → Gemini Imagen → `public/assets/{theme}/*` (cached; falls back to SVG placeholders without `GEMINI_API_KEY`) |
| `npm run lint` | `eslint src && tsc` |

Theme is also overridable inline:

```bash
npm run render -- --props='{"theme":"vercel"}'
npm run render -- --props='{"theme":"apple"}'
# or pass a file path (avoids Windows quote-escaping pain):
npm run render -- --props=examples/props/apple.json
```

The `render:*` scripts use the bundled JSON props files in `examples/props/`.

CLI flags supported on the asset scripts:

```bash
npm run assets:prompts -- --theme=vercel --force
npm run assets:gen     -- --theme=apple --force
npm run assets:gen     -- --dry-run        # write SVG placeholders, skip Imagen
npm run assets:gen     -- --model=imagen-4.0-generate-001
```

---

## Reference example

[`examples/penetration-testing/`](examples/penetration-testing/) is the canonical sample used to verify the pipeline end-to-end. It contains the `topic-details.md` (the input) and the `video-plan.json` it produced, plus a README walking through the scene mapping. Use it as a working reference when you're authoring your own topic file.

```bash
# Try the reference example from a fresh clone
cp examples/penetration-testing/topic-details.md ./topic-details.md
npm install
npm run ingest
npm run assets:prompts && npm run assets:gen   # placeholders if no GEMINI_API_KEY
npm run dev
```

---

## Troubleshooting

**`npm run ingest` → "topic-details.md is missing required section: '## X'"**
Required sections: `## TL;DR`, `## What it is`, `## Why it matters`, `## How it's done`, `## Recap`. The error prints what was found vs expected. Re-generate the topic file with [prompt.md](prompt.md) Part B on claude.ai.

**`npm run assets:gen` says "GEMINI_API_KEY not set in .env"**
The pipeline still writes theme-correct SVG placeholders so the render never breaks. To upgrade to real Imagen images: drop your key into `.env` (copy from `.env.example` first) and re-run. The cache lives in `public/assets/manifest.json` — only changed prompts get re-billed.

**An asset failed mid-run**
`scripts/generate-assets.ts` retries 3× with exponential backoff (1s/3s/8s). Any asset that still fails falls back to an SVG placeholder, and the batch keeps going — the manifest flags `placeholder: true` so a later `npm run assets:gen` (or `--force`) will retry the failed ones.

**Fonts look like Times New Roman / default browser fallback**
[`src/theme/loadFonts.ts`](src/theme/loadFonts.ts) loads Geist + Geist Mono + Inter + JetBrains Mono via `@remotion/google-fonts` at module load. If you see fallback fonts, the network is blocking Google Fonts during bundling — open the Studio dev tools network tab to confirm and unblock `fonts.googleapis.com`.

**`npm run render` runs out of memory (OOM)**
Reduce concurrency: `npm run render -- --concurrency=1`. For very long timelines, also drop the scale: `npm run render -- --scale=0.75`. Both flags are Remotion CLI options.

**Studio shows a blank `MainVideo` composition / "Plan must contain at least one scene"**
The bundled `src/video-plan.json` is missing or empty. Re-run `npm run ingest`. The repo ships with the Penetration Testing plan committed so a fresh clone always renders.

**Theme switching shows misaligned text / blown-up cards**
A component is hard-coding a value that should come from `useTheme()`. Run `grep -rn "#[0-9a-fA-F]\{3,6\}" src/scenes src/components` — every hex in a component file is a violation. The token system in [design-style-guide.md](design-style-guide.md) is exhaustive; pick the matching key.

---

## Project structure (target — built up phase by phase)

```
/
├── topic-details.md            # USER-PROVIDED per video (research output)
├── project-description.md      # spec (source of truth)
├── project-phases.md           # phased build plan
├── design-style-guide.md       # visual tokens (both themes)
├── prompt.md                   # kickoff + research prompts
├── .env.example                # GEMINI_API_KEY=
├── package.json
├── remotion.config.ts
├── src/
│   ├── index.tsx               # registerRoot()
│   ├── Root.tsx                # <Composition> registry; theme prop
│   ├── MainVideo.tsx           # assembles scenes from video-plan.json
│   ├── video-plan.json         # GENERATED (Phase 3)
│   ├── theme/                  # apple.ts, vercel.ts, ThemeProvider.tsx (Phase 1)
│   ├── scenes/                 # Intro / Concept / Diagram / CodeEditor / … (Phase 5)
│   └── components/             # Card, Icon, AnimatedArrow, … (Phase 2)
├── scripts/
│   ├── ingest.ts               # Phase 3
│   ├── make-asset-prompts.ts   # Phase 4
│   └── generate-assets.ts      # Phase 4
├── assets/
│   └── prompts/                # GENERATED Imagen prompts (Phase 4)
├── public/
│   ├── assets/{apple,vercel}/  # GENERATED images, cached (Phase 4)
│   └── audio/                  # SLOT for your background music + a README
├── examples/
│   ├── props/                  # apple.json / vercel.json for `render:*` scripts
│   └── penetration-testing/    # canonical sample (topic + plan + walkthrough)
└── out/                        # rendered MP4s
```

---

## Build status (phases)

Tracked in [project-phases.md](project-phases.md). The repo is built strictly phase by phase; each phase has an Exit criteria checkpoint before the next begins.

- [x] Phase 0 — Foundation & Scaffolding
- [x] Phase 1 — Theme System
- [x] Phase 2 — Reusable Component Library
- [x] Phase 3 — Ingest Pipeline
- [x] Phase 4 — Asset Prompt + Generation Pipeline
- [x] Phase 5 — Scenes & Code-Typing Effect
- [x] Phase 6 — Audio, Transitions & Polish
- [x] Phase 7 — Render, Docs & Repeatability
