/**
 * DiagramScene — the ByteByteGo "reveal piece by piece" pattern. Renders
 * the step's bullets as a sequence of node Cards laid out left-to-right,
 * with AnimatedArrows between them drawing on in order. Each node enters
 * with a spring, then the arrow pointing at it draws.
 *
 * When the step has too many bullets to fit in a row, the diagram wraps
 * to a second row.
 */

import React from "react";
import { ArrowRight, Box, Database, Cloud, Lock, Cpu, Server } from "lucide-react";
import { Scene, useElementSpring } from "./Scene";
import { SceneHeader } from "./SceneHeader";
import {
  AnimatedArrow,
  BodyText,
  Card,
  Icon,
} from "../components";
import { useTheme } from "../theme/ThemeProvider";
import type { Scene as PlanScene } from "../video-plan.schema";

const NODE_ICONS = [Box, Database, Cloud, Server, Cpu, Lock];

const MAX_NODES = 5; // keep the row readable
const NODE_W = 240;
const NODE_H = 180;
const NODE_SPACING = 110; // wide enough for the arrow to be visibly drawn

export const DiagramScene: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const t = useTheme();
  // Take the first N bullets as node labels; if no bullets, fall back to
  // a numbered Step 1/2/3 sequence so the layout still reads.
  let nodes = scene.bullets.slice(0, MAX_NODES).map((b) => truncate(b, 60));
  if (nodes.length < 2) {
    nodes = [
      "Input",
      truncate(scene.title, 32),
      "Output",
    ];
  }

  const totalWidth = nodes.length * NODE_W + (nodes.length - 1) * NODE_SPACING;

  return (
    <Scene>
      <SceneHeader kicker={scene.kicker} title={scene.title} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: t.space.lg,
        }}
      >
        <div
          style={{
            position: "relative",
            width: Math.min(totalWidth, 1700),
            height: NODE_H + 80,
            display: "flex",
            gap: NODE_SPACING,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {nodes.map((label, i) => (
            <React.Fragment key={i}>
              <DiagramNode
                label={label}
                icon={NODE_ICONS[i % NODE_ICONS.length]}
                delay={30 + i * 24}
              />
              {i < nodes.length - 1 && (
                <DiagramArrow
                  nodeHeight={NODE_H}
                  spacing={NODE_SPACING}
                  delay={30 + i * 24 + 18}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Scene>
  );
};

const DiagramNode: React.FC<{
  label: string;
  icon: typeof Box;
  delay: number;
}> = ({ label, icon, delay }) => {
  const t = useTheme();
  const s = useElementSpring(delay, 18);
  return (
    <div
      style={{
        opacity: s,
        transform: `scale(${0.9 + s * 0.1})`,
        flexShrink: 0,
      }}
    >
      <Card
        padding="md"
        style={{
          width: NODE_W,
          height: NODE_H,
          display: "flex",
          flexDirection: "column",
          gap: t.space.xs,
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Icon icon={icon} size="xl" color="accent" />
        <BodyText
          style={{
            fontSize: 22,
            color: t.color.textPrimary,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {label}
        </BodyText>
      </Card>
    </div>
  );
};

/**
 * AnimatedArrow placed between two adjacent nodes. The flex gap reserves
 * the slot; the SVG renders into a `position:relative` host so its
 * `AbsoluteFill` fills that gap exactly.
 */
const DiagramArrow: React.FC<{
  nodeHeight: number;
  spacing: number;
  delay: number;
}> = ({ nodeHeight, spacing, delay }) => {
  const arrowS = useElementSpring(delay, 6);
  return (
    <div
      style={{
        position: "relative",
        width: spacing,
        height: nodeHeight,
        opacity: arrowS,
        flexShrink: 0,
      }}
      aria-hidden
    >
      <AnimatedArrow
        from={{ x: 6, y: nodeHeight / 2 }}
        to={{ x: spacing - 12, y: nodeHeight / 2 }}
        delayFrames={delay}
        active
      />
    </div>
  );
};

// ─── helpers ───────────────────────────────────────────────────────────────

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

// Re-export ArrowRight so future scenes can reuse if needed.
export { ArrowRight };
