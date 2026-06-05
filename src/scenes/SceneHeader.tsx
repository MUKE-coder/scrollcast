/**
 * Shared header used by every non-intro scene — kicker fades in, title
 * follows. Returns the kicker+title block as a flex column so each scene
 * can place it at the top of its layout without re-implementing pacing.
 */

import React from "react";
import { Kicker, Title } from "../components";
import { useTheme } from "../theme/ThemeProvider";
import { useElementSpring } from "./Scene";

export const SceneHeader: React.FC<{
  kicker?: string;
  title: string;
  delay?: number;
}> = ({ kicker, title, delay = 4 }) => {
  const t = useTheme();
  const kickerS = useElementSpring(delay, 14);
  const titleS = useElementSpring(delay + 6, 22);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.xs / 2 }}>
      {kicker && (
        <div style={{ opacity: kickerS, transform: `translateY(${(1 - kickerS) * 10}px)` }}>
          <Kicker>{kicker}</Kicker>
        </div>
      )}
      <div style={{ opacity: titleS, transform: `translateY(${(1 - titleS) * 18}px)` }}>
        <Title>{title}</Title>
      </div>
    </div>
  );
};
