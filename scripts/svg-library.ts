/**
 * Theme-aware "cool 3D" SVG library for the no-API-key path.
 *
 * Replaces the original "this is a placeholder" stubs with isometric and
 * 3D-shaded icons / backgrounds / diagrams / illustrations that look good
 * enough to ship in the final video. The script picks one by keyword
 * matching `PromptVariant.description`; if nothing matches it falls back
 * to a deterministic choice keyed off the asset id so the same asset
 * always gets the same icon.
 *
 * Every factory returns the inner SVG body (no `<svg>` wrapper) — the
 * writer in `generate-assets.ts` wraps it with the outer `<svg>` element
 * plus a `<defs>` block of shared gradients and a soft-shadow filter.
 *
 * Coordinates assume a unit canvas; the writer scales them by the actual
 * width/height at output time. All shapes are centered around (w/2, h/2)
 * so a single layout works at any aspect ratio.
 */

import type { PromptVariant } from "../src/asset-prompt.schema";

// ─── Theme palette ─────────────────────────────────────────────────────────

export type SvgPalette = {
  bg: string;
  fg: string;
  sub: string;
  border: string;
  accent: string;
  /** Darker accent used as the cast/shadow face of 3D shapes. */
  accentDeep: string;
  /** Lighter accent used as the highlight face of 3D shapes. */
  accentLight: string;
  /** Faint accent for body fills behind 3D objects. */
  accentSoft: string;
};

const PALETTE: Record<"apple" | "vercel", SvgPalette> = {
  apple: {
    bg: "#FBFBFD",
    fg: "#1D1D1F",
    sub: "#6E6E73",
    border: "#E5E5EA",
    accent: "#0071E3",
    accentDeep: "#003F8C",
    accentLight: "#5AB0FF",
    accentSoft: "#E8F1FD",
  },
  vercel: {
    bg: "#000000",
    fg: "#EDEDED",
    sub: "#A1A1A1",
    border: "#262626",
    accent: "#0070F3",
    accentDeep: "#003F8C",
    accentLight: "#5AB0FF",
    accentSoft: "#0F1E33",
  },
};

export const paletteFor = (theme: "apple" | "vercel"): SvgPalette =>
  PALETTE[theme];

// ─── Geometry helpers ──────────────────────────────────────────────────────

const pts = (...arr: number[]): string => {
  const out: string[] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(`${arr[i].toFixed(2)},${arr[i + 1].toFixed(2)}`);
  return out.join(" ");
};

/** Soft elliptical drop shadow under an object at (cx, cy) of radius r. */
const shadow = (cx: number, cy: number, rx: number, ry: number, c: SvgPalette): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.fg}" opacity="0.18" filter="url(#sc-blur)" />`;

// ─── Icon factories ────────────────────────────────────────────────────────

type Factory = (c: SvgPalette, w: number, h: number) => string;

/** Isometric cube — server / backend / service / container. */
const icoCube: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.22;
  const top = pts(cx - s, cy - s / 2, cx, cy - s, cx + s, cy - s / 2, cx, cy);
  const right = pts(cx, cy, cx + s, cy - s / 2, cx + s, cy + s / 2, cx, cy + s);
  const left = pts(cx, cy, cx - s, cy - s / 2, cx - s, cy + s / 2, cx, cy + s);
  return `
    ${shadow(cx, cy + s + 14, s * 0.95, 14, c)}
    <polygon points="${top}"   fill="${c.accentLight}" />
    <polygon points="${right}" fill="${c.accent}" />
    <polygon points="${left}"  fill="${c.accentDeep}" />
    <polyline points="${pts(cx - s, cy - s / 2, cx, cy, cx + s, cy - s / 2)}" fill="none" stroke="${c.bg}" stroke-opacity="0.25" stroke-width="2" />
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + s}" stroke="${c.bg}" stroke-opacity="0.25" stroke-width="2" />
  `;
};

/** Stacked cylinder — database / storage / data lake. */
const icoCylinder: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.18;
  const ry = r * 0.32;
  const layerH = r * 0.55;
  const stacks = 3;
  const startY = cy - ((stacks - 1) * layerH) / 2 - layerH;

  const layer = (yTop: number, fill: string, side: string): string => `
    <rect x="${cx - r}" y="${yTop}" width="${r * 2}" height="${layerH}" fill="${side}" />
    <ellipse cx="${cx}" cy="${yTop + layerH}" rx="${r}" ry="${ry}" fill="${side}" />
    <ellipse cx="${cx}" cy="${yTop}" rx="${r}" ry="${ry}" fill="${fill}" />
  `;

  let body = shadow(cx, cy + stacks * layerH * 0.5 + 16, r * 0.95, 14, c);
  for (let i = 0; i < stacks; i++) {
    const yTop = startY + i * layerH;
    body += layer(yTop, c.accentLight, c.accent);
  }
  return body;
};

/** 3D padlock — security / auth / encryption. */
const icoLock: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2 + Math.min(w, h) * 0.04;
  const s = Math.min(w, h) * 0.34;
  const bodyW = s * 0.85;
  const bodyH = s * 0.7;
  const bodyY = cy;
  const shackleR = bodyW * 0.35;
  return `
    ${shadow(cx, bodyY + bodyH + 14, bodyW * 0.6, 12, c)}
    <!-- shackle -->
    <path d="M ${cx - shackleR} ${bodyY} V ${bodyY - shackleR} A ${shackleR} ${shackleR} 0 0 1 ${cx + shackleR} ${bodyY - shackleR} V ${bodyY}"
          fill="none" stroke="${c.accentDeep}" stroke-width="${s * 0.13}" stroke-linecap="round" />
    <path d="M ${cx - shackleR + 4} ${bodyY} V ${bodyY - shackleR + 2} A ${shackleR - 4} ${shackleR - 4} 0 0 1 ${cx + shackleR - 4} ${bodyY - shackleR + 2} V ${bodyY}"
          fill="none" stroke="${c.accent}" stroke-width="${s * 0.09}" stroke-linecap="round" />
    <!-- body -->
    <rect x="${cx - bodyW / 2}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${bodyH * 0.15}" fill="${c.accent}" />
    <rect x="${cx - bodyW / 2}" y="${bodyY}" width="${bodyW}" height="${bodyH * 0.5}" rx="${bodyH * 0.15}" fill="${c.accentLight}" />
    <!-- keyhole -->
    <circle cx="${cx}" cy="${bodyY + bodyH * 0.45}" r="${bodyH * 0.13}" fill="${c.accentDeep}" />
    <rect x="${cx - bodyH * 0.05}" y="${bodyY + bodyH * 0.45}" width="${bodyH * 0.1}" height="${bodyH * 0.3}" fill="${c.accentDeep}" />
  `;
};

/** 3D shield with checkmark — protection / validation. */
const icoShield: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2 - Math.min(w, h) * 0.02;
  const s = Math.min(w, h) * 0.38;
  const top = cy - s * 0.55;
  const bottom = cy + s * 0.75;
  const side = s * 0.5;
  const path = `M ${cx} ${top} L ${cx + side} ${top + s * 0.18} L ${cx + side} ${cy + s * 0.05} Q ${cx + side} ${bottom - s * 0.2} ${cx} ${bottom} Q ${cx - side} ${bottom - s * 0.2} ${cx - side} ${cy + s * 0.05} L ${cx - side} ${top + s * 0.18} Z`;
  const inner = `M ${cx} ${top + 14} L ${cx + side - 14} ${top + s * 0.22} L ${cx + side - 14} ${cy + s * 0.02} Q ${cx + side - 14} ${bottom - s * 0.22} ${cx} ${bottom - 18} Q ${cx - side + 14} ${bottom - s * 0.22} ${cx - side + 14} ${cy + s * 0.02} L ${cx - side + 14} ${top + s * 0.22} Z`;
  return `
    ${shadow(cx, bottom + 14, side * 0.85, 12, c)}
    <path d="${path}" fill="${c.accent}" />
    <path d="${path}" fill="url(#sc-shield-grad)" />
    <path d="${inner}" fill="${c.accentDeep}" />
    <polyline points="${pts(cx - s * 0.22, cy + s * 0.05, cx - s * 0.05, cy + s * 0.2, cx + s * 0.26, cy - s * 0.15)}"
              fill="none" stroke="${c.bg}" stroke-width="${s * 0.07}" stroke-linecap="round" stroke-linejoin="round" />
  `;
};

/** Cloud — cloud services / SaaS. */
const icoCloud: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2 + h * 0.04;
  const s = Math.min(w, h) * 0.28;
  // Cloud shape using multiple circles + a base rect with rounded corners
  return `
    ${shadow(cx, cy + s * 0.55 + 16, s * 1.4, 14, c)}
    <path d="M ${cx - s * 1.2} ${cy + s * 0.55}
             Q ${cx - s * 1.45} ${cy + s * 0.55} ${cx - s * 1.45} ${cy + s * 0.1}
             Q ${cx - s * 1.55} ${cy - s * 0.45} ${cx - s * 0.85} ${cy - s * 0.45}
             Q ${cx - s * 0.65} ${cy - s * 0.95} ${cx - s * 0.05} ${cy - s * 0.85}
             Q ${cx + s * 0.45} ${cy - s * 1.05} ${cx + s * 0.7} ${cy - s * 0.55}
             Q ${cx + s * 1.55} ${cy - s * 0.5} ${cx + s * 1.4} ${cy + s * 0.15}
             Q ${cx + s * 1.55} ${cy + s * 0.55} ${cx + s * 1.2} ${cy + s * 0.55} Z"
          fill="${c.accent}" />
    <path d="M ${cx - s * 1.2} ${cy + s * 0.55}
             Q ${cx - s * 1.45} ${cy + s * 0.55} ${cx - s * 1.45} ${cy + s * 0.1}
             Q ${cx - s * 1.55} ${cy - s * 0.45} ${cx - s * 0.85} ${cy - s * 0.45}
             Q ${cx - s * 0.65} ${cy - s * 0.95} ${cx - s * 0.05} ${cy - s * 0.85}
             Q ${cx + s * 0.45} ${cy - s * 1.05} ${cx + s * 0.7} ${cy - s * 0.55}
             Q ${cx + s * 1.55} ${cy - s * 0.5} ${cx + s * 1.4} ${cy + s * 0.15}
             Q ${cx + s * 1.55} ${cy + s * 0.55} ${cx + s * 1.2} ${cy + s * 0.55} Z"
          fill="url(#sc-cloud-grad)" opacity="0.7" />
    <ellipse cx="${cx - s * 0.4}" cy="${cy - s * 0.55}" rx="${s * 0.6}" ry="${s * 0.18}" fill="${c.accentLight}" opacity="0.4" />
  `;
};

/** Key — credentials / tokens. */
const icoKey: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.32;
  const ringR = s * 0.32;
  const shaftStart = cx - ringR * 0.4;
  const shaftEnd = cx + s * 1.4;
  const shaftH = s * 0.18;
  return `
    ${shadow(cx + s * 0.3, cy + shaftH + 18, s, 12, c)}
    <circle cx="${cx - s * 0.55}" cy="${cy}" r="${ringR}" fill="${c.accent}" />
    <circle cx="${cx - s * 0.55}" cy="${cy}" r="${ringR * 0.55}" fill="${c.bg}" />
    <rect x="${shaftStart}" y="${cy - shaftH / 2}" width="${shaftEnd - shaftStart}" height="${shaftH}" fill="${c.accent}" />
    <rect x="${shaftStart}" y="${cy - shaftH / 2}" width="${shaftEnd - shaftStart}" height="${shaftH * 0.45}" fill="${c.accentLight}" />
    <rect x="${shaftEnd - s * 0.5}" y="${cy + shaftH / 2}" width="${s * 0.12}" height="${shaftH * 0.9}" fill="${c.accentDeep}" />
    <rect x="${shaftEnd - s * 0.25}" y="${cy + shaftH / 2}" width="${s * 0.12}" height="${shaftH * 1.4}" fill="${c.accentDeep}" />
  `;
};

/** Code brackets `< />` — code / function / scripting. */
const icoCode: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const s = Math.min(w, h) * 0.32;
  return `
    ${shadow(cx, cy + s + 18, s * 1.4, 12, c)}
    <polyline points="${pts(cx - s * 0.6, cy - s * 0.7, cx - s * 1.4, cy, cx - s * 0.6, cy + s * 0.7)}"
              fill="none" stroke="${c.accent}" stroke-width="${s * 0.22}" stroke-linecap="round" stroke-linejoin="round" />
    <polyline points="${pts(cx + s * 0.6, cy - s * 0.7, cx + s * 1.4, cy, cx + s * 0.6, cy + s * 0.7)}"
              fill="none" stroke="${c.accent}" stroke-width="${s * 0.22}" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="${cx + s * 0.3}" y1="${cy - s * 0.85}" x2="${cx - s * 0.3}" y2="${cy + s * 0.85}"
          stroke="${c.accentLight}" stroke-width="${s * 0.18}" stroke-linecap="round" />
  `;
};

/** Terminal window — CLI / shell / commands. */
const icoTerminal: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const tw = Math.min(w, h) * 0.7;
  const th = tw * 0.62;
  const x = cx - tw / 2;
  const y = cy - th / 2;
  const dots = ["#FF5F57", "#FEBC2E", "#28C840"];
  return `
    ${shadow(cx, y + th + 18, tw * 0.55, 14, c)}
    <rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="${th * 0.08}" fill="${c.fg}" />
    <rect x="${x}" y="${y}" width="${tw}" height="${th * 0.18}" fill="${c.sub}" opacity="0.4" />
    ${dots.map((d, i) => `<circle cx="${x + th * 0.12 + i * th * 0.16}" cy="${y + th * 0.09}" r="${th * 0.045}" fill="${d}" />`).join("")}
    <text x="${x + th * 0.2}" y="${y + th * 0.55}" fill="${c.accent}" font-family="ui-monospace,monospace" font-size="${th * 0.18}" font-weight="600">&gt;_</text>
    <rect x="${x + th * 0.4}" y="${y + th * 0.46}" width="${th * 0.05}" height="${th * 0.16}" fill="${c.accentLight}" />
  `;
};

/** Network nodes — distributed systems / mesh / connection graph. */
const icoNetwork: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.34;
  const nodeR = r * 0.13;
  const nodes = [
    { x: cx, y: cy },
    { x: cx + r, y: cy - r * 0.4 },
    { x: cx + r * 0.6, y: cy + r * 0.8 },
    { x: cx - r, y: cy - r * 0.4 },
    { x: cx - r * 0.6, y: cy + r * 0.8 },
  ];
  const edges = nodes.slice(1).map((n) =>
    `<line x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}" stroke="${c.accent}" stroke-width="${nodeR * 0.55}" stroke-linecap="round" opacity="0.85" />`
  ).join("");
  const dots = nodes.map((n, i) =>
    `<circle cx="${n.x}" cy="${n.y}" r="${nodeR * (i === 0 ? 1.3 : 1)}" fill="${i === 0 ? c.accent : c.accentLight}" />` +
    `<circle cx="${n.x}" cy="${n.y}" r="${nodeR * (i === 0 ? 1.3 : 1) * 0.5}" fill="${c.bg}" />`
  ).join("");
  return `
    ${shadow(cx, cy + r + 14, r * 1.1, 12, c)}
    ${edges}
    ${dots}
  `;
};

/** Bar chart — metrics / dashboards / analytics. */
const icoChart: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const cw = Math.min(w, h) * 0.7;
  const ch = cw * 0.6;
  const x0 = cx - cw / 2;
  const baseline = cy + ch / 2;
  const bars = [0.45, 0.65, 0.85, 0.55, 0.95];
  const barW = (cw / bars.length) * 0.55;
  const gap = (cw / bars.length) * 0.45;
  return `
    ${shadow(cx, baseline + 18, cw * 0.5, 12, c)}
    <line x1="${x0}" y1="${baseline}" x2="${x0 + cw}" y2="${baseline}" stroke="${c.sub}" stroke-width="3" stroke-linecap="round" opacity="0.6" />
    ${bars.map((v, i) => {
      const bx = x0 + i * (barW + gap) + gap / 2;
      const by = baseline - v * ch;
      return `<rect x="${bx}" y="${by}" width="${barW}" height="${v * ch}" rx="${barW * 0.18}" fill="${c.accent}" />
              <rect x="${bx}" y="${by}" width="${barW}" height="${Math.min(v * ch, 18)}" rx="${barW * 0.18}" fill="${c.accentLight}" />`;
    }).join("")}
    <polyline points="${bars.map((v, i) => `${(x0 + i * (barW + gap) + gap / 2 + barW / 2).toFixed(2)},${(baseline - v * ch - 14).toFixed(2)}`).join(" ")}"
              fill="none" stroke="${c.accentDeep}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
  `;
};

/** Gear — config / settings / pipeline machinery. */
const icoGear: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.3;
  const teeth = 8;
  const innerR = r * 0.7;
  const toothW = (Math.PI * 2 * r) / (teeth * 2) * 0.7;
  let path = "";
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tx = cx + Math.cos(a) * (r + r * 0.18);
    const ty = cy + Math.sin(a) * (r + r * 0.18);
    path += `<rect x="${tx - toothW / 2}" y="${ty - toothW / 2}" width="${toothW}" height="${toothW}" transform="rotate(${(a * 180 / Math.PI + 45).toFixed(1)} ${tx} ${ty})" fill="${c.accent}" />`;
  }
  return `
    ${shadow(cx, cy + r + 18, r * 1.1, 12, c)}
    ${path}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.accent}" />
    <circle cx="${cx}" cy="${cy}" r="${r * 0.95}" fill="${c.accentLight}" opacity="0.4" />
    <circle cx="${cx}" cy="${cy}" r="${innerR * 0.55}" fill="${c.bg}" />
    <circle cx="${cx}" cy="${cy}" r="${innerR * 0.35}" fill="${c.accentDeep}" />
  `;
};

/** Warning triangle — alert / error / critical / risk. */
const icoAlert: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2 + Math.min(w, h) * 0.04;
  const s = Math.min(w, h) * 0.36;
  const top = cy - s * 0.85;
  const left = cx - s * 0.95;
  const right = cx + s * 0.95;
  const bottom = cy + s * 0.65;
  return `
    ${shadow(cx, bottom + 14, s * 1.15, 12, c)}
    <path d="M ${cx} ${top} L ${right} ${bottom} L ${left} ${bottom} Z" fill="#F5A623" />
    <path d="M ${cx} ${top + 14} L ${right - 12} ${bottom - 4} L ${left + 12} ${bottom - 4} Z" fill="#FFC857" />
    <rect x="${cx - s * 0.07}" y="${cy - s * 0.3}" width="${s * 0.14}" height="${s * 0.55}" rx="${s * 0.06}" fill="${c.fg}" />
    <circle cx="${cx}" cy="${cy + s * 0.4}" r="${s * 0.08}" fill="${c.fg}" />
  `;
};

/** Document / report — finding / spec / output. */
const icoDoc: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dw = Math.min(w, h) * 0.42;
  const dh = dw * 1.3;
  const x = cx - dw / 2;
  const y = cy - dh / 2;
  return `
    ${shadow(cx, y + dh + 14, dw * 0.65, 12, c)}
    <rect x="${x}" y="${y}" width="${dw}" height="${dh}" rx="${dw * 0.05}" fill="${c.accentLight}" />
    <rect x="${x}" y="${y}" width="${dw}" height="${dh}" rx="${dw * 0.05}" fill="url(#sc-doc-grad)" />
    <rect x="${x + dw * 0.12}" y="${y + dh * 0.18}" width="${dw * 0.76}" height="${dh * 0.05}" rx="${dh * 0.025}" fill="${c.accent}" opacity="0.7" />
    <rect x="${x + dw * 0.12}" y="${y + dh * 0.3}" width="${dw * 0.6}" height="${dh * 0.045}" rx="${dh * 0.02}" fill="${c.accent}" opacity="0.5" />
    <rect x="${x + dw * 0.12}" y="${y + dh * 0.4}" width="${dw * 0.7}" height="${dh * 0.045}" rx="${dh * 0.02}" fill="${c.accent}" opacity="0.5" />
    <rect x="${x + dw * 0.12}" y="${y + dh * 0.5}" width="${dw * 0.5}" height="${dh * 0.045}" rx="${dh * 0.02}" fill="${c.accent}" opacity="0.5" />
    <rect x="${x + dw * 0.12}" y="${y + dh * 0.65}" width="${dw * 0.3}" height="${dh * 0.12}" rx="${dh * 0.025}" fill="${c.accent}" />
  `;
};

const ICONS: Record<string, Factory> = {
  cube: icoCube,
  cylinder: icoCylinder,
  lock: icoLock,
  shield: icoShield,
  cloud: icoCloud,
  key: icoKey,
  code: icoCode,
  terminal: icoTerminal,
  network: icoNetwork,
  chart: icoChart,
  gear: icoGear,
  alert: icoAlert,
  doc: icoDoc,
};

// ─── Backgrounds ───────────────────────────────────────────────────────────

/** Dotted-grid bg with a radial accent glow — clean tech look. */
const bgGrid: Factory = (c, w, h) => {
  const dot = 3;
  const spacing = 64;
  const cols = Math.ceil(w / spacing);
  const rows = Math.ceil(h / spacing);
  let dots = "";
  for (let r = 0; r < rows; r++) {
    for (let cI = 0; cI < cols; cI++) {
      dots += `<circle cx="${cI * spacing + spacing / 2}" cy="${r * spacing + spacing / 2}" r="${dot}" fill="${c.sub}" opacity="0.35" />`;
    }
  }
  return `
    ${dots}
    <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.45}" ry="${h * 0.5}" fill="url(#sc-radial)" />
  `;
};

/** Aurora — flowing curved color bands. */
const bgAurora: Factory = (c, w, h) => {
  return `
    <path d="M 0 ${h * 0.4} Q ${w * 0.3} ${h * 0.1} ${w * 0.6} ${h * 0.45} T ${w} ${h * 0.5} L ${w} ${h * 0.65} Q ${w * 0.7} ${h * 0.4} ${w * 0.4} ${h * 0.6} T 0 ${h * 0.6} Z"
          fill="${c.accent}" opacity="0.25" />
    <path d="M 0 ${h * 0.55} Q ${w * 0.4} ${h * 0.25} ${w * 0.7} ${h * 0.55} T ${w} ${h * 0.6} L ${w} ${h * 0.8} Q ${w * 0.5} ${h * 0.55} ${w * 0.2} ${h * 0.75} T 0 ${h * 0.75} Z"
          fill="${c.accentLight}" opacity="0.18" />
    <path d="M 0 ${h * 0.7} Q ${w * 0.5} ${h * 0.4} ${w} ${h * 0.7} L ${w} ${h} L 0 ${h} Z"
          fill="${c.accentDeep}" opacity="0.22" />
  `;
};

/** Mesh wireframe — pseudo-3D plane receding into the distance. */
const bgMesh: Factory = (c, w, h) => {
  const horizon = h * 0.55;
  const vp = w / 2;
  const lines = 14;
  let v = "";
  for (let i = -lines; i <= lines; i++) {
    const t = i / lines;
    const x1 = vp + t * w * 1.2;
    v += `<line x1="${x1}" y1="${horizon}" x2="${vp + t * w * 3.5}" y2="${h * 1.3}" stroke="${c.accent}" stroke-width="2" opacity="${0.18 + Math.abs(t) * 0.12}" />`;
  }
  let hLines = "";
  for (let i = 1; i <= 8; i++) {
    const y = horizon + (h - horizon) * Math.pow(i / 8, 1.5);
    hLines += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${c.accent}" stroke-width="2" opacity="${0.1 + (i / 8) * 0.25}" />`;
  }
  return `
    ${hLines}
    ${v}
    <ellipse cx="${vp}" cy="${horizon - 40}" rx="${w * 0.35}" ry="${h * 0.18}" fill="url(#sc-radial)" />
  `;
};

const BACKGROUNDS: Record<string, Factory> = {
  grid: bgGrid,
  aurora: bgAurora,
  mesh: bgMesh,
};

// ─── Diagrams ──────────────────────────────────────────────────────────────

/** Three-node horizontal flow with arrows and depth shading. */
const diagFlow: Factory = (c, w, h) => {
  const cy = h / 2;
  const nodeW = w * 0.18;
  const nodeH = h * 0.32;
  const gap = w * 0.08;
  const total = nodeW * 3 + gap * 2;
  const startX = (w - total) / 2;
  const nodes = [0, 1, 2].map((i) => ({ x: startX + i * (nodeW + gap), y: cy - nodeH / 2 }));
  const labels = ["INPUT", "PROCESS", "OUTPUT"];
  return `
    ${shadow(w / 2, cy + nodeH / 2 + 24, total / 2.2, 14, c)}
    ${nodes.map((n, i) => `
      <rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${nodeH}" rx="${nodeH * 0.12}" fill="${c.accent}" />
      <rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${nodeH * 0.5}" rx="${nodeH * 0.12}" fill="${c.accentLight}" opacity="0.6" />
      <rect x="${n.x + nodeW * 0.15}" y="${n.y + nodeH * 0.4}" width="${nodeW * 0.7}" height="${nodeH * 0.08}" rx="3" fill="${c.bg}" opacity="0.8" />
      <text x="${n.x + nodeW / 2}" y="${n.y + nodeH * 0.7}" font-family="ui-monospace,monospace" font-size="${nodeH * 0.12}" font-weight="600" fill="${c.bg}" text-anchor="middle">${labels[i]}</text>
    `).join("")}
    ${nodes.slice(0, -1).map((n, i) => {
      const next = nodes[i + 1];
      const sx = n.x + nodeW;
      const ex = next.x;
      return `
        <line x1="${sx + 6}" y1="${cy}" x2="${ex - 18}" y2="${cy}" stroke="${c.accent}" stroke-width="6" stroke-linecap="round" />
        <polygon points="${pts(ex - 6, cy, ex - 22, cy - 10, ex - 22, cy + 10)}" fill="${c.accent}" />
      `;
    }).join("")}
  `;
};

const DIAGRAMS: Record<string, Factory> = {
  flow: diagFlow,
};

// ─── Illustrations ─────────────────────────────────────────────────────────

/** Stacked panels — for intro hero / brand mark. */
const illoStack: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const pw = Math.min(w, h) * 0.42;
  const ph = pw * 0.6;
  const offset = pw * 0.06;
  return `
    ${shadow(cx, cy + ph / 2 + 22, pw * 0.7, 14, c)}
    ${[0, 1, 2].map((i) => {
      const z = 2 - i;
      const x = cx - pw / 2 + (z - 1) * offset;
      const y = cy - ph / 2 + (z - 1) * offset;
      const fill = i === 0 ? c.accent : i === 1 ? c.accentLight : c.accentDeep;
      return `<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="${ph * 0.1}" fill="${fill}" opacity="${i === 0 ? 1 : 0.85}" />` +
        `<rect x="${x + pw * 0.08}" y="${y + ph * 0.2}" width="${pw * 0.6}" height="${ph * 0.08}" rx="3" fill="${c.bg}" opacity="0.7" />` +
        `<rect x="${x + pw * 0.08}" y="${y + ph * 0.35}" width="${pw * 0.4}" height="${ph * 0.06}" rx="3" fill="${c.bg}" opacity="0.5" />`;
    }).reverse().join("")}
  `;
};

/** Glowing orb — for outro / closing mark. */
const illoOrb: Factory = (c, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.28;
  return `
    <ellipse cx="${cx}" cy="${cy + r * 1.1}" rx="${r * 0.95}" ry="${r * 0.18}" fill="${c.fg}" opacity="0.2" filter="url(#sc-blur)" />
    <circle cx="${cx}" cy="${cy}" r="${r * 1.4}" fill="${c.accent}" opacity="0.18" />
    <circle cx="${cx}" cy="${cy}" r="${r * 1.15}" fill="${c.accent}" opacity="0.28" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.accent}" />
    <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.55}" fill="${c.accentLight}" opacity="0.7" />
    <circle cx="${cx - r * 0.4}" cy="${cy - r * 0.45}" r="${r * 0.18}" fill="${c.bg}" opacity="0.75" />
  `;
};

const ILLUSTRATIONS: Record<string, Factory> = {
  stack: illoStack,
  orb: illoOrb,
};

// ─── Keyword picker ────────────────────────────────────────────────────────

/**
 * Ordering matters: the first regex that matches wins. Specific patterns
 * (alert, lock, doc) come before broader ones (cube, network) so that
 * "vulnerability scanner" picks `alert` instead of `gear`.
 *
 * Patterns cover the canonical Penetration Testing sample plus the
 * topics most likely to show up in a tech explainer (Redis, Kubernetes,
 * databases, networking, security, infra). When nothing matches the
 * deterministic id-hash fallback picks something stable so the same
 * asset always lands on the same icon.
 */
const KEYWORD_TO_ICON: Array<[RegExp, string]> = [
  // Risk / failure / exploit / vulnerability — most specific first.
  [/\b(alert|warning|error|critical|fail|risk|danger|vulnerab|threat|exploit|breach|attack|incident|pentest|penetration|intrusion|malicious|adversar)\b/i, "alert"],
  // Documents / reports / findings.
  [/\b(doc|document|report|finding|spec|paper|file|markdown|pdf|deliverable|writeup|contract|policy|authoriz|sow)\b/i, "doc"],
  // Auth + security primitives.
  [/\b(lock|secure|security|atomic|transaction|mutex|password|encrypt|tls|ssl|hash|critical[\s-]section)\b/i, "lock"],
  [/\b(auth|authentication|authoriz|access|permission|role|rbac|policy[\s-]control)\b/i, "key"],
  // Validation / trust / verification.
  [/\b(shield|protect|defense|defend|safe|guard|firewall|validate|valid|check|verify|trust|assert|qa|test|testing|hardening)\b/i, "shield"],
  // Cloud / infra.
  [/\b(cloud|aws|azure|gcp|s3|saas|cdn|edge|vpc)\b/i, "cloud"],
  // Credentials specifically (after auth catches the broader matches).
  [/\b(key|token|credential|jwt|secret|signing|kms|iam|api\s?key|cert)\b/i, "key"],
  // Persistence / storage / KV.
  [/\b(database|data\s?(store|lake|set|base)|storage|db|sql|nosql|redis|postgres|mongo|cache|persist|durab|disk|aof|rdb|snapshot|backup|kv|key.?value|hash.?map|memory|ram|store)\b/i, "cylinder"],
  // Code / programming.
  [/\b(code|function|method|class|snippet|script|programming|sdk|library|module|package|syntax)\b/i, "code"],
  // CLI / shell / commands.
  [/\b(terminal|cli|shell|bash|command|prompt|exec|tty|scan|probe|fuzz|enumerate)\b/i, "terminal"],
  // Networking / pub-sub / messaging / distributed.
  [/\b(network|connect|socket|tcp|http|protocol|mesh|graph|topolog|p2p|dns|recon|reconnaissance|pub.?sub|publish|subscribe|broker|message|queue|stream|event|webhook|rpc|grpc|websocket|peer)\b/i, "network"],
  // Metrics / analytics.
  [/\b(chart|graph|metric|stat|analytic|dashboard|monitor|observ|telemetry|latency|throughput|rps)\b/i, "chart"],
  // Config / orchestration / pipeline.
  [/\b(gear|config|setting|tool|admin|pipeline|build|deploy|orchestrat|k8s|kubernetes|operator|controller|scope|scoping|setup)\b/i, "gear"],
  // Backend / server / compute (broadest, catches generic "service" / "server").
  [/\b(server|backend|api|service|microservice|container|node|host|cluster|runtime|worker|daemon|process|instance|pod)\b/i, "cube"],
];

const KEYWORD_TO_BACKGROUND: Array<[RegExp, string]> = [
  [/\b(intro|hero|opening|landing|brand)\b/i, "aurora"],
  [/\b(grid|technical|architecture|infrastructure)\b/i, "grid"],
  [/\b(network|mesh|3d|depth|space|plane|distributed)\b/i, "mesh"],
];

const KEYWORD_TO_ILLUSTRATION: Array<[RegExp, string]> = [
  [/\b(orb|glow|outro|closing|recap|end|mark|sphere|globe)\b/i, "orb"],
];

const djb2 = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const pickByKeyword = (
  table: Array<[RegExp, string]>,
  haystack: string,
): string | null => {
  for (const [re, name] of table) if (re.test(haystack)) return name;
  return null;
};

const pickFallback = (
  catalog: Record<string, Factory>,
  id: string,
): string => {
  const names = Object.keys(catalog);
  return names[djb2(id) % names.length];
};

const pickFactory = (variant: PromptVariant): Factory => {
  const text = `${variant.id} ${variant.description}`;
  switch (variant.kind) {
    case "icon": {
      const name = pickByKeyword(KEYWORD_TO_ICON, text) ?? pickFallback(ICONS, variant.id);
      return ICONS[name];
    }
    case "background": {
      const name = pickByKeyword(KEYWORD_TO_BACKGROUND, text) ?? pickFallback(BACKGROUNDS, variant.id);
      return BACKGROUNDS[name];
    }
    case "diagram":
      return DIAGRAMS.flow;
    case "illustration": {
      const name = pickByKeyword(KEYWORD_TO_ILLUSTRATION, text) ?? "stack";
      return ILLUSTRATIONS[name] ?? ILLUSTRATIONS.stack;
    }
  }
};

// ─── Public entrypoint ─────────────────────────────────────────────────────

/**
 * Render a complete SVG (including the outer `<svg>` element, `<defs>`,
 * and the chosen factory's body) at the variant's aspect ratio. The
 * `transparentBackground` flag on the variant is honored: icons skip the
 * bg rect so PNG-converted output stays alpha-clean when the renderer
 * needs it.
 */
export function renderSvg(variant: PromptVariant): string {
  const c = paletteFor(variant.theme);
  const [aw, ah] = variant.aspectRatio.split(":").map(Number);
  const w = 1024;
  const h = Math.round((w * ah) / aw);
  const factory = pickFactory(variant);
  const body = factory(c, w, h);
  const showBg = !variant.transparentBackground;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="sc-blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
    <radialGradient id="sc-radial" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${c.accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${c.accent}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sc-shield-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.accentLight}" stop-opacity="0.7" />
      <stop offset="100%" stop-color="${c.accentDeep}" stop-opacity="0.5" />
    </linearGradient>
    <linearGradient id="sc-cloud-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.accentLight}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${c.accentDeep}" stop-opacity="0.4" />
    </linearGradient>
    <linearGradient id="sc-doc-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.accentLight}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${c.accent}" stop-opacity="1" />
    </linearGradient>
  </defs>
  ${showBg ? `<rect width="${w}" height="${h}" fill="${c.bg}" />` : ""}
  ${body}
</svg>
`;
}
