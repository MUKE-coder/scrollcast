/**
 * Badge / Pill / Tag — radius.pill, caption-sized mono text. Tones map onto
 * theme palette so the same component renders correctly in both themes:
 *   default  : bgSubtle + textSecondary + border
 *   accent   : accentSoft + accent + accent border
 *   success / warning / danger : status color foreground + accentSoft bg
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";
import type { Theme } from "../theme/types";

export type PillTone = "default" | "accent" | "success" | "warning" | "danger";

export type PillProps = {
  children: React.ReactNode;
  tone?: PillTone;
  icon?: LucideIcon;
};

const toneStyle = (t: Theme, tone: PillTone) => {
  switch (tone) {
    case "accent":
      return { bg: t.color.accentSoft, fg: t.color.accent, border: t.color.accent };
    case "success":
      return { bg: t.color.accentSoft, fg: t.color.success, border: t.color.success };
    case "warning":
      return { bg: t.color.accentSoft, fg: t.color.warning, border: t.color.warning };
    case "danger":
      return { bg: t.color.accentSoft, fg: t.color.danger, border: t.color.danger };
    default:
      return { bg: t.color.bgSubtle, fg: t.color.textSecondary, border: t.color.border };
  }
};

export const Pill: React.FC<PillProps> = ({ children, tone = "default", icon: IconComp }) => {
  const t = useTheme();
  const c = toneStyle(t, tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: t.space.xs / 2,
        padding: `${t.space.xs / 2}px ${t.space.sm - 2}px`,
        borderRadius: t.radius.pill,
        backgroundColor: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        fontFamily: t.font.mono,
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.2,
      }}
    >
      {IconComp && (
        <IconComp size={14} color={c.fg} strokeWidth={t.icon.strokeWidth} />
      )}
      {children}
    </span>
  );
};
