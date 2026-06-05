/**
 * Phase 4 schemas — the shape of files written by `make-asset-prompts.ts`
 * and the cache manifest written by `generate-assets.ts`.
 *
 * Per asset, two prompt variants exist (one per theme) so the Vercel render
 * and the Apple render of the same `video-plan.json` pick up theme-correct
 * imagery from the same `id`.
 */

import { z } from "zod";

import { AssetKindSchema, ThemeNameSchema } from "./video-plan.schema";

export const AspectRatioSchema = z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const PromptVariantSchema = z.object({
  id: z.string().min(1),
  kind: AssetKindSchema,
  theme: ThemeNameSchema,
  description: z.string().min(1),
  prompt: z.string().min(1),
  aspectRatio: AspectRatioSchema,
  transparentBackground: z.boolean(),
  /** sha256 of the final `prompt` string — drives the cache. */
  promptHash: z.string().min(8),
  /** Free-text label kept for human readers of the prompts/ folder. */
  notes: z.string().optional(),
});
export type PromptVariant = z.infer<typeof PromptVariantSchema>;

export const ManifestEntrySchema = z.object({
  id: z.string().min(1),
  theme: ThemeNameSchema,
  kind: AssetKindSchema,
  promptHash: z.string().min(8),
  /** Relative to `public/assets/`. e.g. "vercel/intro-bg.png" or ".svg" for placeholders. */
  path: z.string().min(1),
  placeholder: z.boolean(),
  generatedAt: z.string(),
});
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

export const ManifestSchema = z.record(z.string(), ManifestEntrySchema);
export type Manifest = z.infer<typeof ManifestSchema>;
