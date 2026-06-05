/**
 * Icon wrapper — pass a lucide-react icon component as `icon`. The wrapper
 * consumes the active theme's `icon.strokeWidth` so Apple icons render
 * rounder (2px) and Vercel icons render hairline (1.5px), matching the
 * Geist aesthetic. Size accepts a token key ("sm" | "md" | …) or a raw px.
 * Color accepts a `Theme["color"]` key or a raw CSS color.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";
import type { Theme } from "../theme/types";

type SemanticColorKey = Exclude<keyof Theme["color"], "gray">;

export type IconSize = keyof Theme["icon"]["sizes"] | number;
export type IconColor = SemanticColorKey | (string & {});

export type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  /** Optional override of the theme's stroke width. */
  strokeWidth?: number;
};

const resolveSize = (t: Theme, size: IconSize): number =>
  typeof size === "number" ? size : t.icon.sizes[size];

const resolveColor = (t: Theme, color?: IconColor): string => {
  if (!color) return t.color.textPrimary;
  if (typeof color === "string" && color in t.color) {
    const v = (t.color as Record<string, unknown>)[color];
    if (typeof v === "string") return v;
  }
  return color;
};

export const Icon: React.FC<IconProps> = ({
  icon: IconComp,
  size = "md",
  color,
  strokeWidth,
}) => {
  const t = useTheme();
  return (
    <IconComp
      size={resolveSize(t, size)}
      color={resolveColor(t, color)}
      strokeWidth={strokeWidth ?? t.icon.strokeWidth}
    />
  );
};
