/**
 * Apple theme — light, clean, soft shadows, blue accent, rounded.
 * Values match `design-style-guide.md`.
 */

import type { Theme } from "./types";

export const apple: Theme = {
  name: "apple",
  mode: "light",

  color: {
    bg: "#FBFBFD",
    bgElevated: "#FFFFFF",
    bgSubtle: "#F5F5F7",
    textPrimary: "#1D1D1F",
    textSecondary: "#6E6E73",
    textTertiary: "#86868B",
    border: "#E5E5EA",
    accent: "#0071E3",
    accentSoft: "#E8F1FD",
    success: "#34C759",
    warning: "#FF9F0A",
    danger: "#FF3B30",
    codeBg: "#1D1D1F",
    codeText: "#F5F5F7",
    gray: {
      100: "#FBFBFD",
      200: "#F5F5F7",
      300: "#E5E5EA",
      400: "#D2D2D7",
      500: "#C7C7CC",
      600: "#AEAEB2",
      700: "#86868B",
      800: "#6E6E73",
      900: "#424245",
      1000: "#1D1D1F",
    },
  },

  font: {
    sans: "'SF Pro Display','Inter',system-ui,sans-serif",
    mono: "'SF Mono','JetBrains Mono',ui-monospace,monospace",
  },

  type: {
    display: { size: 120, weight: 700, lineHeight: 1.05 },
    h1: { size: 72, weight: 700, lineHeight: 1.1 },
    h2: { size: 52, weight: 600, lineHeight: 1.15 },
    h3: { size: 40, weight: 600, lineHeight: 1.2 },
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
  radius: { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 },

  shadow: {
    card: "0 4px 24px rgba(0,0,0,0.06)",
    pop: "0 12px 48px rgba(0,0,0,0.10)",
  },

  motion: {
    sceneEntranceDamping: 200,
    elementStaggerFrames: 5,
    sceneTransitionFrames: 15,
    arrowDrawFrames: 18,
    easing: "easeOutCubic",
  },

  layout: {
    titleSafeX: 96,
    titleSafeY: 54,
    maxContentWidth: 1400,
    grid: 8,
  },
};
