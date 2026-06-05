/**
 * Dispatches a `Scene` object from `video-plan.json` to the right scene
 * component by `scene.type`. The map is exhaustive — adding a new scene
 * type to `SceneTypeSchema` becomes a compile error here until handled.
 */

import React from "react";
import type { Scene as PlanScene, SceneType } from "../video-plan.schema";
import { IntroScene } from "./IntroScene";
import { ConceptScene } from "./ConceptScene";
import { DiagramScene } from "./DiagramScene";
import { CodeEditorScene } from "./CodeEditorScene";
import { ComparisonScene } from "./ComparisonScene";
import { RecapScene } from "./RecapScene";
import { OutroScene } from "./OutroScene";

const COMPONENTS: Record<SceneType, React.FC<{ scene: PlanScene }>> = {
  intro: IntroScene,
  concept: ConceptScene,
  diagram: DiagramScene,
  code: CodeEditorScene,
  comparison: ComparisonScene,
  recap: RecapScene,
  outro: OutroScene,
};

export const SceneRouter: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const Comp = COMPONENTS[scene.type];
  return <Comp scene={scene} />;
};
