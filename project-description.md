# Project Description — "ScrollCast" (Animated Technical Video Engine)

> This is the master context file. Claude Code should read this **first** and treat it as the source of truth for what the project is, how it works, and what "done" looks like. If anything in another file conflicts with this one, this file wins unless the user says otherwise.

---

## 1. One-line summary

A clone-and-run repository that turns a single research file (`topic-details.md`) into a polished, long-form (8–15 min, 16:9, 1920×1080) animated technical explainer video — in the visual style of channels like ByteByteGo — built entirely with **Remotion**, **Claude Code**, and **Gemini (Imagen)** for asset generation. Two themes only: **Apple** (light/clean) and **Vercel/Geist** (dark).

---

## 2. The problem this solves

The author makes technical tutorials (system design, backend, security topics like penetration testing). Manually producing ByteByteGo-quality animated diagrams, icons, code-typing effects, and scene transitions is slow and inconsistent. This project automates the **research → script → assets → animated video** pipeline so each new topic is a repeatable, mostly-automated build, not a from-scratch design project.

---

## 3. How it works (end-to-end workflow)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 0 — RESEARCH (happens on claude.ai web, OUTSIDE this repo)       │
│   User researches a topic (e.g. "Penetration Testing") using the      │
│   research prompt (see prompt.md / research-prompt section).          │
│   Output: a single file → topic-details.md                            │
│   Structure: What it is · Why it matters · How it's done.             │
└─────────────────────────────────────────────────────────────────────┘
                              │  (user drops topic-details.md into repo root)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1 — INGEST (Claude Code)                                         │
│   Read topic-details.md → produce a structured video plan:            │
│   video-plan.json  (scenes, durations, narration text, asset needs).  │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2 — ASSET PROMPTS (Claude Code)                                  │
│   From video-plan.json, generate Gemini/Imagen prompts for every      │
│   icon, background, diagram element, and graphic. Write them to       │
│   /assets/prompts/*.json (theme-aware: one variant per theme).        │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3 — ASSET GENERATION (build-time script, Gemini Imagen API)      │
│   scripts/generate-assets.ts reads the prompts, calls Imagen,         │
│   writes PNG/SVG outputs to /public/assets/{theme}/...                │
│   Caches results so re-runs don't re-bill.                            │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4 — COMPOSE (Claude Code + Remotion)                             │
│   Claude Code writes/updates Remotion scene components that read      │
│   video-plan.json and the generated assets, assembling the full       │
│   timeline: intro → concept scenes → diagrams → code-typing → outro.  │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5 — PREVIEW & RENDER (Remotion)                                  │
│   `npm run dev` → Remotion Studio preview.                            │
│   `npm run render` → final MP4 at 1920×1080 in /out.                  │
│   Audio: NO generated voiceover. Background music slot + silence for  │
│   the user to add their own VO later.                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Hard requirements / constraints

| Area | Decision (locked) |
|---|---|
| Video engine | **Remotion** (React-based). Scaffold with `npx create-video@latest --yes --blank --no-tailwind`. |
| Built by | **Claude Code**, guided by these 4 files + installed Remotion skills. |
| Research source | **claude.ai web** → `topic-details.md` dropped into repo root. |
| Image/asset generation | **Gemini Imagen via API** at build time. Must be cached. |
| Voiceover | **None.** Music/silence only; user adds VO in post. |
| Themes | **Exactly two:** `apple` (light/clean) and `vercel` (dark/Geist). Selectable per render via a config/prop flag. |
| Format | **16:9, 1920×1080, 30 fps**, long-form 8–15 min. |
| Code blocks | Realistic typing effect inside a collapsed/expandable code-editor UI. Use `prism-react-renderer` for highlighting (NOT regex). |
| No emojis in output video | Use real icons (Geist icons for Vercel theme; SF-style/clean icons for Apple theme). |
| Topic example | Penetration Testing (use as the canonical test case). |

---

## 5. Required Remotion skills (install in the repo)

These must be installed and referenced. Claude Code should defer to them for all Remotion specifics:

```bash
npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices
npx skills add https://github.com/vercel-labs/skill-remotion-geist --skill create-remotion-geist
# Optional / supporting:
# https://www.skills.sh/affaan-m/everything-claude-code/remotion-video-creation
# https://www.skills.sh/ncklrs/startup-os-skills/remotion-animation
```

Key rules inherited from those skills:
- Animate with `useCurrentFrame()` + `interpolate()` + spring; use `Easing` for timing.
- Entry point is `src/index.tsx` with `registerRoot()` (a `.tsx`, not `.ts`).
- Use `prism-react-renderer` for code highlighting.
- Never use emojis; use real icon packs and official brand assets.
- The Geist skill defines the **Vercel theme** (dark background, Geist font, 10-step color scale, spring animations).

---

## 6. Repository structure (target)

```
/
├── topic-details.md            # USER-PROVIDED per video (research output)
├── project-description.md      # this file
├── project-phases.md           # build plan
├── design-style-guide.md       # visual system (both themes)
├── prompt.md                   # the kickoff prompt for Claude Code + research prompt
├── package.json
├── remotion.config.ts
├── .env.example                # GEMINI_API_KEY=...
├── src/
│   ├── index.tsx               # registerRoot()
│   ├── Root.tsx                # <Composition> registry; reads theme prop
│   ├── video-plan.json         # GENERATED from topic-details.md (Step 1)
│   ├── theme/
│   │   ├── apple.ts            # Apple theme tokens
│   │   ├── vercel.ts           # Vercel/Geist theme tokens
│   │   └── ThemeProvider.tsx
│   ├── scenes/                 # one component per scene type
│   │   ├── IntroScene.tsx
│   │   ├── ConceptScene.tsx
│   │   ├── DiagramScene.tsx
│   │   ├── CodeEditorScene.tsx # collapsed editor + typing effect
│   │   ├── ComparisonScene.tsx
│   │   └── OutroScene.tsx
│   ├── components/             # reusable: Card, Icon, AnimatedArrow, Badge…
│   └── MainVideo.tsx           # assembles scenes from video-plan.json
├── scripts/
│   ├── ingest.ts               # topic-details.md -> video-plan.json (Step 1)
│   ├── make-asset-prompts.ts   # video-plan.json -> /assets/prompts (Step 2)
│   └── generate-assets.ts      # prompts -> Imagen -> /public/assets (Step 3, cached)
├── assets/
│   └── prompts/                # GENERATED Imagen prompts (json, theme-aware)
├── public/
│   └── assets/{apple,vercel}/  # GENERATED images, cached
└── out/                        # rendered MP4s
```

---

## 7. Definition of done

1. Fresh clone + `npm install` + skills install + `GEMINI_API_KEY` set.
2. Drop a `topic-details.md` (e.g. Penetration Testing) into root.
3. Run the pipeline (`npm run ingest`, `npm run assets`, then `npm run dev`).
4. Remotion Studio shows a complete 8–15 min video for the chosen theme.
5. Switching the `theme` prop between `apple` and `vercel` re-skins the entire video with no layout breakage.
6. `npm run render -- --theme=vercel` produces a clean 1080p MP4 in `/out` with a code-editor scene that types code realistically.
7. No emojis anywhere; assets are cached; re-running doesn't re-bill Imagen unnecessarily.

---

## 8. Non-goals (do NOT build these)

- No AI voiceover / TTS.
- No vertical/Shorts format (16:9 only for v1).
- No CMS, no web dashboard — this is a local, clone-and-run repo.
- No more than two themes.
- No publishing/upload automation (YouTube API) in v1.
