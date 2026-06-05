/**
 * Surface primitive — bgElevated + radius.lg + theme shadow (soft drop on
 * Apple, hairline 0 0 0 1px on Vercel) + 1px border. Inner padding defaults
 * to `space.md`; pass `padding` as a space-token key or a number.
 */

import React from "react";
import { useTheme } from "../theme/ThemeProvider";
import type { Theme } from "../theme/types";

export type CardProps = {
  children: React.ReactNode;
  padding?: keyof Theme["space"] | number;
  style?: React.CSSProperties;
};

export const Card: React.FC<CardProps> = ({ children, padding = "md", style }) => {
  const t = useTheme();
  const p = typeof padding === "number" ? padding : t.space[padding];
  return (
    <div
      style={{
        backgroundColor: t.color.bgElevated,
        borderRadius: t.radius.lg,
        border: `1px solid ${t.color.border}`,
        boxShadow: t.shadow.card,
        padding: p,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
