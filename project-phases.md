# Project Phases — Build Blueprint

> Read `project-description.md` first. Build the project phase by phase, in order. **Do not skip ahead.** At the end of each phase, stop, summarize what changed, and confirm the phase's "Exit criteria" are met before starting the next phase. Commit after each phase.

Legend: `[ ]` = todo · keep this file updated by checking boxes as you complete tasks.

---

## Phase 0 — Foundation & Scaffolding

**Goal:** A running, empty Remotion project with skills installed and themes stubbed.

Tasks:
- [x] Install the Remotion skills listed in `project-description.md` §5 and read them before writing any Remotion code.
- [x] Scaffold Remotion: `npx create-video@latest --yes --blank --no-tailwind` (merge into repo root).
- [x] Confirm `src/index.tsx` uses `registerRoot()` (`.tsx`, not `.ts`).
- [x] Set fps=30, width=1920, height=1080 as project defaults.
- [x] Add `.env.example` with `GEMINI_API_KEY=`. Load via `dotenv` in scripts only (never expose in client/render bundle).
- [x] Add `prism-react-renderer` dependency for code highlighting.
- [x] Add npm scripts: `dev` (Remotion studio), `render`, `ingest`, `assets:prompts`, `assets:gen`.
- [x] Create `README.md` documenting the clone → run flow from `project-description.md` §7.

**Exit criteria:** `npm run dev` opens Remotion Studio showing a blank placeholder composition at 1080p/30fps.

---

## Phase 1 — Theme System (Apple + Vercel/Geist)

**Goal:** Two fully-tokenized themes that re-skin everything via one prop.

Tasks:
- [x] Implement `src/theme/apple.ts` and `src/theme/vercel.ts` using the exact tokens in `design-style-guide.md` (colors, type, spacing, radii, shadows, motion).
- [x] For the Vercel theme, follow the `create-remotion-geist` skill: dark background, Geist font, 10-step color scale, spring animations, Geist icons.
- [x] Build `ThemeProvider.tsx` exposing a `useTheme()` hook; theme chosen by a `theme: "apple" | "vercel"` composition prop.
- [x] Wire the theme prop through `Root.tsx` so it can be set per-render (`--props='{"theme":"vercel"}'`).
- [x] Build a `/dev` test composition that renders a sample of every token (swatches, type ramp, buttons, a card) for visual QA in both themes.

**Exit criteria:** Toggling the `theme` prop visibly switches the test composition between a clean light Apple look and a dark Geist look, with zero hard-coded colors in components.

---

## Phase 2 — Reusable Component Library

**Goal:** The building blocks every scene shares, theme-aware.

Tasks:
- [x] `Card` (rounded, soft shadow Apple / hairline border Vercel).
- [x] `Icon` wrapper: resolves to Geist icons (Vercel) or clean line icons (Apple); never emojis.
- [x] `AnimatedArrow` / connector (for diagrams; draws on with spring).
- [x] `Badge` / `Pill` / `Tag`.
- [x] `Title` / `Kicker` / `BodyText` typographic components bound to theme ramp.
- [x] `CodeEditor` shell: window chrome, collapsed/expand state, line numbers, filename tab. (Typing logic comes in Phase 5.)
- [x] `BackgroundLayer`: renders the theme's background + generated background image slot.
- [x] A "component gallery" composition for QA.

**Exit criteria:** Gallery composition shows every component correctly in both themes.

---

## Phase 3 — Ingest Pipeline (topic-details.md → video-plan.json)

**Goal:** Turn raw research into a structured, scene-by-scene plan.

Tasks:
- [x] Define the `video-plan.json` schema (documented inline): `meta` (title, theme, totalDurationTarget), `scenes[]` where each scene has `{ id, type, durationInFrames, title, narration, bullets, codeBlocks?, assetRefs[] }`.
- [x] Write `scripts/ingest.ts`: parse `topic-details.md` (sections: What it is / Why it matters / How it's done) and map them into a logical long-form arc: Intro → What → Why → How (multi-step) → Recap → Outro.
- [x] Distribute durations to hit the 8–15 min target (≈14,400–27,000 frames at 30fps); ensure pacing per scene type.
- [x] For each "How" step, decide scene type (Concept / Diagram / Code / Comparison).
- [x] Populate `assetRefs` with placeholders that Phase 4 will turn into prompts.
- [x] Validate output against the schema; fail loudly on malformed `topic-details.md`.

**Exit criteria:** Running `npm run ingest` on a sample Penetration Testing `topic-details.md` produces a valid `video-plan.json` with a coherent scene list and sane durations.

---

## Phase 4 — Asset Prompt + Generation Pipeline (Gemini Imagen)

**Goal:** Every scene's icons/backgrounds/graphics generated and cached, per theme.

Tasks:
- [x] `scripts/make-asset-prompts.ts`: for each `assetRef`, emit a structured Imagen prompt to `/assets/prompts/{id}.json` with **two variants** (apple = light/clean/realistic; vercel = dark/Geist/realistic). Encode style guidance from `design-style-guide.md` into every prompt so output is consistent and realistic, not cartoonish.
- [x] `scripts/generate-assets.ts`: read prompts, call the **Gemini Imagen API**, write images to `/public/assets/{theme}/{id}.png`.
- [x] Implement a content-hash cache: skip regeneration if prompt unchanged (avoid re-billing). Store a `manifest.json` mapping id→hash→path.
- [x] Handle API errors/rate limits with retry + clear logging. Never hard-fail the whole batch on one image.
- [x] Provide a `--force` flag to regenerate, and a `--theme` filter.
- [x] Add a fallback: if an asset fails, generate a code/SVG placeholder so the render never breaks.

**Exit criteria:** `npm run assets:prompts && npm run assets:gen` produces cached, theme-correct realistic images for the sample topic; a second run regenerates nothing.

---

## Phase 5 — Scenes & Code-Typing Effect

**Goal:** Real scene components that consume `video-plan.json` + assets.

Tasks:
- [ ] `IntroScene`: animated title card with kicker, topic title, theme background.
- [ ] `ConceptScene`: heading + animated bullets + supporting icon/graphic reveal.
- [ ] `DiagramScene`: nodes (Cards/Icons) + `AnimatedArrow`s drawing on in narration order (the ByteByteGo "reveal piece by piece" pattern).
- [ ] `ComparisonScene`: side-by-side / before-after layout.
- [ ] `CodeEditorScene`: realistic typing effect — reveal code char-by-char (or token-by-token) driven by `useCurrentFrame()`; blinking cursor; collapsed editor that expands; syntax highlight via `prism-react-renderer`; filename tab + window chrome.
- [ ] `OutroScene`: recap + end card.
- [ ] `MainVideo.tsx`: read `video-plan.json`, place each scene on the timeline via `<Series>`/`<Sequence>` with correct `durationInFrames`, applying scene transitions.
- [ ] Register `MainVideo` in `Root.tsx` with the `theme` prop and `calculateMetadata` to set total duration from the plan.

**Exit criteria:** `npm run dev` plays a continuous 8–15 min video assembled from the plan, including at least one fully-working code-typing editor scene, correct in both themes.

---

## Phase 6 — Audio, Transitions & Polish

**Goal:** Make it feel finished (minus VO, which the user adds later).

Tasks:
- [ ] Add a background-music slot (`<Audio>`), with a clearly-marked silent/placeholder track and volume ducking config; document where the user drops their own VO track.
- [ ] Add consistent scene transitions (cross-fade / slide) via `@remotion/transitions`.
- [ ] Add subtle motion polish: spring entrances, parallax on backgrounds, easing per design guide's motion tokens.
- [ ] Accessibility/legibility pass: contrast, safe margins (title-safe area), font sizes readable at 1080p.
- [ ] Performance pass: lazy-load heavy assets, avoid layout thrash, keep render times reasonable.

**Exit criteria:** Smooth transitions throughout, music slot working, no jarring cuts; both themes feel polished.

---

## Phase 7 — Render, Docs & Repeatability

**Goal:** One-command production + a clean clone-and-run experience.

Tasks:
- [ ] `npm run render -- --props='{"theme":"vercel"}'` → MP4 in `/out`; same for apple.
- [ ] Document the full per-video workflow in `README.md` (research prompt → drop file → ingest → assets → dev → render).
- [ ] Add a `examples/penetration-testing/` folder with the sample `topic-details.md` and its generated `video-plan.json` as a reference.
- [ ] Add troubleshooting notes (missing API key, asset failures, font loading, render OOM).
- [ ] Final QA against `project-description.md` §7 "Definition of done" checklist.

**Exit criteria:** A new machine can clone the repo, follow the README, and produce a finished themed MP4 from a fresh topic.

---

## Suggested commit checkpoints
`phase-0-scaffold` · `phase-1-themes` · `phase-2-components` · `phase-3-ingest` · `phase-4-assets` · `phase-5-scenes` · `phase-6-polish` · `phase-7-render`
