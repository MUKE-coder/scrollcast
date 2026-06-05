/**
 * RecapScene — numbered list of "what to remember" takeaways, revealed with
 * a quicker stagger than ConceptScene (the audience already knows the
 * material; the recap is for retention).
 */

import React from "react";
import { Scene, useElementSpring } from "./Scene";
import { SceneHeader } from "./SceneHeader";
import { BodyText } from "../components";
import { useTheme } from "../theme/ThemeProvider";
import type { Scene as PlanScene } from "../video-plan.schema";

export const RecapScene: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const t = useTheme();
  return (
    <Scene>
      <SceneHeader kicker={scene.kicker ?? "Recap"} title={scene.title} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: t.space.md,
          marginTop: t.space.lg,
          justifyContent: "center",
          maxWidth: t.layout.maxContentWidth,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {scene.bullets.map((b, i) => (
          <RecapItem key={i} index={i + 1} text={b} delay={36 + i * 12} />
        ))}
      </div>
    </Scene>
  );
};

const RecapItem: React.FC<{ index: number; text: string; delay: number }> = ({
  index,
  text,
  delay,
}) => {
  const t = useTheme();
  const s = useElementSpring(delay, 18);
  return (
    <div
      style={{
        display: "flex",
        gap: t.space.md,
        alignItems: "flex-start",
        opacity: s,
        transform: `translateY(${(1 - s) * 18}px)`,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: t.radius.pill,
          border: `1px solid ${t.color.accent}`,
          color: t.color.accent,
          fontFamily: t.font.mono,
          fontSize: 26,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.color.accentSoft,
        }}
      >
        {index}
      </span>
      <BodyText style={{ fontSize: 30, color: t.color.textPrimary, paddingTop: 6 }}>
        {text}
      </BodyText>
    </div>
  );
};
