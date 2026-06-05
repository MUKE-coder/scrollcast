# prompt.md

This file has **two prompts**:

- **Part A** — paste into **Claude Code** (inside the repo) to build/continue the project.
- **Part B** — paste into **claude.ai (web)** when researching each new topic, to produce a clean `topic-details.md`.

---

## PART A — Claude Code kickoff prompt

> Paste everything in this block into Claude Code from the repo root.

```
You are building a clone-and-run video engine called ScrollCast that turns a single research file (topic-details.md) into a polished long-form (8–15 min, 1920×1080, 30fps) animated technical explainer video — ByteByteGo style — using Remotion. There are two themes only: "apple" (light/clean) and "vercel" (dark/Geist). No AI voiceover (music/silence only; I add VO later). Assets (icons, backgrounds, diagrams, graphics) are AI-generated at build time via the Gemini Imagen API and must be cached.

READ THESE FILES FIRST, IN THIS ORDER, AND TREAT THEM AS THE SPEC:
1. project-description.md   ← what the project is; source of truth
2. project-phases.md        ← the phased build plan; follow it in order
3. design-style-guide.md    ← the visual token system for both themes

THEN INSTALL AND READ THESE REMOTION SKILLS BEFORE WRITING ANY REMOTION CODE:
- npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices
- npx skills add https://github.com/vercel-labs/skill-remotion-geist --skill create-remotion-geist
(Also available if useful: affaan-m/everything-claude-code remotion-video-creation, ncklrs/startup-os-skills remotion-animation.)

HARD RULES:
- Scaffold Remotion with: npx create-video@latest --yes --blank --no-tailwind
- Entry point is src/index.tsx using registerRoot() (a .tsx, not .ts).
- Animate only via useCurrentFrame() + interpolate()/spring() + Easing.
- Code blocks use prism-react-renderer (NEVER regex highlighting), shown in a code-editor UI with window chrome, line numbers, a collapsed→expand state, and a realistic char/token-by-token typing effect with a blinking cursor.
- NEVER use emojis. Use Geist icons for the Vercel theme and clean line icons for the Apple theme.
- Never hard-code colors/sizes/motion — read everything from the active theme tokens in design-style-guide.md.
- Keep the Gemini API key in .env only; never bundle it into the render. Cache generated assets by prompt hash so re-runs don't re-bill.

WORKFLOW THE REPO MUST SUPPORT (per project-description.md):
topic-details.md (I provide) → npm run ingest (build src/video-plan.json) → npm run assets:prompts → npm run assets:gen (Gemini Imagen, cached) → npm run dev (Remotion Studio preview) → npm run render -- --props='{"theme":"vercel"}' (MP4 in /out). Theme must be switchable per render with no layout breakage.

HOW TO PROCEED:
- Work strictly phase by phase as defined in project-phases.md, starting at Phase 0.
- At the end of EACH phase: check off its tasks in project-phases.md, give me a short summary of what you built, confirm the phase's Exit criteria are met, then STOP and wait for me to say "continue" before the next phase. Commit with the suggested checkpoint name.
- If something in the skills conflicts with these files, follow the skills for Remotion technical specifics and these files for product/design decisions; if still unclear, ask me one concise question rather than guessing.
- A sample topic-details.md about "Penetration Testing" will be used as the canonical test case. If it's not present yet, generate a realistic placeholder one so the pipeline can be tested end to end.

Begin with Phase 0 now. Confirm you've read all three project files and installed the skills before you start.
```

---

## PART B — Research prompt for claude.ai (web) → produces `topic-details.md`

> Use this on the web each time you pick a new topic. Replace `{{TOPIC}}`. Save the output as `topic-details.md` and drop it into the repo root. Keep it information-rich — it's the script source, so accuracy and structure matter more than prose flair.

```
You are my research assistant preparing source material for an 8–15 minute animated technical explainer video (ByteByteGo style). The video engine will parse your output, so structure and clarity matter as much as accuracy.

TOPIC: {{TOPIC}}

Produce a single Markdown document I can save as topic-details.md. Be technically accurate, concrete, and self-contained (assume the reader/animator is smart but not an expert in this topic). Prefer specifics, real examples, numbered steps, and clear cause-and-effect over vague description. No fluff, no marketing tone. Do not include images.

Use EXACTLY this structure and headings:

# {{TOPIC}}

## TL;DR
- 3–5 punchy bullets summarizing the whole topic (this seeds the intro and outro).

## What it is
- A clear definition in plain language.
- The core idea / mental model (something visual that can become a diagram).
- Key terms & vocabulary (term: one-line definition).
- Where it fits in the bigger picture (what it relates to / contrasts with).

## Why it matters
- The real-world problem it solves.
- Concrete consequences of doing it / not doing it (with examples or rough numbers if relevant).
- Who uses it and in what situations.
- Common misconceptions to correct.

## How it's done
Break this into clear, ordered STEPS or PHASES. For each step include:
- ### Step N — <name>
- What happens in this step (plain explanation).
- A simple visual idea: describe the diagram or animation that would explain this step (boxes, arrows, flows, before/after) so it can be animated.
- If code is involved: include a short, REALISTIC code snippet (with the language noted) that would look good typed into an on-screen editor. Keep snippets ≤ ~15 lines and self-explanatory.
- Tools / techniques / commands actually used in practice.

## Key comparisons (if applicable)
- Any "X vs Y" or "before vs after" contrasts worth a side-by-side scene.

## Recap
- 3–5 bullets restating the most important takeaways (seeds the outro).

## Suggested visuals
- A short list of the 5–8 most important diagrams/graphics this video needs, each in one line (these will become AI-image-generation prompts and Remotion scenes).

CONSTRAINTS:
- Keep total length focused enough to fit an 8–15 minute video — depth over breadth; if the topic is huge, cover the most important 5–8 ideas well rather than everything shallowly.
- Every code snippet must be plausible and correct for the topic.
- Use no emojis.
```

---

### Tip
Keep one `topic-details.md` per video. When you start a new topic, archive the old one (e.g. into `examples/<topic>/`) so you always have a working reference, then drop the new file in root and re-run the pipeline from `npm run ingest`.
