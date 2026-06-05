/**
 * IntroScene — display title + kicker + a single TL;DR tagline. Big spring
 * entrance for the title; kicker arrives first.
 */

import React from "react";
import { Scene, useElementSpring } from "./Scene";
import { Display, Kicker, BodyText } from "../components";
import { useTheme } from "../theme/ThemeProvider";
import type { Scene as PlanScene } from "../video-plan.schema";

export const IntroScene: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const t = useTheme();
  const kickerS = useElementSpring(6, 14);
  const titleS = useElementSpring(14, 26);
  const subS = useElementSpring(36, 18);

  const tagline = scene.bullets[0] ?? "";

  return (
    <Scene noEntrance>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: t.space.lg,
          textAlign: "center",
          maxWidth: t.layout.maxContentWidth,
          margin: "0 auto",
        }}
      >
        <div style={{ opacity: kickerS, transform: `translateY(${(1 - kickerS) * 12}px)` }}>
          <Kicker>{scene.kicker ?? "ScrollCast"}</Kicker>
        </div>
        <div style={{ opacity: titleS, transform: `translateY(${(1 - titleS) * 28}px) scale(${0.96 + titleS * 0.04})` }}>
          <Display>{scene.title}</Display>
        </div>
        {tagline && (
          <div
            style={{
              opacity: subS,
              transform: `translateY(${(1 - subS) * 12}px)`,
              maxWidth: 1100,
            }}
          >
            <BodyText style={{ color: t.color.textSecondary, fontSize: 28 }}>{tagline}</BodyText>
          </div>
        )}
      </div>
    </Scene>
  );
};
