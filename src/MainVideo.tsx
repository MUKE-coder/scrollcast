/**
 * Top-level composition. Reads the pre-generated `video-plan.json`,
 * validates it against the zod schema at module load, and lays every
 * scene onto the timeline via `<Series>` with its `durationInFrames`.
 *
 * Theme switching happens at the prop layer — `<ThemeProvider>` wraps the
 * whole `<Series>` so every nested scene reads tokens via `useTheme()`.
 * The composition's total duration is set by `calculateMetadata` in
 * `Root.tsx`, which pulls `plan.meta.totalDurationFrames` directly.
 */

import React from "react";
import { Series } from "remotion";

import { ThemeProvider } from "./theme/ThemeProvider";
import type { ThemeName } from "./theme/types";
import { SceneRouter } from "./scenes";
import { VideoPlanSchema, type VideoPlan } from "./video-plan.schema";
import planJson from "./video-plan.json";

// Validate the bundled plan once at module load — fail fast and clear if
// the schema and the JSON have drifted.
const PLAN: VideoPlan = VideoPlanSchema.parse(planJson);

export type MainVideoProps = {
  theme: ThemeName;
};

export const MainVideo: React.FC<MainVideoProps> = ({ theme }) => {
  return (
    <ThemeProvider name={theme}>
      <Series>
        {PLAN.scenes.map((scene) => (
          <Series.Sequence
            key={scene.id}
            durationInFrames={scene.durationInFrames}
            layout="none"
          >
            <SceneRouter scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    </ThemeProvider>
  );
};

export const VIDEO_PLAN = PLAN;
