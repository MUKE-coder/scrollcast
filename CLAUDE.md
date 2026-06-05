# ScrollCast — Claude Code is the engine

When you (Claude Code) are invoked in this repo, **you are the video engine**. The user drops a `topic-details.md` in the root and expects you to produce the best possible 8–15 min animated technical explainer at `out/scrollcast-{theme}.mp4`. The npm scripts in this repo are *tools you call*, not a substitute for your judgment.

Run `/make-video` as the canonical entry point. If the user gives you a topic without invoking the slash command, do the same workflow anyway.

## Source-of-truth specs (read in this order before working)
1. `project-description.md` — what the project is and what "done" looks like
2. `design-style-guide.md` — token names, motion values, and the verbatim Imagen style suffix. **Never hard-code colors / sizes / motion** — read tokens from `useTheme()` or `src/theme/{apple,vercel}.ts`.
3. `project-phases.md` — phased build plan (all 8 phases are complete; this file is for context, not action)

## Key conventions you must follow
- **No emojis anywhere** — in code, in comments, in markdown, in scene text. Use Geist icons (Vercel) or clean line icons (Apple) — the `Icon` component wraps `lucide-react`.
- **Two themes only:** `apple` (light) and `vercel` (dark). Theme prop drives the entire render; never branch on theme inside a scene.
- **Animation:** only via `useCurrentFrame()` + `interpolate()` / `spring()` / `Easing`. No CSS transitions, no Tailwind animation classes.
- **Code blocks:** `prism-react-renderer` (never regex-based highlighting), rendered in the `CodeEditor` shell with window chrome and line numbers.
- **1920×1080 @ 30 fps,** 8–15 min long-form, MP4 output.
- **Audio:** no AI VO. There is a music slot in `src/MainVideo.tsx` and the user adds VO in post.

## Layout of the codebase
```
src/
  Root.tsx              <Composition> registry, calculateMetadata
  MainVideo.tsx         reads video-plan.json, lays scenes on TransitionSeries
  video-plan.json       generated per video — you OWN this file at runtime
  theme/                apple.ts, vercel.ts, ThemeProvider, loadFonts
  components/           Card, Icon, Pill, AnimatedArrow, CodeEditor, BackgroundLayer, typography
  scenes/               Intro / Concept / Diagram / CodeEditor / Comparison / Recap / Outro
  dev/                  ThemeGallery, ComponentGallery (for QA, not in the timeline)
scripts/
  ingest.ts             baseline parser — produces a *starting point* video-plan.json
  make-asset-prompts.ts video-plan.json → assets/prompts/*.json
  generate-assets.ts    prompts → Gemini image-gen OR theme-aware SVG fallback
  svg-library.ts        13 isometric icons + 3 bg patterns + diagrams + illustrations
public/assets/{theme}/  generated images; consumed by BackgroundLayer
examples/penetration-testing/  canonical sample (topic + plan + walkthrough)
```

## Your role vs the scripts' role

- `npm run ingest` is a regex parser. It produces a serviceable but mechanical `video-plan.json`. **You are expected to refine its output** — rewrite bullets that read like paragraph dumps, pick specific icons per scene, retitle scenes, adjust pacing, swap scene types when content fits better. The basic pipeline alone makes a *working* video; the goal here is the *best* video.
- `npm run assets:gen` either calls Gemini Imagen (if `GEMINI_API_KEY` is set in `.env`) or falls back to `scripts/svg-library.ts`. You can also write asset files directly to `public/assets/{theme}/` — for example, a hand-tuned SVG that matches a specific scene better than the library default.
- `npm run render:{apple,vercel}` produces the final MP4. Run this only when you're satisfied with the preview.

## When in doubt
Bias toward the highest-quality output. A pentest video's "Reconnaissance" scene should not show a generic cube icon; pick the `Network` lucide icon and write a tight one-line narration. A "Why it matters" scene should not dump three bullet lists pasted together; pick the 3–4 strongest consequences and rewrite them as parallel one-liners. If a topic has a unique visual that no existing scene type covers, write a one-off React component in `src/scenes/Custom{Slug}Scene.tsx` and add it to the `SceneRouter` map.
