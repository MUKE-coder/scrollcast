/**
 * Typography primitives bound to the active theme's type ramp.
 * Defaults:
 *   - Display / Title / H2 / H3 / BodyText : color.textPrimary
 *   - Caption : color.textSecondary
 *   - Kicker  : color.textTertiary (uppercase eyebrow)
 *   - Code    : color.codeText, theme.font.mono
 * Pass `style` to override one-off; the default color/size never leaks into
 * a hard-coded hex anywhere downstream.
 */

import React from "react";
import { useTheme } from "../theme/ThemeProvider";
import type { Theme, TypeToken } from "../theme/types";

type TypoProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const makeTypo = (
  pick: (t: Theme) => TypeToken,
  defaultColor: (t: Theme) => string,
  mono = false,
): React.FC<TypoProps> => {
  const Comp: React.FC<TypoProps> = ({ children, style }) => {
    const t = useTheme();
    const token = pick(t);
    return (
      <span
        style={{
          display: "block",
          color: defaultColor(t),
          fontFamily: mono ? t.font.mono : t.font.sans,
          fontSize: token.size,
          fontWeight: token.weight,
          lineHeight: token.lineHeight,
          letterSpacing: token.letterSpacing,
          textTransform: token.textTransform,
          margin: 0,
          ...style,
        }}
      >
        {children}
      </span>
    );
  };
  return Comp;
};

export const Display = makeTypo((t) => t.type.display, (t) => t.color.textPrimary);
export const Title = makeTypo((t) => t.type.h1, (t) => t.color.textPrimary);
export const H2 = makeTypo((t) => t.type.h2, (t) => t.color.textPrimary);
export const H3 = makeTypo((t) => t.type.h3, (t) => t.color.textPrimary);
export const BodyText = makeTypo((t) => t.type.body, (t) => t.color.textPrimary);
export const Caption = makeTypo((t) => t.type.caption, (t) => t.color.textSecondary);
export const Kicker = makeTypo((t) => t.type.kicker, (t) => t.color.textTertiary);
export const Code = makeTypo((t) => t.type.code, (t) => t.color.codeText, true);
