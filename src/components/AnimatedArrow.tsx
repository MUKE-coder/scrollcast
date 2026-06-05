/**
 * AnimatedArrow — SVG line that draws on from `from` → `to` via a spring
 * animating `strokeDashoffset` from total-length to 0. `delayFrames` shifts
 * the start. `active = true` renders in `accent`; otherwise `textTertiary`.
 *
 * The arrow is placed inside an `AbsoluteFill` so the SVG covers the parent.
 * The parent must establish a positioning context (a relative wrapper is
 * fine — `Sequence`/`AbsoluteFill` already do this).
 *
 * Spec (design-style-guide §4): stroke 3, arrowhead marker, accent when
 * active. Spec (§5): draw duration is `motion.arrowDrawFrames`.
 */

import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../theme/ThemeProvider";

export type Point = { x: number; y: number };

export type AnimatedArrowProps = {
  from: Point;
  to: Point;
  delayFrames?: number;
  active?: boolean;
  /** Override stroke color. */
  color?: string;
  /** Override stroke width (default 3). */
  strokeWidth?: number;
};

let arrowSeq = 0;
const nextId = () => `scrollcast-arrowhead-${++arrowSeq}`;

export const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  from,
  to,
  delayFrames = 0,
  active = false,
  color,
  strokeWidth = 3,
}) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: t.motion.sceneEntranceDamping },
    durationInFrames: t.motion.arrowDrawFrames,
  });

  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const stroke = color ?? (active ? t.color.accent : t.color.textTertiary);
  const markerId = React.useMemo(nextId, []);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
        // overflow visible so the arrowhead at the endpoint isn't clipped
        // by the SVG viewbox (the marker is drawn outside the path bbox)
        overflow="visible"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill={stroke} />
          </marker>
        </defs>
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - progress)}
          markerEnd={progress > 0.9 ? `url(#${markerId})` : undefined}
        />
      </svg>
    </AbsoluteFill>
  );
};
