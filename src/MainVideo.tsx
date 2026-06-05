/**
 * Top-level composition for the rendered video. Wraps content in `ThemeProvider`
 * so every nested scene/component reads tokens via `useTheme()`. Real scenes
 * land in Phase 5; for now this is a theme-aware placeholder card that proves
 * the prop wiring switches the entire frame between themes.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { ThemeProvider, useTheme } from "./theme/ThemeProvider";
import type { ThemeName } from "./theme/types";

export type MainVideoProps = {
  theme: ThemeName;
};

export const MainVideo: React.FC<MainVideoProps> = ({ theme }) => {
  return (
    <ThemeProvider name={theme}>
      <MainVideoContent />
    </ThemeProvider>
  );
};

const MainVideoContent: React.FC = () => {
  const t = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.color.bg,
        fontFamily: t.font.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: t.space.sm,
      }}
    >
      <div
        style={{
          color: t.color.textTertiary,
          fontSize: t.type.kicker.size,
          fontWeight: t.type.kicker.weight,
          letterSpacing: t.type.kicker.letterSpacing,
          textTransform: t.type.kicker.textTransform,
          lineHeight: t.type.kicker.lineHeight,
        }}
      >
        Phase 1 — Theme System
      </div>
      <div
        style={{
          color: t.color.textPrimary,
          fontSize: t.type.display.size,
          fontWeight: t.type.display.weight,
          letterSpacing: t.type.display.letterSpacing,
          lineHeight: t.type.display.lineHeight,
        }}
      >
        ScrollCast
      </div>
      <div
        style={{
          color: t.color.textSecondary,
          fontSize: t.type.body.size,
          fontWeight: t.type.body.weight,
          lineHeight: t.type.body.lineHeight,
        }}
      >
        theme: {t.name} — mode: {t.mode}
      </div>
    </AbsoluteFill>
  );
};
