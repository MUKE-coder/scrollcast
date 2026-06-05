/**
 * Shared theme contract. Both `apple` and `vercel` themes implement this exact
 * shape so `useTheme()` returns an identical interface — components never branch
 * on theme.name; they read tokens.
 *
 * Source of truth for values: design-style-guide.md
 */

export type ThemeName = "apple" | "vercel";

export type TypeToken = {
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing?: string;
  textTransform?: "uppercase" | "none";
};

export type Theme = {
  name: ThemeName;
  mode: "light" | "dark";

  color: {
    bg: string;
    bgElevated: string;
    bgSubtle: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    accent: string;
    accentSoft: string;
    success: string;
    warning: string;
    danger: string;
    codeBg: string;
    codeText: string;
    /** 10-step gray scale, low → high contrast against `bg`. */
    gray: {
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      1000: string;
    };
  };

  font: {
    sans: string;
    mono: string;
  };

  /** Type ramp — sizes in px at 1080p. Use the active theme's font. */
  type: {
    display: TypeToken;
    h1: TypeToken;
    h2: TypeToken;
    h3: TypeToken;
    body: TypeToken;
    caption: TypeToken;
    code: TypeToken;
    kicker: TypeToken;
  };

  /** 8px-grid spacing tokens. */
  space: {
    xs: 8;
    sm: 16;
    md: 24;
    lg: 40;
    xl: 64;
    "2xl": 96;
  };

  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };

  shadow: {
    card: string;
    pop: string;
  };

  /** Motion tokens in frames (at 30 fps). */
  motion: {
    /** Spring damping for scene entrance. Apple = soft; Vercel = snappier. */
    sceneEntranceDamping: number;
    /** Frames between staggered elements within a scene. */
    elementStaggerFrames: number;
    /** Frames for inter-scene transition (cross-fade / slide+fade). */
    sceneTransitionFrames: number;
    /** Frames for AnimatedArrow stroke draw. */
    arrowDrawFrames: number;
    /** Easing name. Used to resolve a `remotion` Easing function. */
    easing: "easeOutCubic" | "easeInOutCubic";
  };

  layout: {
    /** Title-safe inset in px from each edge. */
    titleSafeX: 96;
    titleSafeY: 54;
    /** Max content column width for text scenes (px). */
    maxContentWidth: 1400;
    /** Spacing grid base (px). */
    grid: 8;
  };

  /**
   * Icon tokens. Both themes use a single line-icon set (lucide) for naming
   * consistency; the visual difference between themes comes from `strokeWidth`
   * (Apple = 2 rounded; Vercel = 1.5 hairline, closer to Geist).
   */
  icon: {
    strokeWidth: number;
    sizes: {
      sm: 16;
      md: 24;
      lg: 32;
      xl: 48;
      "2xl": 64;
    };
  };

  /** CodeEditor tokens. */
  code: {
    /** Which prism-react-renderer theme to apply. */
    prismTheme: "vsDark" | "nightOwl" | "vsLight" | "github";
    /** Window-chrome traffic-light style. */
    chromeDotStyle: "color" | "monochrome";
  };
};
