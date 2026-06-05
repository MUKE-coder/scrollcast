/**
 * Vercel/Geist theme — dark, hairline borders, monochrome with electric-blue.
 * Values follow `design-style-guide.md` and the `create-remotion-geist` skill's
 * dark-mode 10-step gray scale.
 */

import type { Theme } from "./types";

export const vercel: Theme = {
  name: "vercel",
  mode: "dark",

  color: {
    bg: "#000000",
    bgElevated: "#0A0A0A",
    bgSubtle: "#111111",
    textPrimary: "#EDEDED",
    textSecondary: "#A1A1A1",
    textTertiary: "#666666",
    border: "#262626",
    accent: "#FFFFFF",
    accentSoft: "#171717",
    success: "#0070F3",
    warning: "#F5A623",
    danger: "#E5484D",
    codeBg: "#0A0A0A",
    codeText: "#EDEDED",
    gray: {
      100: "#0A0A0A",
      200: "#111111",
      300: "#1A1A1A",
      400: "#262626",
      500: "#383838",
      600: "#5C5C5C",
      700: "#666666",
      800: "#878787",
      900: "#A1A1A1",
      1000: "#EDEDED",
    },
  },

  font: {
    sans: "'Geist','Geist Sans',system-ui,sans-serif",
    mono: "'Geist Mono',ui-monospace,monospace",
  },

  type: {
    display: { size: 120, weight: 700, lineHeight: 1.05, letterSpacing: "-0.03em" },
    h1: { size: 72, weight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" },
    h2: { size: 52, weight: 600, lineHeight: 1.15, letterSpacing: "-0.015em" },
    h3: { size: 40, weight: 600, lineHeight: 1.2, letterSpacing: "-0.01em" },
    body: { size: 32, weight: 400, lineHeight: 1.4 },
    caption: { size: 24, weight: 500, lineHeight: 1.3 },
    code: { size: 28, weight: 400, lineHeight: 1.5 },
    kicker: {
      size: 22,
      weight: 600,
      lineHeight: 1.2,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },

  space: { xs: 8, sm: 16, md: 24, lg: 40, xl: 64, "2xl": 96 },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 },

  shadow: {
    card: "0 0 0 1px #262626",
    pop: "0 8px 32px rgba(0,0,0,0.6)",
  },

  motion: {
    sceneEntranceDamping: 30,
    elementStaggerFrames: 3,
    sceneTransitionFrames: 12,
    arrowDrawFrames: 14,
    easing: "easeInOutCubic",
  },

  layout: {
    titleSafeX: 96,
    titleSafeY: 54,
    maxContentWidth: 1400,
    grid: 8,
  },

  icon: {
    strokeWidth: 1.5, // hairline, Geist-style
    sizes: { sm: 16, md: 24, lg: 32, xl: 48, "2xl": 64 },
  },

  code: {
    prismTheme: "nightOwl", // muted Geist-leaning palette
    chromeDotStyle: "monochrome",
  },
};
