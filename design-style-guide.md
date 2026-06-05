# Design Style Guide — Two Themes

> This is the visual contract. Every color, size, and motion value lives here as a **token**. Components must read tokens from the active theme — **never hard-code values**. Two themes only: `apple` (light/clean) and `vercel` (dark/Geist). All output targets **1920×1080 @ 30fps**.

---

## 0. Global principles

- **Consistency beats effects.** The ByteByteGo polish comes from a tight, repeated system: same corner radius, same icon style, same spacing rhythm everywhere.
- **One accent per scene.** Don't rainbow. Lean on neutrals + a single accent.
- **No emojis. Ever.** Use real icons (Geist icons for Vercel, clean SF-style line icons for Apple).
- **Title-safe margins:** keep all key content within a 5% inset (96px horizontal, 54px vertical) from edges.
- **8px spacing grid.** All spacing/sizing snaps to multiples of 8 (occasionally 4 for fine work).
- **Realistic, not cartoonish** generated assets — soft, modern, product-grade illustration; consistent perspective and lighting per theme.

---

## 1. Theme tokens

Implement both as objects of the same shape so `useTheme()` returns an identical interface.

### 1a. APPLE theme (light / clean)

```ts
export const apple = {
  name: "apple",
  mode: "light",
  color: {
    bg:            "#FBFBFD",   // near-white page
    bgElevated:    "#FFFFFF",   // cards
    bgSubtle:      "#F5F5F7",   // section bands
    textPrimary:   "#1D1D1F",   // near-black
    textSecondary: "#6E6E73",
    textTertiary:  "#86868B",
    border:        "#E5E5EA",
    accent:        "#0071E3",   // Apple blue
    accentSoft:    "#E8F1FD",
    success:       "#34C759",
    warning:       "#FF9F0A",
    danger:        "#FF3B30",
    codeBg:        "#1D1D1F",   // dark editor even in light theme
    codeText:      "#F5F5F7",
  },
  font: {
    // SF Pro if licensed/available; otherwise Inter as the clean fallback.
    sans: "'SF Pro Display','Inter',system-ui,sans-serif",
    mono: "'SF Mono','JetBrains Mono',ui-monospace,monospace",
  },
  radius: { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 },
  shadow: {
    card: "0 4px 24px rgba(0,0,0,0.06)",
    pop:  "0 12px 48px rgba(0,0,0,0.10)",
  },
  motion: { entrance: "spring(soft)", easing: "easeOutCubic" },
};
```

### 1b. VERCEL theme (dark / Geist)

> Follow the `create-remotion-geist` skill for canonical Geist values; below is the working baseline.

```ts
export const vercel = {
  name: "vercel",
  mode: "dark",
  color: {
    bg:            "#000000",   // true black
    bgElevated:    "#0A0A0A",
    bgSubtle:      "#111111",
    textPrimary:   "#EDEDED",
    textSecondary: "#A1A1A1",
    textTertiary:  "#666666",
    border:        "#262626",   // hairline
    accent:        "#FFFFFF",   // Geist leans monochrome; white is the "accent"
    accentSoft:    "#171717",
    // Geist 10-step scale usage examples:
    blue:          "#0070F3",
    success:       "#0070F3",
    warning:       "#F5A623",
    danger:        "#E5484D",
    codeBg:        "#0A0A0A",
    codeText:      "#EDEDED",
  },
  font: {
    sans: "'Geist','Geist Sans',system-ui,sans-serif",
    mono: "'Geist Mono',ui-monospace,monospace",
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 }, // tighter than Apple
  shadow: {
    card: "0 0 0 1px #262626",          // hairline border instead of shadow
    pop:  "0 8px 32px rgba(0,0,0,0.6)",
  },
  motion: { entrance: "spring(snappy)", easing: "easeInOutCubic" },
};
```

**Visual contrast in one line:** Apple = airy, white, soft shadows, rounded, blue accent. Vercel = black, hairline borders, tighter radii, monochrome with electric-blue highlights.

---

## 2. Typography ramp (shared scale, theme fonts)

Sizes in px at 1080p. Use the sans family from the active theme.

| Token | Size | Weight | Line height | Use |
|---|---|---|---|---|
| `display` | 120 | 700 | 1.05 | Intro title card |
| `h1` | 72 | 700 | 1.1 | Scene titles |
| `h2` | 52 | 600 | 1.15 | Sub-section headers |
| `h3` | 40 | 600 | 1.2 | Card headings |
| `body` | 32 | 400 | 1.4 | Bullets, body copy |
| `caption` | 24 | 500 | 1.3 | Labels, tags |
| `code` | 28 | 400 (mono) | 1.5 | Code editor |
| `kicker` | 22 | 600 uppercase, +8% letter-spacing | 1.2 | Eyebrow above titles |

Rule: max ~7 words per line for titles; bullets ≤ 2 lines.

---

## 3. Spacing & layout

- Grid: **8px base.** Tokens: `xs=8, sm=16, md=24, lg=40, xl=64, 2xl=96`.
- Standard scene padding: `2xl` (96px) horizontal, `xl` (64px) vertical (inside title-safe area).
- Diagram nodes: min gap `lg` (40px); arrows have `sm` (16px) clearance from nodes.
- Max content column width for text scenes: 1400px, centered.

---

## 4. Components — visual spec

**Card:** radius `lg`; Apple → `bgElevated` + `shadow.card`; Vercel → `bgElevated` + hairline border. Inner padding `md`.

**Icon:** consistent stroke weight; size tokens `16/24/32/48/64`. Vercel → `@geist-ui/icons`; Apple → clean line/SF-style set. Color = `textPrimary` or `accent`. Never emoji.

**Badge/Pill:** radius `pill`; `accentSoft` bg + `accent` text (Apple) / `bgSubtle` + `textSecondary` (Vercel).

**AnimatedArrow:** stroke 3px; color `textTertiary` resting, `accent` when "active"; draws on via `strokeDashoffset` interpolation; arrowhead marker.

**CodeEditor:**
- Window chrome bar with three dots (Apple: colored macOS dots; Vercel: monochrome).
- Filename tab using `code`/`caption` token.
- Body bg = `codeBg`; text via `prism-react-renderer` theme (Apple → a light-on-dark theme like "vsDark"; Vercel → Geist-tuned dark).
- Line numbers in `textTertiary`.
- **Collapsed state:** shows ~3 lines + a chevron; expands to full height via spring.

---

## 5. Motion tokens

| Token | Apple | Vercel |
|---|---|---|
| Scene entrance | `spring({damping:200})` soft, ~20 frame | `spring({damping:30})` snappier |
| Element stagger | 4–6 frames between items | 3–4 frames |
| Transition between scenes | cross-fade 15 frames | slide+fade 12 frames |
| Easing default | `Easing.out(Easing.cubic)` | `Easing.inOut(Easing.cubic)` |
| Arrow draw | 18 frames | 14 frames |

**Code typing:** reveal 1 token every 1–2 frames (tune so a ~10-line block types in 3–5s); blinking cursor at 2Hz (15 frames on / 15 off).

All motion uses `useCurrentFrame()` + `interpolate()`/`spring()` per the Remotion best-practices skill.

---

## 6. Gemini/Imagen prompt style guidance

Bake these into every generated asset prompt (`make-asset-prompts.ts`) so output stays on-brand and realistic:

**Apple variant suffix:**
> "...clean modern product illustration, soft natural lighting, light neutral background (#FBFBFD), subtle depth, rounded geometry, Apple-keynote aesthetic, high detail, no text, no logos, no emoji, isometric or front-on consistent perspective."

**Vercel variant suffix:**
> "...sleek minimalist tech illustration, true-black background (#000000), monochrome with electric-blue (#0070F3) highlights, hairline strokes, high contrast, Geist/Vercel aesthetic, high detail, no text, no logos, no emoji, consistent perspective."

Rules for prompts: always specify aspect/safe area, request transparent background for icons, forbid embedded text and watermarks, and keep one consistent lighting/perspective per theme across a single video.

---

## 7. Quick do / don't

**Do:** reuse the same icon set per theme · keep one accent per scene · snap to 8px grid · animate reveals in narration order · cache assets.
**Don't:** mix themes in one video · use emojis · use regex code highlighting · hard-code colors · crowd scenes (≤ 1 idea per scene).
