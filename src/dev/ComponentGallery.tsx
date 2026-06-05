/**
 * /dev composition — one frame per theme showing every Phase 2 component:
 * typography ramp · Card · Pills (every tone) · Icon (5 sizes, 4 colors)
 * · AnimatedArrow (animated draw with spring) · CodeEditor (collapsed
 * + expanded). Registered twice in Root (Apple + Vercel) for side-by-side
 * QA. AnimatedArrow uses useCurrentFrame → render stills at frame=60 so
 * the spring is fully resolved.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import {
  Lock,
  Shield,
  Server,
  Database,
  TerminalSquare,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import type { ThemeName } from "../theme/types";
import {
  BodyText,
  Caption,
  Card,
  Code,
  CodeEditor,
  Display,
  H2,
  H3,
  Icon,
  Kicker,
  Pill,
  Title,
  AnimatedArrow,
} from "../components";

export type ComponentGalleryProps = { theme: ThemeName };

export const ComponentGallery: React.FC<ComponentGalleryProps> = ({ theme }) => (
  <ThemeProvider name={theme}>
    <GalleryContent />
  </ThemeProvider>
);

const SAMPLE_CODE = `import { useTheme } from "./theme";

export const Card = ({ children }) => {
  const t = useTheme();
  const bg = t.color.bgElevated;
  return <div style={{ background: bg }}>{children}</div>;
};`;

const COLLAPSED_SNIPPET = `npm install @remotion/cli
npx remotion studio
npm run render -- --props='{"theme":"vercel"}'
# more...`;

const GalleryContent: React.FC = () => {
  const t = useTheme();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.color.bg,
        fontFamily: t.font.sans,
        padding: `${t.space.lg}px ${t.space.xl}px`,
        display: "flex",
        flexDirection: "column",
        gap: t.space.md,
      }}
    >
      <Header />
      <div style={{ display: "flex", gap: t.space.lg, flex: 1, minHeight: 0 }}>
        <LeftColumn />
        <RightColumn />
      </div>
    </AbsoluteFill>
  );
};

// ─── Header ────────────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const t = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.space.xs / 2 }}>
      <Kicker>Component gallery · {t.name} · {t.mode}</Kicker>
      <Title>ScrollCast component library</Title>
    </div>
  );
};

// ─── Section helpers ───────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return (
    <span
      style={{
        fontSize: 14,
        fontFamily: t.font.mono,
        fontWeight: 600,
        color: t.color.textTertiary,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  label,
  children,
  style,
}) => {
  const t = useTheme();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: t.space.xs,
        minWidth: 0,
        ...style,
      }}
    >
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
};

// ─── Left column — typography + icons ──────────────────────────────────────

const LeftColumn: React.FC = () => {
  const t = useTheme();
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: t.space.md, minWidth: 0 }}>
      <Section label="Typography primitives">
        <Card padding="sm">
          <div style={{ display: "flex", flexDirection: "column", gap: t.space.xs / 2 }}>
            <Display style={{ fontSize: 56, lineHeight: 1 }}>Display</Display>
            <Title style={{ fontSize: 34 }}>Title (h1)</Title>
            <H2 style={{ fontSize: 26 }}>H2 — Sub-section</H2>
            <H3 style={{ fontSize: 20 }}>H3 — Card heading</H3>
            <BodyText style={{ fontSize: 16 }}>BodyText — paragraph copy renders here.</BodyText>
            <div style={{ display: "flex", gap: t.space.sm, alignItems: "baseline" }}>
              <Caption style={{ fontSize: 13 }}>Caption</Caption>
              <Kicker style={{ fontSize: 11 }}>Kicker</Kicker>
              <Code style={{ fontSize: 14 }}>const t = useTheme();</Code>
            </div>
          </div>
        </Card>
      </Section>

      <Section label="Icon · 5 sizes · 4 colors">
        <Card padding="sm">
          <div style={{ display: "flex", flexDirection: "column", gap: t.space.xs }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: t.space.md }}>
              <Icon icon={Shield} size="sm" />
              <Icon icon={Shield} size="md" />
              <Icon icon={Shield} size="lg" />
              <Icon icon={Shield} size="xl" />
              <Icon icon={Shield} size="2xl" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: t.space.md }}>
              <Icon icon={Lock} size="lg" color="textPrimary" />
              <Icon icon={Server} size="lg" color="textSecondary" />
              <Icon icon={Database} size="lg" color="accent" />
              <Icon icon={TerminalSquare} size="lg" color="success" />
              <Icon icon={AlertTriangle} size="lg" color="warning" />
              <Icon icon={Zap} size="lg" color="danger" />
            </div>
          </div>
        </Card>
      </Section>

      <Section label="Pill · 5 tones">
        <Card padding="sm">
          <div style={{ display: "flex", flexWrap: "wrap", gap: t.space.xs, alignItems: "center" }}>
            <Pill>default</Pill>
            <Pill tone="accent">accent</Pill>
            <Pill tone="success" icon={CheckCircle2}>passed</Pill>
            <Pill tone="warning" icon={AlertTriangle}>warning</Pill>
            <Pill tone="danger" icon={Zap}>critical</Pill>
            <Pill icon={Lock}>auth</Pill>
          </div>
        </Card>
      </Section>

      <Section label="BackgroundLayer · theme.color.bg + image slot" style={{ flex: 1, minHeight: 0 }}>
        <Card padding="sm">
          <div style={{ display: "flex", alignItems: "center", gap: t.space.sm }}>
            <div
              style={{
                width: 96,
                height: 60,
                backgroundColor: t.color.bg,
                border: `1px solid ${t.color.border}`,
                borderRadius: t.radius.sm,
              }}
            />
            <BodyText style={{ fontSize: 16, color: t.color.textSecondary }}>
              Renders theme.color.bg plus an optional generated image slot
              (wired in Phase 4 to public/assets/&lt;theme&gt;/).
            </BodyText>
          </div>
        </Card>
      </Section>
    </div>
  );
};

// ─── Right column — Card showcase + AnimatedArrow + CodeEditor ────────────

const RightColumn: React.FC = () => {
  const t = useTheme();
  return (
    <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: t.space.md, minWidth: 0 }}>
      <Section label="Card + AnimatedArrow">
        <ArrowDiagram />
      </Section>
      <Section label="CodeEditor — collapsed (3 lines + chevron)">
        <CodeEditor
          filename="setup.sh"
          language="bash"
          code={COLLAPSED_SNIPPET}
          collapsed
          collapsedLines={3}
        />
      </Section>
      <Section label="CodeEditor — expanded (with cursor)" style={{ flex: 1, minHeight: 0 }}>
        <CodeEditor
          filename="Card.tsx"
          language="tsx"
          code={SAMPLE_CODE}
          showCursor
        />
      </Section>
    </div>
  );
};

const ArrowDiagram: React.FC = () => {
  const t = useTheme();
  // Diagram is a fixed-size relative parent so AnimatedArrow's absolute SVG
  // overlays the two end-cards correctly.
  const w = 900;
  const h = 130;
  const boxW = 200;
  const boxH = 100;
  const padY = (h - boxH) / 2;
  const leftBox = { x: 0, y: padY };
  const rightBox = { x: w - boxW, y: padY };
  const from = { x: leftBox.x + boxW, y: padY + boxH / 2 };
  const to = { x: rightBox.x - 8, y: padY + boxH / 2 };
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: w, height: h }}>
      <div
        style={{
          position: "absolute",
          left: leftBox.x,
          top: leftBox.y,
          width: boxW,
          height: boxH,
          padding: t.space.sm,
          backgroundColor: t.color.bgElevated,
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.lg,
          boxShadow: t.shadow.card,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          justifyContent: "center",
        }}
      >
        <Icon icon={Server} size="md" color="accent" />
        <BodyText style={{ fontSize: 16, fontWeight: 600 }}>App server</BodyText>
      </div>
      <div
        style={{
          position: "absolute",
          left: rightBox.x,
          top: rightBox.y,
          width: boxW,
          height: boxH,
          padding: t.space.sm,
          backgroundColor: t.color.bgElevated,
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.lg,
          boxShadow: t.shadow.card,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          justifyContent: "center",
        }}
      >
        <Icon icon={Database} size="md" color="success" />
        <BodyText style={{ fontSize: 16, fontWeight: 600 }}>Database</BodyText>
      </div>
      <AnimatedArrow from={from} to={to} active delayFrames={6} />
    </div>
  );
};
