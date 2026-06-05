import React from "react";
import { AbsoluteFill } from "remotion";

export type Theme = "apple" | "vercel";

export type MainVideoProps = {
  theme: Theme;
};

export const MainVideo: React.FC<MainVideoProps> = ({ theme }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          color: "#EDEDED",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 80,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        ScrollCast
      </div>
      <div
        style={{
          color: "#A1A1A1",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 28,
          fontWeight: 500,
        }}
      >
        Phase 0 — scaffold (theme: {theme}) — 1920x1080 @ 30fps
      </div>
    </AbsoluteFill>
  );
};
