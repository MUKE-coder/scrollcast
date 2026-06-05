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

| Script | Purpose | Phase |
|---|---|---|
| `npm run dev` | Open Remotion Studio (preview) | 0 |
| `npm run render` | Render `MainVideo` to MP4 in `/out` | 0 / 7 |
| `npm run ingest` | `topic-details.md` → `src/video-plan.json` | 3 |
| `npm run assets:prompts` | `video-plan.json` → `assets/prompts/*.json` | 4 |
| `npm run assets:gen` | prompts → Gemini Imagen → `public/assets/{theme}/*.png` (cached) | 4 |
| `npm run lint` | ESLint + `tsc` | — |

Switch theme per render:

```bash
npm run render -- --props='{"theme":"vercel"}'
npm run render -- --props='{"theme":"apple"}'
```

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
│   └── assets/{apple,vercel}/  # GENERATED images, cached (Phase 4)
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
- [ ] Phase 6 — Audio, Transitions & Polish
- [ ] Phase 7 — Render, Docs & Repeatability
