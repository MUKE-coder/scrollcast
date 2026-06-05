/**
 * ComparisonScene — side-by-side / before-after layout. Bullets are split
 * down the middle (first half left, second half right) and revealed with
 * a left→right stagger so the eye reads the contrast naturally.
 */

import React from "react";
import { Scene, useElementSpring } from "./Scene";
import { SceneHeader } from "./SceneHeader";
import { BodyText, Card, Kicker } from "../components";
import { useTheme } from "../theme/ThemeProvider";
import type { Scene as PlanScene } from "../video-plan.schema";

export const ComparisonScene: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const t = useTheme();
  const half = Math.ceil(scene.bullets.length / 2);
  const left = scene.bullets.slice(0, half);
  const right = scene.bullets.slice(half);

  return (
    <Scene>
      <SceneHeader kicker={scene.kicker} title={scene.title} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          gap: t.space.lg,
          marginTop: t.space.lg,
        }}
      >
        <ComparisonColumn side="A" items={left} delayBase={30} />
        <ComparisonColumn side="B" items={right} delayBase={42} />
      </div>
    </Scene>
  );
};

const ComparisonColumn: React.FC<{
  side: "A" | "B";
  items: string[];
  delayBase: number;
}> = ({ side, items, delayBase }) => {
  const t = useTheme();
  const headerS = useElementSpring(delayBase - 12, 18);
  return (
    <Card
      padding="md"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: t.space.sm,
        minHeight: 0,
      }}
    >
      <div style={{ opacity: headerS, transform: `translateY(${(1 - headerS) * 10}px)` }}>
        <Kicker>{side === "A" ? "Side A" : "Side B"}</Kicker>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: t.space.sm,
          overflow: "hidden",
        }}
      >
        {items.map((it, i) => (
          <ComparisonItem key={i} text={it} delay={delayBase + i * 14} />
        ))}
      </div>
    </Card>
  );
};

const ComparisonItem: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const t = useTheme();
  const s = useElementSpring(delay, 16);
  return (
    <div
      style={{
        display: "flex",
        gap: t.space.sm,
        alignItems: "flex-start",
        opacity: s,
        transform: `translateX(${(1 - s) * -16}px)`,
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 10,
          height: 10,
          borderRadius: 999,
          marginTop: 14,
          backgroundColor: t.color.accent,
        }}
      />
      <BodyText style={{ fontSize: 24, color: t.color.textPrimary, lineHeight: 1.4 }}>
        {text}
      </BodyText>
    </div>
  );
};
