/**
 * CodeEditorScene — the marquee Phase 5 scene. Renders the step's first
 * code block in the Phase 2 `CodeEditor` shell with a frame-driven typing
 * effect and a blinking cursor.
 *
 * Timeline within the scene (relative frames):
 *   0–18    Header (kicker + title) springs in
 *   18–42   Editor chrome fades up under the header
 *   42–end  Typing: `typedChars` increments by `CHARS_PER_FRAME` per frame
 *           until the full snippet is revealed; cursor blinks throughout
 *
 * Per design-style-guide §5 ("reveal 1 token every 1–2 frames; ~10 lines
 * in 3–5 s"), CHARS_PER_FRAME ≈ 3.5 lands a ~200-char snippet in ~2 s.
 */

import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Language } from "prism-react-renderer";
import { Scene, useElementSpring } from "./Scene";
import { SceneHeader } from "./SceneHeader";
import { CodeEditor } from "../components";
import type { Scene as PlanScene } from "../video-plan.schema";
import { useTheme } from "../theme/ThemeProvider";

const CHARS_PER_FRAME = 3.5;
const TYPING_START_FRAME = 42;

export const CodeEditorScene: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const editorS = useElementSpring(20, 22);

  const block = scene.codeBlocks?.[0];
  if (!block) {
    // Defensive fallback — Phase 3 only emits `code` scenes when at least
    // one code block is present, but a renderer should never crash.
    return (
      <Scene>
        <SceneHeader kicker={scene.kicker} title={scene.title} />
      </Scene>
    );
  }

  const typed = Math.max(
    0,
    Math.floor((frame - TYPING_START_FRAME) * CHARS_PER_FRAME),
  );
  const clampedTyped = Math.min(typed, block.code.length);
  const showCursor = frame >= TYPING_START_FRAME;

  // Hide the editor entirely until its entrance is starting.
  const editorOpacity = interpolate(editorS, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const editorRise = (1 - editorS) * 22;

  return (
    <Scene>
      <SceneHeader kicker={scene.kicker} title={scene.title} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "stretch",
          marginTop: t.space.lg,
          opacity: editorOpacity,
          transform: `translateY(${editorRise}px)`,
        }}
      >
        <CodeEditor
          filename={block.filename}
          language={block.language as Language}
          code={block.code}
          typedChars={clampedTyped}
          showCursor={showCursor}
          style={{
            width: "100%",
            maxWidth: t.layout.maxContentWidth,
            margin: "0 auto",
          }}
        />
      </div>
    </Scene>
  );
};
