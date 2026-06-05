/**
 * Top-level composition. Reads the pre-generated `video-plan.json`,
 * validates it against the zod schema at module load, and lays every
 * scene onto a `TransitionSeries` timeline with a per-theme cross-fade
 * between scenes (Apple 15f / Vercel 12f per design-style-guide §5).
 *
 * Each scene's `durationInFrames` from the plan is extended by
 * `TRANSITION_FRAMES` so the overlap with neighbors doesn't shorten the
 * planned total. The math:
 *   plannedSum + N*T - (N-1)*T  =  plannedSum + T
 * keeps the composition within ~0.5 s of the original plan duration.
 *
 * Background music is a slot — set `BACKGROUND_MUSIC_TRACK` and drop a
 * file at `public/audio/<that-name>`. VO is *not* generated; the user
 * adds their own track in post.
 */

import React from "react";
import { Audio, interpolate, staticFile } from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { ThemeProvider, getTheme } from "./theme/ThemeProvider";
import type { ThemeName } from "./theme/types";
import { SceneRouter } from "./scenes";
import {
  VideoPlanSchema,
  type Scene as PlanScene,
  type VideoPlan,
} from "./video-plan.schema";
import planJson from "./video-plan.json";

// Validate the bundled plan once at module load.
const PLAN: VideoPlan = VideoPlanSchema.parse(planJson);

/**
 * Background music slot. To enable, drop an mp3/m4a in `public/audio/`
 * and set this to the file name (e.g. `"audio/ambient-loop.mp3"`).
 * Leave `null` for silence. Volume is ducked to 0.12 by default and
 * fades in/out so it never clips the intro/outro.
 *
 * Voiceover: NOT auto-generated. Record your own VO and either layer it
 * in a DAW or add a second `<Audio>` element here pointed at the file.
 */
const BACKGROUND_MUSIC_TRACK: string | null = null;
const MUSIC_VOLUME = 0.12;

export type MainVideoProps = {
  theme: ThemeName;
};

// ─── Duration accounting ───────────────────────────────────────────────────

/** Theme-aware transition duration (frames). Vercel is snappier per spec. */
const transitionFramesFor = (theme: ThemeName): number =>
  getTheme(theme).motion.sceneTransitionFrames;

/** Composition duration = plannedSum + TRANSITION_FRAMES (see module docstring). */
export const compositionFramesFor = (theme: ThemeName): number => {
  return PLAN.meta.totalDurationFrames + transitionFramesFor(theme);
};

// ─── Component ─────────────────────────────────────────────────────────────

export const MainVideo: React.FC<MainVideoProps> = ({ theme }) => {
  const transitionFrames = transitionFramesFor(theme);
  const totalFrames = compositionFramesFor(theme);

  return (
    <ThemeProvider name={theme}>
      {BACKGROUND_MUSIC_TRACK && (
        <Audio
          src={staticFile(BACKGROUND_MUSIC_TRACK)}
          volume={(f) =>
            interpolate(
              f,
              [0, 45, totalFrames - 60, totalFrames],
              [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      )}
      <TransitionSeries>
        {PLAN.scenes.map((scene, i) => (
          <React.Fragment key={scene.id}>
            <TransitionSeries.Sequence
              durationInFrames={sceneDuration(scene, i, transitionFrames)}
              layout="none"
            >
              <SceneRouter scene={scene} />
            </TransitionSeries.Sequence>
            {i < PLAN.scenes.length - 1 && (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({ durationInFrames: transitionFrames })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </ThemeProvider>
  );
};

/**
 * Each scene gets +transitionFrames added to its planned duration so the
 * cross-fade overlap doesn't eat into content time. Applied uniformly
 * (including the last scene) so the timeline math is symmetric:
 *
 *   sumAdjusted = plannedSum + N*T
 *   composition = sumAdjusted - (N-1)*T  =  plannedSum + T
 *
 * Spring entrance happens in the scene's first frames; those overlap
 * with the fade-in from the previous scene, which is fine because both
 * are near zero opacity at the same time.
 */
function sceneDuration(scene: PlanScene, _idx: number, transitionFrames: number): number {
  return scene.durationInFrames + transitionFrames;
}

export const VIDEO_PLAN = PLAN;

// Re-export springTiming for potential consumers (e.g. RecorderUI). Currently unused
// but kept available so per-scene transitions can opt into springs later.
export { springTiming };
