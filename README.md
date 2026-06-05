# ScrollCast

A clone-and-run video engine that turns a single research file (`topic-details.md`) into a polished long-form (8–15 min, **1920×1080 @ 30fps**) animated technical explainer video — ByteByteGo style — built with **Remotion**, **Claude Code**, and **Gemini Imagen** for asset generation.

Two themes only:
- **`apple`** — light, clean, soft shadows, blue accent
- **`vercel`** — dark, Geist, hairline borders, monochrome

> Source-of-truth specs (read in order): [project-description.md](project-description.md) · [project-phases.md](project-phases.md) · [design-style-guide.md](design-style-guide.md)

---

## How to use this repo

**ScrollCast is driven by Claude Code at runtime.** The npm scripts are tools Claude Code uses; they're not the engine. You drop a research file, you invoke Claude Code in the repo, you ask for a video, Claude Code reads the topic and produces the best video the engine can make — refining the plan, picking icons per scene, hand-tuning assets, rendering an MP4.

```
[claude.ai web]                [your terminal]
  research prompt          drop topic-details.md       claude code makes the video
 ─────────────────►   ─────────────────────────►   ────────────────────────────────►
                                                      out/scrollcast-{theme}.mp4
```

### Step 1 — Clone and install (once per machine)

```bash
git clone https://github.com/MUKE-coder/scrollcast.git
cd scrollcast
npm install
```

You'll also want [Claude Code](https://claude.com/claude-code) installed — it's the engine.

### Step 2 — (Optional) Add a Gemini API key for real images

```bash
cp .env.example .env
# edit .env and paste your key after GEMINI_API_KEY=
```

Without a key, the asset pipeline falls back to a curated library of theme-aware isometric 3D SVGs ([`scripts/svg-library.ts`](scripts/svg-library.ts)). They're designed to ship — you do not have to upgrade to real Imagen images. With a key, Claude Code calls the Gemini image-gen API (default model: `gemini-3.1-flash-image`).

### Step 3 — Research your topic on claude.ai (web)

On [claude.ai](https://claude.ai), paste **Part B** of [prompt.md](prompt.md), replacing `{{TOPIC}}` with your topic (e.g. `Kubernetes Networking`, `OAuth 2.0`, `Redis Streams`). The prompt tells the web Claude to emit exactly one Markdown file called `topic-details.md` — no preamble, no wrapper. Save the output as `topic-details.md` at the repo root.

> Don't want to write a topic yet? Use the bundled Penetration Testing sample at [`examples/penetration-testing/topic-details.md`](examples/penetration-testing/topic-details.md).

### Step 4 — Open Claude Code in the repo and run `/make-video`

```bash
cd scrollcast        # or wherever you cloned it
claude               # launches Claude Code in this repo
```

Then inside Claude Code:

```
/make-video
```

That's it. Claude Code:

1. Reads `topic-details.md`, [`project-description.md`](project-description.md), and [`design-style-guide.md`](design-style-guide.md) so it understands the spec.
2. Runs `npm run ingest` to get a baseline `src/video-plan.json`, then **refines it** — rewriting bullets that read like paragraph dumps, retitling scenes, picking specific lucide icons per scene, tuning durations, swapping scene types when the content fits better.
3. Generates assets via `npm run assets:prompts` + `npm run assets:gen`. If you have a Gemini key, real images; otherwise the SVG library, possibly hand-tuned per scene.
4. Renders preview stills at scene-representative frames and looks at them, fixes anything that breaks legibility.
5. When you're happy, runs `npm run render:vercel` (and/or `:apple`) to produce the final MP4.

The detailed workflow lives in [`.claude/commands/make-video.md`](.claude/commands/make-video.md) — Claude Code reads it as part of the slash command.

> **No Claude Code?** You can run the deterministic pipeline by hand: `npm run ingest && npm run assets:prompts && npm run assets:gen && npm run render:vercel`. It produces a *working* video. The Claude-Code-driven path produces a *good* one.

### Step 5 (optional) — Add background music and your voiceover

ScrollCast does **not** generate audio. Two slots exist:

- **Background music** — drop a track in `public/audio/` and set `BACKGROUND_MUSIC_TRACK` in [`src/MainVideo.tsx`](src/MainVideo.tsx) to the file name. Volume ducked to `MUSIC_VOLUME = 0.12` with fades in/out. See [`public/audio/README.md`](public/audio/README.md).
- **Voiceover** — every scene's `narration` in `src/video-plan.json` is the spoken script. Record your VO against it and layer it on top of the MP4 in any editor (DaVinci, Premiere, FFmpeg).

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
| `npm run assets:gen` | prompts → Gemini image-gen (default `gemini-3.1-flash-image`) → `public/assets/{theme}/*` (cached; falls back to SVG placeholders without `GEMINI_API_KEY`) |
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
npm run assets:gen     -- --dry-run                              # write SVG placeholders, skip the API
npm run assets:gen     -- --list-models                          # print every model your key can call
npm run assets:gen     -- --model=gemini-3-pro-image             # GA Pro image (higher quality, slower)
npm run assets:gen     -- --model=imagen-4.0-fast-generate-001   # Imagen 4 fast via :predict
npm run assets:gen     -- --model=imagen-4.0-ultra-generate-001  # Imagen 4 ultra (highest quality)
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
The pipeline still writes theme-correct SVG placeholders so the render never breaks. To upgrade to real images: drop your key into `.env` (copy from `.env.example` first) and re-run. The cache lives in `public/assets/manifest.json` — only changed prompts get re-billed.

**`npm run assets:gen` → "404 Not Found — models/<id> is not found for API version v1beta, or is not supported for generateContent / predict"**
Your `GEMINI_API_KEY` doesn't have access to that specific image-gen model. Gemini's image-gen model names + availability shift fairly often. Discover what your key can call:

```bash
npm run assets:gen -- --list-models
```

That prints every model the key can hit and which methods each supports. Pick one whose name contains `image` AND whose methods include `generateContent` (or one whose name starts with `imagen-` AND whose methods include `predict`), then:

```bash
npm run assets:gen -- --model=<id-from-list>
```

The script auto-routes `gemini-*` → `:generateContent` and `imagen-*` → `:predict`, so you don't need to think about the endpoint.

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
