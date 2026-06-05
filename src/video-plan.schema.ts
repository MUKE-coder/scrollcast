/**
 * `video-plan.json` schema.
 *
 * Owned by Phase 3 (ingest pipeline writes it); consumed by Phase 4
 * (asset-prompt generation reads `scenes[].assetRefs`) and Phase 5
 * (Remotion's `MainVideo` reads scenes + durations to lay out the timeline).
 *
 * One source of truth — zod schemas exported here, TS types inferred from
 * them so the JSON, the parser, and the renderer can't drift apart.
 */

import { z } from "zod";

export const SceneTypeSchema = z.enum([
  "intro",
  "concept",
  "diagram",
  "code",
  "comparison",
  "recap",
  "outro",
]);

export const AssetKindSchema = z.enum([
  "icon",
  "background",
  "diagram",
  "illustration",
]);

export const ThemeNameSchema = z.enum(["apple", "vercel"]);

export const CodeBlockSchema = z.object({
  filename: z.string().min(1),
  language: z.string().min(1),
  code: z.string(),
});

export const AssetRefSchema = z.object({
  id: z.string().min(1),
  kind: AssetKindSchema,
  /** Plain-English description; Phase 4 turns this into a per-theme Imagen prompt. */
  description: z.string().min(1),
});

export const SceneSchema = z.object({
  id: z.string().min(1),
  type: SceneTypeSchema,
  title: z.string().min(1),
  /** Eyebrow line above the title in scenes that show one. */
  kicker: z.string().optional(),
  /** Long-form narration text — drives scene pacing and is the VO crib sheet. */
  narration: z.string(),
  /** Short bulleted talking points; capped at ~5 per scene for legibility. */
  bullets: z.array(z.string()),
  /** Only present on `code` scenes (and occasionally on `concept` with examples). */
  codeBlocks: z.array(CodeBlockSchema).optional(),
  /** Assets the Phase 4 pipeline must generate for this scene. */
  assetRefs: z.array(AssetRefSchema),
  durationInFrames: z.number().int().positive(),
});

export const VideoPlanSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    theme: ThemeNameSchema,
    totalDurationFrames: z.number().int().positive(),
    totalDurationSeconds: z.number().positive(),
    fps: z.literal(30),
    width: z.literal(1920),
    height: z.literal(1080),
    generatedAt: z.string(),
    source: z.string(),
  }),
  scenes: z.array(SceneSchema).min(1),
});

export type SceneType = z.infer<typeof SceneTypeSchema>;
export type AssetKind = z.infer<typeof AssetKindSchema>;
export type PlanThemeName = z.infer<typeof ThemeNameSchema>;
export type CodeBlock = z.infer<typeof CodeBlockSchema>;
export type AssetRef = z.infer<typeof AssetRefSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type VideoPlan = z.infer<typeof VideoPlanSchema>;
