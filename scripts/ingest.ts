/**
 * Phase 3 — ingest pipeline.
 * Parses the user-authored `topic-details.md` at the repo root and emits a
 * structured `src/video-plan.json` for the renderer.
 *
 * Maps the research arc onto a long-form video arc:
 *   Intro → What it is → Why it matters → How (one scene per step) →
 *   [Key comparisons] → Recap → Outro
 *
 * Each "How" step picks its scene type by content:
 *   - has fenced code  → `code`
 *   - has "Visual idea:" → `diagram`
 *   - otherwise          → `concept`
 *
 * Durations are assigned per scene type, then uniformly scaled to fall
 * inside the 8–15 min spec window (14,400–27,000 frames at 30 fps).
 *
 * Fails loudly with actionable messages for missing required sections.
 */

import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  VideoPlanSchema,
  type AssetRef,
  type CodeBlock,
  type PlanThemeName,
  type Scene,
  type SceneType,
  type VideoPlan,
} from "../src/video-plan.schema";

// ─── Constants ─────────────────────────────────────────────────────────────

const FPS = 30 as const;
const WIDTH = 1920 as const;
const HEIGHT = 1080 as const;

const MIN_SECONDS = 480; // 8 min  → 14,400 frames
const MAX_SECONDS = 900; // 15 min → 27,000 frames

const BASE_DURATION_SECONDS: Record<SceneType, number> = {
  intro: 12,
  concept: 28,
  diagram: 34,
  code: 38,
  comparison: 26,
  recap: 16,
  outro: 8,
};

const REQUIRED_SECTIONS = [
  "TL;DR",
  "What it is",
  "Why it matters",
  "How it's done",
  "Recap",
] as const;

const ROOT = process.cwd();
const SOURCE_PATH = join(ROOT, "topic-details.md");
const OUTPUT_PATH = join(ROOT, "src", "video-plan.json");

// ─── Entrypoint ────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!existsSync(SOURCE_PATH)) {
    fail(
      `topic-details.md not found at ${SOURCE_PATH}.\n` +
        `       Use the research prompt in prompt.md (Part B) on claude.ai to produce one,\n` +
        `       then drop it in the repo root.`,
    );
  }

  const md = readFileSync(SOURCE_PATH, "utf8");
  log(`reading ${SOURCE_PATH} (${md.length} chars)`);

  const doc = parseTopicDoc(md);
  log(
    `topic: "${doc.topicTitle}" · TL;DR ${doc.tldr.length} bullets · ` +
      `${doc.steps.length} how-steps · recap ${doc.recap.length} bullets` +
      (doc.keyComparisons ? " · has key-comparisons" : ""),
  );

  let scenes = buildScenes(doc);
  scenes = rescaleDurations(scenes);

  const totalFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);

  const plan: VideoPlan = {
    meta: {
      title: doc.topicTitle,
      theme: args.theme,
      totalDurationFrames: totalFrames,
      totalDurationSeconds: totalFrames / FPS,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
      generatedAt: new Date().toISOString(),
      source: "topic-details.md",
    },
    scenes,
  };

  const result = VideoPlanSchema.safeParse(plan);
  if (!result.success) {
    fail(
      `Generated plan failed schema validation:\n${result.error.issues
        .map((i) => `         - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(plan, null, 2) + "\n");
  log(`wrote ${OUTPUT_PATH}`);
  log(
    `${plan.scenes.length} scenes · ${plan.meta.totalDurationSeconds.toFixed(1)}s total ` +
      `(${(plan.meta.totalDurationSeconds / 60).toFixed(1)} min; target 8–15 min)`,
  );
  log(`scene breakdown:`);
  for (const s of plan.scenes) {
    console.log(
      `         · ${s.id.padEnd(20)} ${s.type.padEnd(11)} ` +
        `${(s.durationInFrames / FPS).toFixed(1).padStart(5)}s  ${s.title}`,
    );
  }
}

// ─── CLI args ──────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { theme: PlanThemeName } {
  let theme: PlanThemeName = "vercel";
  for (const arg of argv) {
    if (arg.startsWith("--theme=")) {
      const v = arg.slice("--theme=".length);
      if (v !== "apple" && v !== "vercel") {
        fail(`Invalid theme "${v}". Use --theme=apple or --theme=vercel.`);
      }
      theme = v;
    }
  }
  return { theme };
}

// ─── Topic doc parsing ─────────────────────────────────────────────────────

type TopicStep = {
  /** "Step 1 — Scoping and Rules of Engagement" → "Scoping and Rules of Engagement" */
  name: string;
  /** Raw subsection markdown so we can re-extract subparts. */
  raw: string;
  paragraphs: string[];
  bullets: string[];
  codeBlocks: CodeBlock[];
  visualIdea?: string;
};

type TopicDoc = {
  topicTitle: string;
  tldr: string[];
  whatItIs: string;
  whyItMatters: string;
  steps: TopicStep[];
  keyComparisons?: string;
  recap: string[];
  suggestedVisuals: string[];
};

function parseTopicDoc(raw: string): TopicDoc {
  const text = raw.replace(/\r\n/g, "\n");

  const h1 = text.match(/^#\s+(.+)$/m);
  if (!h1) {
    fail(
      `topic-details.md must start with a '# {{TOPIC}}' heading.\n` +
        `       See prompt.md (Part B) for the required template.`,
    );
  }
  const topicTitle = h1[1].trim();

  const h2 = splitByHeading(text, 2);

  for (const required of REQUIRED_SECTIONS) {
    if (!h2.has(required)) {
      fail(
        `topic-details.md is missing required section: '## ${required}'.\n` +
          `       Required sections: ${REQUIRED_SECTIONS.join(", ")}.\n` +
          `       Found: ${[...h2.keys()].join(", ") || "(none)"}.`,
      );
    }
  }

  const tldr = extractBullets(h2.get("TL;DR")!);
  if (tldr.length === 0) {
    fail(`'## TL;DR' must contain at least one bullet. Found none.`);
  }

  const recap = extractBullets(h2.get("Recap")!);
  if (recap.length === 0) {
    fail(`'## Recap' must contain at least one bullet. Found none.`);
  }

  // Steps live inside "How it's done" as ### Step N — Name
  const howSection = h2.get("How it's done")!;
  const stepSections = splitByHeading(howSection, 3);
  const steps: TopicStep[] = [];
  for (const [headingTitle, body] of stepSections) {
    const stepNameMatch = headingTitle.match(/^step\s+\d+\s*[—\-–]\s*(.+)$/i);
    const name = stepNameMatch ? stepNameMatch[1].trim() : headingTitle;
    steps.push({
      name,
      raw: body,
      paragraphs: extractParagraphs(body),
      bullets: extractBullets(body),
      codeBlocks: extractCodeBlocks(body),
      visualIdea: extractVisualIdea(body),
    });
  }
  if (steps.length === 0) {
    fail(
      `'## How it\\'s done' must contain at least one '### Step N — Name' subsection.\n` +
        `       The 'How' steps drive the bulk of the video timeline.`,
    );
  }

  const keyComparisons = h2.get("Key comparisons")?.trim() || undefined;
  const suggestedVisuals = h2.has("Suggested visuals")
    ? extractBullets(h2.get("Suggested visuals")!)
    : [];

  return {
    topicTitle,
    tldr,
    whatItIs: h2.get("What it is")!.trim(),
    whyItMatters: h2.get("Why it matters")!.trim(),
    steps,
    keyComparisons,
    recap,
    suggestedVisuals,
  };
}

// ─── Markdown helpers ──────────────────────────────────────────────────────

/**
 * Split `text` into a map keyed by heading title for a given heading level.
 * Skips matches inside fenced code blocks. Stops a section when a heading of
 * the same level appears; deeper headings (level+1, level+2, …) are kept
 * inside the current section.
 */
function splitByHeading(text: string, level: number): Map<string, string> {
  const prefix = "#".repeat(level) + " ";
  const lines = text.split("\n");
  const sections = new Map<string, string>();
  let currentTitle: string | null = null;
  let currentLines: string[] = [];
  let inCodeBlock = false;

  const flush = () => {
    if (currentTitle !== null) {
      sections.set(currentTitle, currentLines.join("\n").trim());
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) inCodeBlock = !inCodeBlock;

    const isHeading =
      !inCodeBlock &&
      line.startsWith(prefix) &&
      !line.startsWith("#".repeat(level + 1));

    if (isHeading) {
      flush();
      currentTitle = line.slice(prefix.length).trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flush();
  return sections;
}

function extractBullets(text: string): string[] {
  const bullets: string[] = [];
  let inCodeBlock = false;
  let current: string | null = null;

  const flush = () => {
    if (current !== null) bullets.push(stripMarkdown(current.trim()));
    current = null;
  };

  for (const line of text.split("\n")) {
    if (line.startsWith("```")) {
      flush();
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const m = line.match(/^[-*]\s+(.+)$/);
    if (m) {
      flush();
      current = m[1];
    } else if (current !== null && /^\s+\S/.test(line)) {
      // continuation of previous bullet (indented next line)
      current += " " + line.trim();
    } else {
      flush();
    }
  }
  flush();
  return bullets.filter((b) => b.length > 0);
}

function extractParagraphs(text: string): string[] {
  // Drop fenced code blocks before paragraph-splitting.
  const stripped = text.replace(/```[\s\S]*?```/g, "");
  const out: string[] = [];
  for (const block of stripped.split(/\n\s*\n/)) {
    const t = block.trim();
    if (!t) continue;
    if (t.startsWith("|") || t.startsWith("###")) continue; // table or subheading
    // Mixed blocks (prose immediately followed by a bullet list without a
    // blank line) are common in the research template — pull the non-bullet
    // lines as prose so opening sentences aren't dropped on the floor.
    const prose = t
      .split("\n")
      .filter((line) => {
        const l = line.trim();
        return l.length > 0 && !/^[-*]\s/.test(l) && !l.startsWith("|");
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!prose) continue;
    // Skip label-style residues left after bullets are stripped — a line
    // ending with `:` and containing no sentence-ending punctuation is an
    // intro label ("Key terms:", "Common misconceptions to correct:"), not
    // a paragraph.
    if (prose.endsWith(":") && !/[.!?](\s|$)/.test(prose.slice(0, -1))) continue;
    out.push(stripMarkdown(prose));
  }
  return out;
}

function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const re = /```([\w-]*)\n([\s\S]*?)\n```/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    i += 1;
    const language = (m[1] || "text").toLowerCase();
    blocks.push({
      filename: defaultFilename(language, i),
      language,
      code: m[2],
    });
  }
  return blocks;
}

function extractVisualIdea(text: string): string | undefined {
  const m = text.match(/visual idea:\s*([\s\S]+?)(?:\n\n|\n```|$)/i);
  if (!m) return undefined;
  return stripMarkdown(m[1].replace(/\s+/g, " ").trim());
}

function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function defaultFilename(lang: string, idx: number): string {
  const ext: Record<string, string> = {
    typescript: "ts",
    ts: "ts",
    tsx: "tsx",
    jsx: "jsx",
    javascript: "js",
    js: "js",
    bash: "sh",
    sh: "sh",
    shell: "sh",
    zsh: "sh",
    python: "py",
    py: "py",
    markdown: "md",
    md: "md",
    json: "json",
    yaml: "yml",
    yml: "yml",
    html: "html",
    css: "css",
    sql: "sql",
    go: "go",
    rust: "rs",
    rs: "rs",
    c: "c",
    cpp: "cpp",
    java: "java",
  };
  return `snippet-${idx}.${ext[lang] ?? "txt"}`;
}

// ─── Scene building ────────────────────────────────────────────────────────

function buildScenes(doc: TopicDoc): Scene[] {
  const scenes: Scene[] = [];
  const idCounter = new Map<string, number>();
  const nextId = (prefix: string) => {
    const n = (idCounter.get(prefix) ?? 0) + 1;
    idCounter.set(prefix, n);
    return n === 1 && !["how"].includes(prefix) ? prefix : `${prefix}-${n}`;
  };

  // 1. Intro
  scenes.push(
    makeScene("intro", {
      id: nextId("intro"),
      title: doc.topicTitle,
      kicker: "An animated technical explainer",
      narration: doc.tldr.join(" "),
      bullets: doc.tldr.slice(0, 5),
      assetRefs: [
        asset("intro-bg", "background", `Abstract introductory background for ${doc.topicTitle}`),
        asset("intro-mark", "illustration", `Conceptual hero illustration representing ${doc.topicTitle}`),
      ],
    }),
  );

  // 2. What it is
  const whatPara = extractParagraphs(doc.whatItIs);
  const whatBullets = extractBullets(doc.whatItIs);
  scenes.push(
    makeScene("concept", {
      id: nextId("what"),
      title: `What is ${doc.topicTitle.toLowerCase()}?`,
      kicker: "Definition",
      narration: joinNarration(whatPara.slice(0, 2)),
      bullets: whatBullets.slice(0, 5),
      assetRefs: [
        asset("what-icon", "icon", `Conceptual icon representing ${doc.topicTitle}`),
      ],
    }),
  );

  // 3. Why it matters
  const whyPara = extractParagraphs(doc.whyItMatters);
  const whyBullets = extractBullets(doc.whyItMatters);
  scenes.push(
    makeScene("concept", {
      id: nextId("why"),
      title: "Why it matters",
      kicker: "Impact",
      narration: joinNarration(whyPara.slice(0, 2)),
      bullets: whyBullets.slice(0, 5),
      assetRefs: [
        asset("why-icon", "icon", `Risk-and-consequence icon for ${doc.topicTitle}`),
      ],
    }),
  );

  // 4. How it's done — one scene per step
  for (const step of doc.steps) {
    const type = pickStepSceneType(step);
    const id = `how-${slug(step.name).slice(0, 28)}`;
    scenes.push(
      makeScene(type, {
        id,
        title: step.name,
        kicker: `How · step ${scenes.filter((s) => s.id.startsWith("how-")).length + 1}`,
        narration: joinNarration(step.paragraphs.slice(0, 2)),
        bullets: step.bullets.slice(0, 5),
        codeBlocks: type === "code" ? step.codeBlocks : undefined,
        assetRefs: buildStepAssetRefs(id, type, step),
      }),
    );
  }

  // 5. Key comparisons (optional)
  if (doc.keyComparisons) {
    const cmpBullets = extractBullets(doc.keyComparisons);
    const cmpPara = extractParagraphs(doc.keyComparisons);
    scenes.push(
      makeScene("comparison", {
        id: nextId("comparison"),
        title: "Key comparisons",
        kicker: "Side-by-side",
        narration: joinNarration(cmpPara.slice(0, 2)),
        bullets: cmpBullets.slice(0, 6),
        assetRefs: [
          asset("compare-left-icon", "icon", `Left-side comparison subject for ${doc.topicTitle}`),
          asset("compare-right-icon", "icon", `Right-side comparison subject for ${doc.topicTitle}`),
        ],
      }),
    );
  }

  // 6. Recap
  scenes.push(
    makeScene("recap", {
      id: nextId("recap"),
      title: "Recap",
      kicker: "What to remember",
      narration: doc.recap.join(" "),
      bullets: doc.recap.slice(0, 5),
      assetRefs: [
        asset("recap-bg", "background", `Closing recap background for ${doc.topicTitle}`),
      ],
    }),
  );

  // 7. Outro
  scenes.push(
    makeScene("outro", {
      id: nextId("outro"),
      title: "Thanks for watching",
      narration: "",
      bullets: [],
      assetRefs: [
        asset("outro-mark", "illustration", `Closing brand mark for the ${doc.topicTitle} video`),
      ],
    }),
  );

  return scenes;
}

function pickStepSceneType(step: TopicStep): SceneType {
  if (step.codeBlocks.length > 0) return "code";
  if (step.visualIdea) return "diagram";
  return "concept";
}

function buildStepAssetRefs(id: string, type: SceneType, step: TopicStep): AssetRef[] {
  const refs: AssetRef[] = [];
  if (type === "diagram" && step.visualIdea) {
    refs.push(asset(`${id}-diagram`, "diagram", step.visualIdea));
  } else if (type === "code") {
    refs.push(
      asset(
        `${id}-icon`,
        "icon",
        `Icon representing ${step.name} (language: ${step.codeBlocks[0]?.language ?? "code"})`,
      ),
    );
  } else {
    refs.push(asset(`${id}-icon`, "icon", `Conceptual icon for ${step.name}`));
  }
  return refs;
}

// ─── Scene factory + helpers ───────────────────────────────────────────────

function makeScene(
  type: SceneType,
  fields: {
    id: string;
    title: string;
    kicker?: string;
    narration: string;
    bullets: string[];
    codeBlocks?: CodeBlock[];
    assetRefs: AssetRef[];
  },
): Scene {
  return {
    id: fields.id,
    type,
    title: fields.title,
    kicker: fields.kicker,
    narration: fields.narration,
    bullets: fields.bullets,
    codeBlocks: fields.codeBlocks,
    assetRefs: fields.assetRefs,
    durationInFrames: Math.round(BASE_DURATION_SECONDS[type] * FPS),
  };
}

const asset = (id: string, kind: AssetRef["kind"], description: string): AssetRef => ({
  id,
  kind,
  description,
});

function joinNarration(paragraphs: string[]): string {
  return paragraphs.join("\n\n").trim();
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Duration scaling ──────────────────────────────────────────────────────

/**
 * Uniformly scales every scene's `durationInFrames` so the total lands in
 * the 8–15 min window. Doesn't touch scenes if the base sum already fits.
 */
function rescaleDurations(scenes: Scene[]): Scene[] {
  const totalFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);
  const totalSeconds = totalFrames / FPS;

  let scale = 1;
  if (totalSeconds < MIN_SECONDS) scale = MIN_SECONDS / totalSeconds;
  else if (totalSeconds > MAX_SECONDS) scale = MAX_SECONDS / totalSeconds;

  if (scale === 1) {
    log(`durations: ${totalSeconds.toFixed(1)}s in range, no scaling`);
    return scenes;
  }

  log(
    `durations: base ${totalSeconds.toFixed(1)}s outside 8–15 min → ` +
      `scaling by ${scale.toFixed(3)}`,
  );

  return scenes.map((s) => ({
    ...s,
    durationInFrames: Math.max(1, Math.round(s.durationInFrames * scale)),
  }));
}

// ─── Logging + exit ────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[ingest] ${msg}`);
}

function fail(msg: string): never {
  console.error(`[ingest] ERROR: ${msg}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
