/**
 * Phase 4b — generate (or fall back) images from prompt files.
 *
 * For each `assets/prompts/<id>.<theme>.json`:
 *   1. Look up the entry in `public/assets/manifest.json` keyed by `<id>.<theme>`.
 *   2. If the stored `promptHash` matches AND the target file exists AND we
 *      are not in `--force` mode → skip (cache hit; never re-bills the API).
 *   3. Otherwise call Gemini Imagen via REST, retry on transient errors,
 *      decode the base64 PNG, write it to `public/assets/<theme>/<id>.png`,
 *      and update the manifest.
 *   4. If `GEMINI_API_KEY` is missing, `--dry-run` is set, or every retry
 *      fails, write an SVG placeholder so the Phase 5 render never crashes
 *      for a missing asset. The manifest flags `placeholder: true` so the
 *      next run can replace it.
 *
 * CLI:
 *   --force                ignore the cache; regenerate every asset.
 *   --theme=apple|vercel   only process one theme.
 *   --dry-run              skip the API entirely; write placeholders only.
 *   --model=<id>           override the image-gen model. Default:
 *                          gemini-2.5-flash-image-preview (Gemini native
 *                          via generateContent — works on any standard
 *                          Gemini API key). Pass an `imagen-*` model name
 *                          to switch to the Imagen `:predict` endpoint.
 */

import "dotenv/config";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";

import {
  type Manifest,
  type ManifestEntry,
  type PromptVariant,
  ManifestSchema,
  PromptVariantSchema,
} from "../src/asset-prompt.schema";
import type { PlanThemeName } from "../src/video-plan.schema";

// ─── Paths ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const PROMPTS_DIR = join(ROOT, "assets", "prompts");
const ASSETS_DIR = join(ROOT, "public", "assets");
const MANIFEST_PATH = join(ASSETS_DIR, "manifest.json");

// ─── Gemini image-gen REST ─────────────────────────────────────────────────

/**
 * Default model: Gemini Nano Banana image generation. It uses the same
 * `generateContent` endpoint as Gemini text models, so any standard
 * GEMINI_API_KEY works without paid-tier Imagen access. Override with
 * `--model=imagen-3.0-generate-002` if your key has Imagen access.
 *
 * The script auto-detects which API to call by the model name prefix:
 *   `gemini-*` → `:generateContent` (image returned in inlineData parts)
 *   `imagen-*` → `:predict` (image returned in predictions[0].bytesBase64Encoded)
 */
const DEFAULT_MODEL = "gemini-2.5-flash-image-preview";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRY_DELAYS_MS = [1000, 3000, 8000]; // 3 attempts after the first

type ApiKind = "gemini" | "imagen";
const apiKindFor = (model: string): ApiKind =>
  model.toLowerCase().startsWith("imagen") ? "imagen" : "gemini";

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!existsSync(PROMPTS_DIR)) {
    fail(
      `No prompts at ${PROMPTS_DIR}. Run \`npm run assets:prompts\` first.`,
    );
  }

  const promptFiles = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith(".json"));
  if (promptFiles.length === 0) {
    fail(`No prompt files found in ${PROMPTS_DIR}.`);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const usePlaceholder = args.dryRun || !apiKey;
  if (usePlaceholder) {
    if (args.dryRun) {
      log(`--dry-run: skipping Imagen, writing SVG placeholders only`);
    } else {
      log(
        `GEMINI_API_KEY not set in .env — writing SVG placeholders only. ` +
          `Add the key and re-run \`npm run assets:gen\` to fetch real images.`,
      );
    }
  } else {
    log(`image-gen target: ${args.model} (${apiKindFor(args.model)} API)`);
  }

  mkdirSync(ASSETS_DIR, { recursive: true });
  mkdirSync(join(ASSETS_DIR, "apple"), { recursive: true });
  mkdirSync(join(ASSETS_DIR, "vercel"), { recursive: true });

  const manifest = readManifest();
  log(`manifest: ${Object.keys(manifest).length} entries before run`);

  let generated = 0;
  let cached = 0;
  let placeholders = 0;
  let failed = 0;

  for (const file of promptFiles) {
    const variant = readPrompt(join(PROMPTS_DIR, file));
    if (args.theme && variant.theme !== args.theme) continue;

    const key = `${variant.id}.${variant.theme}`;
    const existing = manifest[key];
    const targetExt = variant.transparentBackground ? "png" : "png";
    const relPath = `${variant.theme}/${variant.id}.${targetExt}`;
    const absPath = join(ASSETS_DIR, relPath);
    const placeholderPath = join(ASSETS_DIR, `${variant.theme}/${variant.id}.svg`);

    // Cache logic:
    //   - --force                    → never a hit
    //   - hash changed               → never a hit (prompt was edited)
    //   - real PNG exists            → always a hit (cheapest win)
    //   - only an SVG placeholder exists:
    //       in placeholder mode      → hit (don't re-call the API just to
    //                                  rewrite the same SVG)
    //       in real-API mode         → MISS, so we upgrade the placeholder
    //                                  to a real image now that the API
    //                                  works. This is the path that fixes
    //                                  a stale-placeholder repo after a
    //                                  user adds their key.
    const hashMatch = existing && existing.promptHash === variant.promptHash;
    const realFileExists = existsSync(absPath);
    const placeholderExists = existsSync(placeholderPath);
    const cacheHit =
      !args.force &&
      hashMatch &&
      (realFileExists || (usePlaceholder && placeholderExists));

    if (cacheHit) {
      cached += 1;
      continue;
    }

    if (usePlaceholder) {
      writePlaceholder(variant, placeholderPath);
      manifest[key] = makeEntry(variant, `${variant.theme}/${variant.id}.svg`, true);
      placeholders += 1;
      continue;
    }

    try {
      const png = await callImageGenWithRetry(variant, apiKey, args.model);
      writeFileSync(absPath, png);
      // Drop the stale SVG placeholder so the directory doesn't carry
      // both `<id>.svg` and `<id>.png` for the same asset.
      if (existsSync(placeholderPath)) {
        try { unlinkSync(placeholderPath); } catch { /* ignore */ }
      }
      manifest[key] = makeEntry(variant, relPath, false);
      generated += 1;
      log(`gen   ${key.padEnd(40)} → ${relPath}`);
    } catch (err) {
      failed += 1;
      console.error(
        `[assets:gen] failed ${key}: ${(err as Error).message}\n` +
          `             falling back to SVG placeholder so the render can still run.`,
      );
      writePlaceholder(variant, placeholderPath);
      manifest[key] = makeEntry(variant, `${variant.theme}/${variant.id}.svg`, true);
      placeholders += 1;
    }
  }

  writeManifest(manifest);

  log(
    `done · generated ${generated} · cached ${cached} · ` +
      `placeholders ${placeholders} · failed ${failed}`,
  );
  if (placeholders > 0 && !usePlaceholder) {
    log(`some calls fell back to placeholders — see errors above.`);
  }
}

// ─── Image-gen call ────────────────────────────────────────────────────────

async function callImageGenWithRetry(
  variant: PromptVariant,
  apiKey: string,
  model: string,
): Promise<Buffer> {
  let lastErr: Error | undefined;
  const attempts = 1 + RETRY_DELAYS_MS.length;
  for (let i = 0; i < attempts; i++) {
    try {
      return await callImageGen(variant, apiKey, model);
    } catch (err) {
      lastErr = err as Error;
      const isLast = i === attempts - 1;
      if (isLast) break;
      const delay = RETRY_DELAYS_MS[i];
      log(
        `retry ${variant.id}.${variant.theme} in ${delay}ms (${(err as Error).message})`,
      );
      await sleep(delay);
    }
  }
  throw lastErr ?? new Error("unknown error");
}

function callImageGen(
  variant: PromptVariant,
  apiKey: string,
  model: string,
): Promise<Buffer> {
  return apiKindFor(model) === "imagen"
    ? callImagenPredict(variant, apiKey, model)
    : callGeminiGenerateContent(variant, apiKey, model);
}

/**
 * Imagen 3/4 via Vertex-style `:predict` endpoint. Requires API access
 * to the chosen Imagen model (often paid-tier only).
 */
async function callImagenPredict(
  variant: PromptVariant,
  apiKey: string,
  model: string,
): Promise<Buffer> {
  const url = `${API_BASE}/${model}:predict`;
  const body = {
    instances: [{ prompt: variant.prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: variant.aspectRatio,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await formatApiError("Imagen", res));
  }

  const json = (await res.json()) as {
    predictions?: { mimeType?: string; bytesBase64Encoded?: string }[];
  };
  const b64 = json.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("Imagen returned no image bytes");
  return Buffer.from(b64, "base64");
}

/**
 * Gemini native image generation via `:generateContent`. The image is
 * returned as `inlineData` inside the response parts. Aspect ratio is
 * injected into the prompt because Gemini doesn't accept it as a
 * parameter — Imagen's `aspectRatio` field has no equivalent.
 */
async function callGeminiGenerateContent(
  variant: PromptVariant,
  apiKey: string,
  model: string,
): Promise<Buffer> {
  const url = `${API_BASE}/${model}:generateContent`;
  const prompt =
    `${variant.prompt} ` +
    `Output image aspect ratio: ${variant.aspectRatio}.` +
    (variant.transparentBackground
      ? " Output must have a fully transparent background."
      : "");

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await formatApiError("Gemini", res));
  }

  const json = (await res.json()) as {
    candidates?: {
      content?: {
        parts?: { inlineData?: { mimeType?: string; data?: string } }[];
      };
    }[];
  };

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const data = p.inlineData?.data;
    if (data) return Buffer.from(data, "base64");
  }
  throw new Error("Gemini returned no inlineData image bytes");
}

async function formatApiError(label: string, res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  // Squash whitespace so the retry log line stays single-line readable.
  const snippet = text.replace(/\s+/g, " ").slice(0, 240);
  return snippet
    ? `${label} ${res.status} ${res.statusText} — ${snippet}`
    : `${label} ${res.status} ${res.statusText}`;
}

// ─── SVG placeholder ───────────────────────────────────────────────────────

const THEME_COLORS = {
  apple: {
    bg: "#FBFBFD",
    fg: "#1D1D1F",
    accent: "#0071E3",
    border: "#E5E5EA",
    sub: "#86868B",
  },
  vercel: {
    bg: "#000000",
    fg: "#EDEDED",
    accent: "#FFFFFF",
    border: "#262626",
    sub: "#666666",
  },
} as const;

function writePlaceholder(variant: PromptVariant, absPath: string): void {
  const [aw, ah] = variant.aspectRatio.split(":").map(Number);
  const w = 1024;
  const h = Math.round((w * ah) / aw);
  const c = THEME_COLORS[variant.theme];
  const kindGlyph = kindGlyphPath(variant.kind, w / 2, h / 2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${c.bg}" />
  <rect x="${w * 0.02}" y="${h * 0.02}" width="${w * 0.96}" height="${h * 0.96}" rx="24" ry="24"
        fill="none" stroke="${c.border}" stroke-width="2" stroke-dasharray="8 8" />
  ${kindGlyph(c.accent)}
  <text x="${w / 2}" y="${h - 96}" font-family="ui-monospace, 'Geist Mono', 'SF Mono', monospace"
        font-size="36" font-weight="500" fill="${c.fg}" text-anchor="middle">${escapeXml(variant.id)}</text>
  <text x="${w / 2}" y="${h - 56}" font-family="ui-monospace, 'Geist Mono', 'SF Mono', monospace"
        font-size="22" fill="${c.sub}" text-anchor="middle">${variant.kind} · ${variant.theme} · placeholder</text>
</svg>
`;
  writeFileSync(absPath, svg, "utf8");
}

/** Returns a function that takes the accent color and returns an SVG fragment. */
function kindGlyphPath(
  kind: PromptVariant["kind"],
  cx: number,
  cy: number,
): (color: string) => string {
  const size = 200;
  const half = size / 2;
  switch (kind) {
    case "icon":
      // Circle inside a rounded square
      return (color) =>
        `<rect x="${cx - half}" y="${cy - half}" width="${size}" height="${size}" rx="40" ry="40" fill="none" stroke="${color}" stroke-width="6" />` +
        `<circle cx="${cx}" cy="${cy}" r="${half * 0.45}" fill="none" stroke="${color}" stroke-width="6" />`;
    case "background":
      // Wide horizontal lines
      return (color) =>
        Array.from({ length: 5 })
          .map(
            (_, i) =>
              `<rect x="${cx - 280}" y="${cy - 120 + i * 60}" width="560" height="14" rx="7" ry="7" fill="${color}" opacity="${0.15 + i * 0.05}" />`,
          )
          .join("");
    case "diagram":
      // Two boxes + arrow
      return (color) =>
        `<rect x="${cx - 220}" y="${cy - 60}" width="160" height="120" rx="20" ry="20" fill="none" stroke="${color}" stroke-width="6" />` +
        `<rect x="${cx + 60}"  y="${cy - 60}" width="160" height="120" rx="20" ry="20" fill="none" stroke="${color}" stroke-width="6" />` +
        `<line x1="${cx - 60}" y1="${cy}" x2="${cx + 60}" y2="${cy}" stroke="${color}" stroke-width="6" />` +
        `<polygon points="${cx + 60},${cy} ${cx + 40},${cy - 12} ${cx + 40},${cy + 12}" fill="${color}" />`;
    case "illustration":
    default:
      // Stacked rounded panels
      return (color) =>
        Array.from({ length: 3 })
          .map(
            (_, i) =>
              `<rect x="${cx - 180 + i * 14}" y="${cy - 120 + i * 14}" width="320" height="180" rx="24" ry="24" fill="none" stroke="${color}" stroke-width="6" opacity="${1 - i * 0.3}" />`,
          )
          .join("");
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Manifest ──────────────────────────────────────────────────────────────

function readManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
    const parsed = ManifestSchema.safeParse(raw);
    if (!parsed.success) {
      log(`manifest is malformed; starting fresh`);
      return {};
    }
    return parsed.data;
  } catch {
    log(`manifest could not be read; starting fresh`);
    return {};
  }
}

function writeManifest(m: Manifest): void {
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2) + "\n");
}

function makeEntry(
  variant: PromptVariant,
  path: string,
  placeholder: boolean,
): ManifestEntry {
  return {
    id: variant.id,
    theme: variant.theme,
    kind: variant.kind,
    promptHash: variant.promptHash,
    path,
    placeholder,
    generatedAt: new Date().toISOString(),
  };
}

function readPrompt(absPath: string): PromptVariant {
  const raw = JSON.parse(readFileSync(absPath, "utf8")) as unknown;
  const parsed = PromptVariantSchema.safeParse(raw);
  if (!parsed.success) {
    fail(
      `Prompt ${absPath} is malformed:\n${parsed.error.issues
        .map((i) => `         - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }
  return parsed.data;
}

// ─── CLI ───────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  theme?: PlanThemeName;
  force: boolean;
  dryRun: boolean;
  model: string;
} {
  let theme: PlanThemeName | undefined;
  let force = false;
  let dryRun = false;
  let model = DEFAULT_MODEL;
  for (const arg of argv) {
    if (arg === "--force") force = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--theme=")) {
      const v = arg.slice("--theme=".length);
      if (v !== "apple" && v !== "vercel") {
        fail(`Invalid theme "${v}". Use --theme=apple or --theme=vercel.`);
      }
      theme = v;
    } else if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length).trim() || DEFAULT_MODEL;
    } else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    }
  }
  return { theme, force, dryRun, model };
}

const USAGE = `
Usage: npm run assets:gen -- [options]

  --force                Ignore the cache; regenerate every asset.
  --theme=apple|vercel   Only process one theme.
  --dry-run              Skip the API; write SVG placeholders only.
  --model=<id>           Override the image-gen model (default ${DEFAULT_MODEL}).
                         Models starting with "gemini-" use :generateContent
                         (works on any standard Gemini API key).
                         Models starting with "imagen-" use :predict
                         (requires Imagen access on your key).
  --help, -h             Print this message.

GEMINI_API_KEY must be set in .env to make real API calls.
Without the key (or with --dry-run), every asset is written as an SVG
placeholder so the render never breaks. Re-run later to upgrade.
`;

function log(msg: string): void {
  console.log(`[assets:gen] ${msg}`);
}

function fail(msg: string): never {
  console.error(`[assets:gen] ERROR: ${msg}`);
  process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
