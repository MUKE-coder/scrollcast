# ScrollCast

A clone-and-run video engine that turns a single research file (`topic-details.md`) into a polished long-form (8–15 min, **1920×1080 @ 30fps**) animated technical explainer video — ByteByteGo style — built with **Remotion**, **Claude Code**, and **Gemini Imagen** for asset generation.

Two themes only:
- **`apple`** — light, clean, soft shadows, blue accent
- **`vercel`** — dark, Geist, hairline borders, monochrome

> Source-of-truth specs (read in order): [project-description.md](project-description.md) · [project-phases.md](project-phases.md) · [design-style-guide.md](design-style-guide.md)

---

## How to use this repo

The flow below produces one finished video. After step 2 (first-time setup), repeat steps 3–9 for every new topic.

```
[claude.ai web]                            [this repo]
  research prompt        topic-details.md     ingest        assets         dev / render
 ─────────────────►   ────────────────►   ───────────►   ───────►   ──────────────────►
                                            video-plan.json    public/assets/{theme}/   out/*.mp4
```

### Step 1 — Clone and install (once per machine)

```bash
git clone https://github.com/MUKE-coder/scrollcast.git
cd scrollcast
npm install
```

`npm install` pulls Remotion, the theme/font packages (`@remotion/google-fonts`, `@remotion/transitions`), the icon set (`lucide-react`), the syntax highlighter (`prism-react-renderer`), and the build-time dev tools. Takes ~1 minute on a clean machine.

### Step 2 — Add your Gemini API key (optional, needed only for real images)

```bash
cp .env.example .env
# edit .env and paste your key after GEMINI_API_KEY=
```

`GEMINI_API_KEY` is read by `scripts/generate-assets.ts` via `dotenv`. It is **never** bundled into the render output.

**No key?** Skip this step. The asset pipeline detects a missing key and writes theme-correct **SVG placeholders** so the rest of the workflow still works. You can drop a key in later and run `npm run assets:gen --force` to upgrade those placeholders to real Imagen images.

### Step 3 — Research the topic on claude.ai (web)

ScrollCast does *not* generate the research itself — your script is the source of truth. On [claude.ai](https://claude.ai), paste **Part B** of [prompt.md](prompt.md), replacing `{{TOPIC}}` with your topic name (e.g. `Kubernetes Networking`, `OAuth 2.0`, `CRDTs`). Claude returns a structured Markdown document.

Required sections in the output: `## TL;DR`, `## What it is`, `## Why it matters`, `## How it's done` (with `### Step N — Name` subsections), `## Recap`. Optional: `## Key comparisons`, `## Suggested visuals`. If any required section is missing, `npm run ingest` will refuse the file with a clear error.

### Step 4 — Drop the research file in the repo root

Save Claude's output as `topic-details.md` at the repo root, overwriting whatever's there.

```bash
# example: replace the bundled Penetration Testing topic with your own
mv ~/Downloads/topic-details.md ./topic-details.md
```

> Want to try the workflow without writing a topic yet? Use the bundled sample:
> `cp examples/penetration-testing/topic-details.md ./topic-details.md`

### Step 5 — Build the video plan

```bash
npm run ingest
```

The ingest script parses your `topic-details.md` into a structured timeline at `src/video-plan.json` — one scene per logical section, durations distributed to hit 8–15 minutes, scene type chosen per "How" step by content (`code` if a fenced code block is present, `diagram` if a `Visual idea:` line is present, `concept` otherwise). The script prints the scene-by-scene breakdown so you can sanity-check pacing before the next step.

### Step 6 — Generate the per-asset Imagen prompts

```bash
npm run assets:prompts
```

For every `assetRef` in `video-plan.json`, this writes two prompt files (one per theme) to `assets/prompts/<id>.<theme>.json`. Each prompt composes your description + per-kind guidance + the verbatim theme style suffix from [`design-style-guide.md`](design-style-guide.md) §6, plus an aspect ratio (icons 1:1, everything else 16:9) and an sha256 hash that drives the cache.

### Step 7 — Generate the images

```bash
npm run assets:gen
```

For each prompt file: the script checks the cache (sha256 vs `public/assets/manifest.json`), calls the Gemini Imagen REST endpoint, decodes the base64 PNG, and writes it to `public/assets/{theme}/<id>.png`. On API errors it retries 3× with exponential backoff (1s/3s/8s); persistent failures fall back to an SVG placeholder so the render never crashes. Re-running is free: cached entries are skipped.

Useful flags:
```bash
npm run assets:gen -- --force                       # ignore cache, regenerate everything
npm run assets:gen -- --theme=apple                 # only one theme
npm run assets:gen -- --dry-run                     # placeholder mode, no API calls
npm run assets:gen -- --model=imagen-4.0-generate-001  # override the model
```

### Step 8 — Preview in Remotion Studio

```bash
npm run dev
```

Opens Remotion Studio at `http://localhost:3000`. You'll see the timeline (`MainVideo` composition) plus the development gallery compositions (`ThemeGallery-Apple`, `ThemeGallery-Vercel`, `ComponentGallery-Apple`, `ComponentGallery-Vercel`) for design-system QA. Scrub the timeline to watch your video. Switch the `theme` prop in the right-hand props panel to compare Apple vs Vercel without re-rendering.

### Step 9 — Render the final MP4

```bash
npm run render:vercel        # → out/scrollcast-vercel.mp4
npm run render:apple         # → out/scrollcast-apple.mp4
npm run render:both          # both, sequentially
```

Each `render:*` script reads the corresponding props file in `examples/props/` and writes a 1920×1080 / 30 fps H.264 MP4. An 8-minute video typically takes 5–15 minutes to render depending on your machine.

### Step 10 (optional) — Add background music and your voiceover

ScrollCast does **not** generate audio. Two slots exist:

- **Background music** — drop a track in `public/audio/` and set `BACKGROUND_MUSIC_TRACK` in [`src/MainVideo.tsx`](src/MainVideo.tsx) to the file name. The volume is ducked to `MUSIC_VOLUME` (0.12) and fades in/out around the intro and outro. See [`public/audio/README.md`](public/audio/README.md).
- **Voiceover** — every scene's `narration` string in `src/video-plan.json` is the spoken script. Record your VO against it, then layer it on top of the rendered MP4 in any video editor (DaVinci Resolve, Premiere, FFmpeg). Advanced users can also add a second `<Audio>` element inside `MainVideo.tsx`.

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
