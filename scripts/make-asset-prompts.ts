/**
 * Phase 4a — emit per-asset, per-theme Gemini Imagen prompts.
 *
 * Reads `src/video-plan.json`, expands every `scenes[].assetRefs[]` into two
 * prompt variants (apple + vercel), writes them to
 *   `assets/prompts/<id>.<theme>.json`
 *
 * The final prompt string is composed as:
 *   {description} . {kind-specific guidance} . {theme style suffix}
 * where the theme suffix is copied verbatim from `design-style-guide.md` §6
 * so the imagery stays on-brand and realistic, not cartoonish.
 *
 * sha256(prompt) is stored on each variant — `generate-assets.ts` uses that
 * hash as its cache key.
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  type AssetKind,
  type VideoPlan,
  VideoPlanSchema,
} from "../src/video-plan.schema";
import {
  PromptVariantSchema,
  type AspectRatio,
  type PromptVariant,
} from "../src/asset-prompt.schema";
import { PlanThemeName } from "../src/video-plan.schema";

// ─── Style suffixes (verbatim from design-style-guide.md §6) ───────────────

const STYLE_SUFFIX: Record<"apple" | "vercel", string> = {
  apple:
    "clean modern product illustration, soft natural lighting, light neutral background (#FBFBFD), subtle depth, rounded geometry, Apple-keynote aesthetic, high detail, no text, no logos, no emoji, isometric or front-on consistent perspective.",
  vercel:
    "sleek minimalist tech illustration, true-black background (#000000), monochrome with electric-blue (#0070F3) highlights, hairline strokes, high contrast, Geist/Vercel aesthetic, high detail, no text, no logos, no emoji, consistent perspective.",
};

// ─── Per-kind guidance ─────────────────────────────────────────────────────

type KindSpec = {
  guidance: string;
  aspectRatio: AspectRatio;
  transparentBackground: boolean;
};

const KIND_SPEC: Record<AssetKind, KindSpec> = {
  icon: {
    guidance:
      "single subject centered, simple silhouette readable at small sizes, fully transparent background, no decorative elements, no shadows that imply a surface",
    aspectRatio: "1:1",
    transparentBackground: true,
  },
  background: {
    guidance:
      "abstract or environmental composition with no central subject, suitable as a low-opacity backdrop behind on-screen text, soft contrast, no focal subject",
    aspectRatio: "16:9",
    transparentBackground: false,
  },
  diagram: {
    guidance:
      "diagrammatic illustration with clear nodes and connecting arrows, geometric shapes, ordered visual hierarchy reading left-to-right, generous negative space",
    aspectRatio: "16:9",
    transparentBackground: false,
  },
  illustration: {
    guidance:
      "central hero subject, brand-mark style, balanced composition, suitable for an intro/outro title card",
    aspectRatio: "16:9",
    transparentBackground: false,
  },
};

// ─── Paths ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const PLAN_PATH = join(ROOT, "src", "video-plan.json");
const PROMPTS_DIR = join(ROOT, "assets", "prompts");

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!existsSync(PLAN_PATH)) {
    fail(
      `src/video-plan.json not found. Run \`npm run ingest\` first to build it from topic-details.md.`,
    );
  }

  const planRaw = JSON.parse(readFileSync(PLAN_PATH, "utf8")) as unknown;
  const planResult = VideoPlanSchema.safeParse(planRaw);
  if (!planResult.success) {
    fail(
      `video-plan.json is malformed:\n${planResult.error.issues
        .map((i) => `         - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }
  const plan: VideoPlan = planResult.data;

  mkdirSync(PROMPTS_DIR, { recursive: true });

  log(
    `expanding ${countAssetRefs(plan)} assetRefs × 2 themes = ` +
      `${countAssetRefs(plan) * 2} prompt files`,
  );

  const themes: PlanThemeName[] = args.theme ? [args.theme] : ["apple", "vercel"];
  let written = 0;
  let skipped = 0;

  for (const scene of plan.scenes) {
    for (const ref of scene.assetRefs) {
      for (const theme of themes) {
        const variant = composeVariant(theme, ref.id, ref.kind, ref.description, {
          scene: scene.id,
          sceneType: scene.type,
        });
        const outPath = join(PROMPTS_DIR, `${ref.id}.${theme}.json`);

        if (!args.force && existsSync(outPath)) {
          // Re-read existing; if hash matches, no need to rewrite.
          try {
            const existing = JSON.parse(readFileSync(outPath, "utf8")) as PromptVariant;
            if (existing.promptHash === variant.promptHash) {
              skipped += 1;
              continue;
            }
          } catch {
            /* fall through and overwrite */
          }
        }

        const validated = PromptVariantSchema.parse(variant);
        writeFileSync(outPath, JSON.stringify(validated, null, 2) + "\n");
        written += 1;
      }
    }
  }

  log(
    `wrote ${written} prompt files · skipped ${skipped} unchanged · ` +
      `directory: ${PROMPTS_DIR}`,
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function composeVariant(
  theme: PlanThemeName,
  id: string,
  kind: AssetKind,
  description: string,
  meta: { scene: string; sceneType: string },
): PromptVariant {
  const spec = KIND_SPEC[kind];
  const cleaned = description.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");

  const prompt = [
    cleaned + ".",
    spec.guidance + ".",
    STYLE_SUFFIX[theme],
  ].join(" ");

  return {
    id,
    kind,
    theme,
    description,
    prompt,
    aspectRatio: spec.aspectRatio,
    transparentBackground: spec.transparentBackground,
    promptHash: sha256(prompt),
    notes: `Scene: ${meta.scene} (${meta.sceneType})`,
  };
}

function countAssetRefs(plan: VideoPlan): number {
  return plan.scenes.reduce((acc, s) => acc + s.assetRefs.length, 0);
}

function sha256(input: string): string {
  return "sha256:" + createHash("sha256").update(input).digest("hex").slice(0, 32);
}

// ─── CLI ───────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { theme?: PlanThemeName; force: boolean } {
  let theme: PlanThemeName | undefined;
  let force = false;
  for (const arg of argv) {
    if (arg === "--force") {
      force = true;
    } else if (arg.startsWith("--theme=")) {
      const v = arg.slice("--theme=".length);
      if (v !== "apple" && v !== "vercel") {
        fail(`Invalid theme "${v}". Use --theme=apple or --theme=vercel.`);
      }
      theme = v;
    } else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    }
  }
  return { theme, force };
}

const USAGE = `
Usage: npm run assets:prompts -- [options]

  --theme=apple|vercel   Only emit prompts for one theme.
  --force                Re-emit prompts even if the hash is unchanged.
  --help, -h             Print this message.
`;

function log(msg: string): void {
  console.log(`[assets:prompts] ${msg}`);
}

function fail(msg: string): never {
  console.error(`[assets:prompts] ERROR: ${msg}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
