/**
 * CodeEditor shell — window chrome, filename tab, line numbers, syntax
 * highlighting via `prism-react-renderer`, and a collapsed/expand state.
 *
 * Phase 2 scope: the SHELL is fully built. Typing animation lands in Phase 5
 * via the `typedChars` prop (when undefined, the full `code` renders).
 *
 * Spec (design-style-guide §4):
 *   - Window chrome bar with three dots (Apple: colored macOS; Vercel: monochrome)
 *   - Filename tab using caption token
 *   - Body bg = codeBg
 *   - Text via prism (Apple: vsDark; Vercel: nightOwl)
 *   - Line numbers in textTertiary
 *   - Collapsed state: ~3 lines + chevron; expands to full height via spring
 */

import React from "react";
import { Highlight, themes as prismThemes } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

export type CodeEditorProps = {
  code: string;
  filename?: string;
  language?: Language;
  showLineNumbers?: boolean;
  /**
   * When true, only the first `collapsedLines` rows are shown and a chevron
   * indicates more code is hidden. Phase 5 drives this from a frame-based
   * spring; Phase 2 treats it as a static prop.
   */
  collapsed?: boolean;
  collapsedLines?: number;
  /**
   * Phase 5 typing-effect prop. Reveals only the first N characters of
   * `code`. When undefined (default), renders the whole snippet.
   */
  typedChars?: number;
  /** Show a blinking cursor at the end of the typed prefix. */
  showCursor?: boolean;
  style?: React.CSSProperties;
};

const PRISM_MAP = {
  vsDark: prismThemes.vsDark,
  vsLight: prismThemes.vsLight,
  github: prismThemes.github,
  nightOwl: prismThemes.nightOwl,
} as const;

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  filename = "untitled.tsx",
  language = "tsx",
  showLineNumbers = true,
  collapsed = false,
  collapsedLines = 3,
  typedChars,
  showCursor = false,
  style,
}) => {
  const t = useTheme();
  const prismTheme = PRISM_MAP[t.code.prismTheme];

  const visibleCode = typedChars === undefined ? code : code.slice(0, typedChars);
  const lineHeight = t.type.code.lineHeight;
  const fontSize = t.type.code.size;
  const lineHeightPx = fontSize * lineHeight;

  const collapsedHeight =
    t.space.md * 2 + lineHeightPx * collapsedLines;

  return (
    <div
      style={{
        backgroundColor: t.color.codeBg,
        borderRadius: t.radius.md,
        border: `1px solid ${t.color.border}`,
        boxShadow: t.shadow.pop,
        overflow: "hidden",
        ...style,
      }}
    >
      <ChromeBar filename={filename} />
      <div
        style={{
          position: "relative",
          maxHeight: collapsed ? collapsedHeight : undefined,
          overflow: collapsed ? "hidden" : undefined,
        }}
      >
        <Highlight code={visibleCode} language={language} theme={prismTheme}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{
                margin: 0,
                padding: t.space.md,
                background: "transparent",
                fontFamily: t.font.mono,
                fontSize,
                lineHeight,
                color: t.color.codeText,
                tabSize: 2,
                whiteSpace: "pre",
              }}
            >
              {tokens.map((line, i) => (
                <div
                  key={i}
                  {...getLineProps({ line })}
                  style={{
                    ...getLineProps({ line }).style,
                    display: "flex",
                    minHeight: lineHeightPx,
                  }}
                >
                  {showLineNumbers && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 56,
                        marginRight: t.space.sm,
                        textAlign: "right",
                        color: t.color.textTertiary,
                        userSelect: "none",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                    {showCursor && i === tokens.length - 1 && <BlinkingCursor />}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
        {collapsed && <CollapsedFadeOverlay />}
      </div>
    </div>
  );
};

// ─── Chrome bar ────────────────────────────────────────────────────────────

const ChromeBar: React.FC<{ filename: string }> = ({ filename }) => {
  const t = useTheme();
  const dots =
    t.code.chromeDotStyle === "color"
      ? ["#FF5F57", "#FEBC2E", "#28C840"]
      : [t.color.textTertiary, t.color.textTertiary, t.color.textTertiary];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: t.space.sm,
        padding: `${t.space.sm}px ${t.space.md}px`,
        backgroundColor: t.color.bgElevated,
        borderBottom: `1px solid ${t.color.border}`,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {dots.map((c, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: c,
              opacity: t.code.chromeDotStyle === "monochrome" ? 0.5 : 1,
            }}
          />
        ))}
      </div>
      <FilenameTab>{filename}</FilenameTab>
    </div>
  );
};

const FilenameTab: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return (
    <div
      style={{
        padding: `4px ${t.space.sm}px`,
        borderRadius: t.radius.sm,
        backgroundColor: t.color.bgSubtle,
        border: `1px solid ${t.color.border}`,
        color: t.color.textSecondary,
        fontFamily: t.font.mono,
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.2,
      }}
    >
      {children}
    </div>
  );
};

// ─── Collapsed-state overlay (fade + chevron) ──────────────────────────────

const CollapsedFadeOverlay: React.FC = () => {
  const t = useTheme();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 72,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: t.space.xs,
        background: `linear-gradient(to bottom, ${transparent(
          t.color.codeBg,
        )}, ${t.color.codeBg} 75%)`,
        pointerEvents: "none",
      }}
    >
      <ChevronDown
        size={20}
        color={t.color.textTertiary}
        strokeWidth={t.icon.strokeWidth}
      />
    </div>
  );
};

const transparent = (hex: string) => {
  // Best-effort: prepend an alpha component for 3 or 6-digit hex; otherwise
  // fall back to fully transparent.
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return `${hex}00`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) return `${hex}0`;
  return "rgba(0,0,0,0)";
};

// ─── Blinking cursor (Phase 5 typing helper) ───────────────────────────────

import { useCurrentFrame } from "remotion";

const BlinkingCursor: React.FC = () => {
  const t = useTheme();
  const frame = useCurrentFrame();
  // 2 Hz blink at 30 fps: 15 frames on / 15 off (per design-style-guide §5).
  const visible = Math.floor(frame / 15) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: t.type.code.size * 0.95,
        marginLeft: 2,
        backgroundColor: t.color.codeText,
        opacity: visible ? 1 : 0,
        transform: "translateY(2px)",
      }}
    />
  );
};
