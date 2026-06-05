/**
 * OutroScene — centered closing card. "Thanks for watching" + a small
 * ScrollCast mark below. Soft spring entrance, no exit fade (the
 * composition just ends).
 */

import React from "react";
import { Scene, useElementSpring } from "./Scene";
import { Display, Kicker } from "../components";
import { useTheme } from "../theme/ThemeProvider";
import type { Scene as PlanScene } from "../video-plan.schema";

export const OutroScene: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const t = useTheme();
  const titleS = useElementSpring(4, 22);
  const subS = useElementSpring(22, 18);
  return (
    <Scene noEntrance>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: t.space.lg,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: titleS,
            transform: `translateY(${(1 - titleS) * 18}px) scale(${0.94 + titleS * 0.06})`,
          }}
        >
          <Display style={{ fontSize: 96 }}>{scene.title}</Display>
        </div>
        <div style={{ opacity: subS }}>
          <Kicker>Built with ScrollCast · Remotion</Kicker>
        </div>
      </div>
    </Scene>
  );
};
