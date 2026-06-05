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
 * Default image-gen model. Picked for the typical ScrollCast workload of
 * 24–32 small assets per video — fast generation matters and quality only
 * has to clear "brand-consistent illustration" not "photorealistic hero
 * shot." The latest GA flash image-gen model is the sweet spot.
 *
 * Alternatives for a different speed/quality/cost tradeoff:
 *   --model=gemini-3-pro-image          GA Pro image (higher quality, ~3× slower)
 *   --model=imagen-4.0-fast-generate-001 GA Imagen 4 fast via :predict
 *   --model=imagen-4.0-ultra-generate-001 GA Imagen 4 ultra (slowest, highest)
 *
 * If the default 404s on your key (model availability shifts by region
 * and tier), run `npm run assets:gen -- --list-models` to see what your
 * key can actually call, then pass `--model=<id>`.
 *
 * The script auto-detects which API to call by the model name prefix:
 *   `gemini-*` → `:generateContent` (image returned in inlineData parts)
 *   `imagen-*` → `:predict` (image returned in predictions[0].bytesBase64Encoded)
 */
const DEFAULT_MODEL = "gemini-3.1-flash-image";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRY_DELAYS_MS = [1000, 3000, 8000]; // 3 attempts after the first

type ApiKind = "gemini" | "imagen";
const apiKindFor = (model: string): ApiKind =>
  model.toLowerCase().startsWith("imagen") ? "imagen" : "gemini";

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Diagnostic short-circuit: list every model the user's key can call.
  // Useful when an image model 404s and you need to pick one that exists.
  if (args.listModels) {
    const key = process.env.GEMINI_API_KEY?.trim() || "";
    if (!key) fail("GEMINI_API_KEY not set in .env — required for --list-models.");
    await listModels(key);
    return;
  }

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
    log(`tip: run 'npm run assets:gen -- --list-models' to see which models`);
    log(`     your GEMINI_API_KEY can actually call, then re-run with`);
    log(`     '--model=<id>'.`);
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
//
// When no GEMINI_API_KEY is set (or a real-API call fails), the script writes
// a theme-aware "cool 3D" SVG instead of bouncing an error to the user. The
// SVG library in `./svg-library.ts` picks an isometric icon (cube / cylinder
// / lock / shield / cloud / key / code / terminal / network / chart / gear /
// alert / doc), background pattern (grid / aurora / mesh), diagram template,
// or illustration based on keyword matching against the asset description.
// These are good enough to ship in the final video — they're flagged
// `placeholder: true` in the manifest so a later run with an API key will
// upgrade them, but you do NOT have to upgrade them. Many users will run
// without an API key forever and the result still looks like a designed
// product, not a debug stub.

import { renderSvg } from "./svg-library";

function writePlaceholder(variant: PromptVariant, absPath: string): void {
  writeFileSync(absPath, renderSvg(variant), "utf8");
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
  listModels: boolean;
} {
  let theme: PlanThemeName | undefined;
  let force = false;
  let dryRun = false;
  let model = DEFAULT_MODEL;
  let listModels = false;
  for (const arg of argv) {
    if (arg === "--force") force = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--list-models") listModels = true;
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
  return { theme, force, dryRun, model, listModels };
}

/**
 * Discovery helper: GET the v1beta/models endpoint and print every model
 * the user's key can call, along with the methods each supports. Lets the
 * user pick a working `--model=<id>` when the default 404s.
 */
async function listModels(apiKey: string): Promise<void> {
  log(`querying ${API_BASE} for available models`);
  const res = await fetch(`${API_BASE}?pageSize=200`, {
    headers: { "X-goog-api-key": apiKey },
  });
  if (!res.ok) {
    fail(`ListModels failed: ${await formatApiError("Gemini", res)}`);
  }
  const json = (await res.json()) as {
    models?: {
      name?: string;
      displayName?: string;
      supportedGenerationMethods?: string[];
    }[];
  };
  const all = json.models ?? [];

  // Sort: image-capable first, then by name.
  const score = (m: { name?: string; supportedGenerationMethods?: string[] }) => {
    const name = (m.name ?? "").toLowerCase();
    const methods = m.supportedGenerationMethods ?? [];
    const isImagen = name.includes("imagen");
    const isImageGemini = name.includes("image");
    const supportsPredict = methods.includes("predict");
    const supportsGenerate = methods.includes("generateContent");
    if (isImagen && supportsPredict) return 0;
    if (isImageGemini && supportsGenerate) return 1;
    if (supportsGenerate) return 2;
    return 3;
  };
  const sorted = all
    .slice()
    .sort((a, b) => score(a) - score(b) || (a.name ?? "").localeCompare(b.name ?? ""));

  console.log("");
  console.log(`MODEL`.padEnd(54) + "METHODS");
  console.log("-".repeat(120));
  for (const m of sorted) {
    const id = (m.name ?? "").replace(/^models\//, "");
    const methods = (m.supportedGenerationMethods ?? []).join(", ");
    console.log(id.padEnd(54) + methods);
  }
  console.log("");
  log(`${sorted.length} models. For image generation pick one whose name`);
  log(`contains 'image' AND whose methods include 'generateContent', or one`);
  log(`whose name starts with 'imagen-' AND whose methods include 'predict'.`);
  log(`Then re-run: npm run assets:gen -- --model=<id>`);
}

const USAGE = `
Usage: npm run assets:gen -- [options]

  --force                Ignore the cache; regenerate every asset.
  --theme=apple|vercel   Only process one theme.
  --dry-run              Skip the API; write SVG placeholders only.
  --model=<id>           Override the image-gen model (default ${DEFAULT_MODEL}).
                         Models starting with "gemini-" use :generateContent.
                         Models starting with "imagen-" use :predict.
  --list-models          Print every model your GEMINI_API_KEY can call
                         (with the methods each supports) and exit.
                         Use this when the default model 404s.
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
