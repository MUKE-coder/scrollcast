/**
 * /dev composition — renders one sample of every theme token (color swatches,
 * type ramp, radii/shadow card, badge/pill row) so flipping the `theme` prop
 * is an immediate visual diff. Used to satisfy the Phase 1 exit criterion that
 * the two themes re-skin everything with zero hard-coded values in components.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import type { Theme, ThemeName, TypeToken } from "../theme/types";

export type ThemeGalleryProps = {
  theme: ThemeName;
};

export const ThemeGallery: React.FC<ThemeGalleryProps> = ({ theme }) => {
  return (
    <ThemeProvider name={theme}>
      <GalleryContent />
    </ThemeProvider>
  );
};

const GalleryContent: React.FC = () => {
  const t = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.color.bg,
        color: t.color.textPrimary,
        fontFamily: t.font.sans,
        // Gallery uses tighter padding than the video's title-safe area so all
        // tokens fit in one frame. Real scenes still respect `layout.titleSafe*`.
        padding: `${t.space.lg}px ${t.space.xl}px`,
        display: "flex",
        flexDirection: "column",
        gap: t.space.md,
      }}
    >
      <Header />
      <ColorSwatches />
      <div style={{ display: "flex", gap: t.space.lg, flex: 1, minHeight: 0 }}>
        <TypeRamp />
        <ComponentSamples />
      </div>
      <Footer />
    </AbsoluteFill>
  );
};

// ─── Header ────────────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const t = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.xs }}>
      <span style={typeStyle(t.type.kicker, t.color.textTertiary)}>
        Theme gallery · {t.name} · {t.mode}
      </span>
      <span style={typeStyle(t.type.h1, t.color.textPrimary)}>
        ScrollCast design tokens
      </span>
    </div>
  );
};

// ─── Color swatches ────────────────────────────────────────────────────────

const swatchTokens = (
  t: Theme,
): { label: string; value: string }[] => [
  { label: "bg", value: t.color.bg },
  { label: "bgElevated", value: t.color.bgElevated },
  { label: "bgSubtle", value: t.color.bgSubtle },
  { label: "border", value: t.color.border },
  { label: "textPrimary", value: t.color.textPrimary },
  { label: "textSecondary", value: t.color.textSecondary },
  { label: "textTertiary", value: t.color.textTertiary },
  { label: "accent", value: t.color.accent },
  { label: "accentSoft", value: t.color.accentSoft },
  { label: "success", value: t.color.success },
  { label: "warning", value: t.color.warning },
  { label: "danger", value: t.color.danger },
];

const grayTokens = (t: Theme) =>
  (Object.entries(t.color.gray) as [string, string][]).map(([k, v]) => ({
    label: `gray.${k}`,
    value: v,
  }));

const ColorSwatches: React.FC = () => {
  const t = useTheme();
  const semantic = swatchTokens(t);
  const grays = grayTokens(t);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.xs }}>
      <SectionLabel>Color · semantic</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: t.space.xs }}>
        {semantic.map((s) => (
          <SwatchTile key={s.label} label={s.label} value={s.value} compact />
        ))}
      </div>
      <SectionLabel>Color · gray scale (10-step)</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: t.space.xs }}>
        {grays.map((s) => (
          <SwatchTile key={s.label} label={s.label} value={s.value} compact />
        ))}
      </div>
    </div>
  );
};

const SwatchTile: React.FC<{ label: string; value: string; compact?: boolean }> = ({
  label,
  value,
  compact,
}) => {
  const t = useTheme();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: t.space.xs / 2,
        padding: t.space.xs,
        borderRadius: t.radius.sm,
        backgroundColor: t.color.bgElevated,
        border: `1px solid ${t.color.border}`,
      }}
    >
      <div
        style={{
          height: compact ? 36 : 56,
          borderRadius: t.radius.sm,
          backgroundColor: value,
          border: `1px solid ${t.color.border}`,
        }}
      />
      <span
        style={{
          fontSize: compact ? 14 : 16,
          fontWeight: 500,
          fontFamily: t.font.mono,
          color: t.color.textPrimary,
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: compact ? 12 : 14,
          fontFamily: t.font.mono,
          color: t.color.textTertiary,
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
    </div>
  );
};

// ─── Type ramp ─────────────────────────────────────────────────────────────

/**
 * Type ramp samples are scaled by RAMP_SCALE so all 8 tokens fit in the gallery
 * frame. The label column shows the real `size/weight` so QA can still verify
 * intended values — and proportions between tokens stay correct.
 */
const RAMP_SCALE = 0.55;

const TypeRamp: React.FC = () => {
  const t = useTheme();
  const rows: { name: string; token: TypeToken; sample: string; mono?: boolean }[] = [
    { name: "display", token: t.type.display, sample: "Aa Bb Cc" },
    { name: "h1", token: t.type.h1, sample: "Section title" },
    { name: "h2", token: t.type.h2, sample: "Sub-section header" },
    { name: "h3", token: t.type.h3, sample: "Card heading" },
    { name: "body", token: t.type.body, sample: "The quick brown fox jumps over the lazy dog." },
    { name: "caption", token: t.type.caption, sample: "Caption · Tag · Label" },
    { name: "code", token: t.type.code, sample: "const t = useTheme();", mono: true },
    { name: "kicker", token: t.type.kicker, sample: "Eyebrow label" },
  ];
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: t.space.xs,
        minWidth: 0,
      }}
    >
      <SectionLabel>Typography ramp</SectionLabel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: t.space.xs,
          padding: t.space.sm,
          backgroundColor: t.color.bgElevated,
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.md,
          overflow: "hidden",
          flex: 1,
          minHeight: 0,
        }}
      >
        {rows.map(({ name, token, sample, mono }) => (
          <div
            key={name}
            style={{ display: "flex", alignItems: "baseline", gap: t.space.sm }}
          >
            <span
              style={{
                width: 80,
                fontSize: 14,
                fontFamily: t.font.mono,
                color: t.color.textTertiary,
                flexShrink: 0,
              }}
            >
              {name}
            </span>
            <span
              style={{
                color: t.color.textPrimary,
                fontSize: token.size * RAMP_SCALE,
                fontWeight: token.weight,
                lineHeight: token.lineHeight,
                letterSpacing: token.letterSpacing,
                textTransform: token.textTransform,
                fontFamily: mono ? t.font.mono : t.font.sans,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                flex: 1,
              }}
            >
              {sample}
            </span>
            <span
              style={{
                fontSize: 13,
                fontFamily: t.font.mono,
                color: t.color.textTertiary,
                flexShrink: 0,
              }}
            >
              {token.size}/{token.weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Component samples (card + badges + buttons) ───────────────────────────

const ComponentSamples: React.FC = () => {
  const t = useTheme();
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: t.space.xs,
        minWidth: 0,
      }}
    >
      <SectionLabel>Components</SectionLabel>

      {/* Card — demonstrates bgElevated + radius.lg + shadow.card + border */}
      <div
        style={{
          padding: t.space.md,
          backgroundColor: t.color.bgElevated,
          borderRadius: t.radius.lg,
          border: `1px solid ${t.color.border}`,
          boxShadow: t.shadow.card,
          display: "flex",
          flexDirection: "column",
          gap: t.space.sm,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: t.space.sm }}>
          <Pill>radius.lg</Pill>
          <Pill>shadow.card</Pill>
          <Pill tone="accent">accent</Pill>
        </div>
        <span style={typeStyle(t.type.h3, t.color.textPrimary)}>Card surface</span>
        <span style={typeStyle(t.type.body, t.color.textSecondary)}>
          Cards read `bgElevated`, hold a 1px `border`, and stack a `shadow.card` for
          depth. The Apple theme uses a soft drop shadow; Vercel uses a hairline.
        </span>
        <div style={{ display: "flex", gap: t.space.xs }}>
          <Button>Primary</Button>
          <Button tone="ghost">Ghost</Button>
        </div>
      </div>

    </div>
  );
};

const Pill: React.FC<{
  children: React.ReactNode;
  tone?: "default" | "accent";
}> = ({ children, tone = "default" }) => {
  const t = useTheme();
  const accent = tone === "accent";
  return (
    <span
      style={{
        display: "inline-block",
        padding: `${t.space.xs / 2}px ${t.space.sm - 4}px`,
        borderRadius: t.radius.pill,
        fontSize: 16,
        fontWeight: 500,
        fontFamily: t.font.mono,
        backgroundColor: accent ? t.color.accentSoft : t.color.bgSubtle,
        color: accent ? t.color.accent : t.color.textSecondary,
        border: accent ? `1px solid ${t.color.accent}` : `1px solid ${t.color.border}`,
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
};

const Button: React.FC<{
  children: React.ReactNode;
  tone?: "primary" | "ghost";
}> = ({ children, tone = "primary" }) => {
  const t = useTheme();
  const primary = tone === "primary";
  return (
    <span
      style={{
        display: "inline-block",
        padding: `${t.space.sm - 4}px ${t.space.md}px`,
        borderRadius: t.radius.md,
        fontSize: t.type.caption.size,
        fontWeight: t.type.caption.weight,
        fontFamily: t.font.sans,
        backgroundColor: primary ? t.color.accent : "transparent",
        color: primary
          ? t.name === "vercel"
            ? t.color.bg
            : "#FFFFFF"
          : t.color.textPrimary,
        border: primary ? `1px solid ${t.color.accent}` : `1px solid ${t.color.border}`,
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
};

// ─── Footer (spacing + motion tokens) ──────────────────────────────────────

const Footer: React.FC = () => {
  const t = useTheme();
  const space = Object.entries(t.space) as [string, number][];
  const motion: [string, string | number][] = [
    ["entrance damping", t.motion.sceneEntranceDamping],
    ["stagger frames", t.motion.elementStaggerFrames],
    ["transition frames", t.motion.sceneTransitionFrames],
    ["arrow draw frames", t.motion.arrowDrawFrames],
    ["easing", t.motion.easing],
  ];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: `${t.space.sm}px ${t.space.md}px`,
        borderRadius: t.radius.md,
        backgroundColor: t.color.bgElevated,
        border: `1px solid ${t.color.border}`,
        gap: t.space.lg,
      }}
    >
      <div style={{ display: "flex", gap: t.space.sm, alignItems: "center" }}>
        <FooterLabel>space</FooterLabel>
        {space.map(([k, v]) => (
          <Token key={k} k={k} v={`${v}`} />
        ))}
      </div>
      <div style={{ display: "flex", gap: t.space.sm, alignItems: "center" }}>
        <FooterLabel>motion</FooterLabel>
        {motion.map(([k, v]) => (
          <Token key={k} k={k} v={`${v}`} />
        ))}
      </div>
    </div>
  );
};

const FooterLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return (
    <span
      style={{
        fontSize: 14,
        fontFamily: t.font.mono,
        color: t.color.textTertiary,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
};

const Token: React.FC<{ k: string; v: string }> = ({ k, v }) => {
  const t = useTheme();
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 6,
        padding: `4px 10px`,
        borderRadius: t.radius.sm,
        backgroundColor: t.color.bgSubtle,
        border: `1px solid ${t.color.border}`,
        fontSize: 14,
        fontFamily: t.font.mono,
        color: t.color.textSecondary,
        lineHeight: 1.2,
      }}
    >
      <span style={{ color: t.color.textTertiary }}>{k}</span>
      <span style={{ color: t.color.textPrimary }}>{v}</span>
    </span>
  );
};

// ─── Shared helpers ────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return (
    <span
      style={{
        fontSize: 16,
        fontWeight: 600,
        fontFamily: t.font.mono,
        color: t.color.textTertiary,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
};

const typeStyle = (token: TypeToken, color: string): React.CSSProperties => ({
  color,
  fontSize: token.size,
  fontWeight: token.weight,
  lineHeight: token.lineHeight,
  letterSpacing: token.letterSpacing,
  textTransform: token.textTransform,
});
