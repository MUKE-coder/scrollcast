/**
 * Common scene shell — theme background, title-safe padding, and a soft
 * spring entrance fade. Every scene component composes its content inside
 * this wrapper so timing and chrome stay consistent across the timeline.
 *
 * Per Remotion best-practices: animation is driven by useCurrentFrame() +
 * spring/interpolate; no CSS transitions or Tailwind animation classes.
 */

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../theme/ThemeProvider";

export type SceneProps = {
  children: React.ReactNode;
  /** Skip the entrance animation (used by IntroScene which animates internally). */
  noEntrance?: boolean;
  /** Override the padding token (defaults to title-safe inset). */
  padX?: number;
  padY?: number;
  style?: React.CSSProperties;
};

export const Scene: React.FC<SceneProps> = ({
  children,
  noEntrance = false,
  padX,
  padY,
  style,
}) => {
  const t = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Soft entrance — quick fade-in over ~15 frames + tiny rise.
  const entrance = noEntrance
    ? 1
    : spring({
        frame,
        fps,
        config: { damping: t.motion.sceneEntranceDamping },
        durationInFrames: 18,
      });

  const opacity = noEntrance ? 1 : interpolate(entrance, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const translateY = noEntrance ? 0 : (1 - entrance) * 24;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.color.bg,
        fontFamily: t.font.sans,
        padding: `${padY ?? t.layout.titleSafeY}px ${padX ?? t.layout.titleSafeX}px`,
        display: "flex",
        flexDirection: "column",
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ─── Shared animation helpers ──────────────────────────────────────────────

/** Spring progress for an element appearing at `delayFrames`. */
export const useElementSpring = (delayFrames: number, durationInFrames = 18): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  return spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: t.motion.sceneEntranceDamping },
    durationInFrames,
  });
};
