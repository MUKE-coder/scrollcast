/**
 * ConceptScene — used for "what is X?", "why it matters", and any "How"
 * step that has neither code nor a visual idea. Layout: left column holds
 * the header + bulleted talking points (staggered reveal); right column
 * holds a single supporting icon Card.
 */

import React from "react";
import { Sparkles, Info, Lightbulb, Workflow, ShieldCheck } from "lucide-react";
import { Scene, useElementSpring } from "./Scene";
import { SceneHeader } from "./SceneHeader";
import { BodyText, Card, Icon } from "../components";
import { useTheme } from "../theme/ThemeProvider";
import type { Scene as PlanScene } from "../video-plan.schema";

const FALLBACK_ICONS = [Sparkles, Info, Lightbulb, Workflow, ShieldCheck];

export const ConceptScene: React.FC<{ scene: PlanScene }> = ({ scene }) => {
  const t = useTheme();
  // pick a fallback icon deterministically from the id
  const iconIdx = scene.id.length % FALLBACK_ICONS.length;
  const FallbackIcon = FALLBACK_ICONS[iconIdx];

  // Bullets fade+rise in sequence starting after the title.
  const bulletStartFrame = 36;
  const bulletStagger = 14;

  return (
    <Scene>
      <SceneHeader kicker={scene.kicker} title={scene.title} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          gap: t.space.xl,
          marginTop: t.space.lg,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            flex: 1.4,
            display: "flex",
            flexDirection: "column",
            gap: t.space.md,
            minWidth: 0,
          }}
        >
          {scene.bullets.map((b, i) => (
            <ConceptBullet
              key={i}
              text={b}
              delay={bulletStartFrame + i * bulletStagger}
            />
          ))}
        </div>
        <ConceptSideIcon icon={FallbackIcon} />
      </div>
    </Scene>
  );
};

const ConceptBullet: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const t = useTheme();
  const s = useElementSpring(delay, 18);
  return (
    <div
      style={{
        display: "flex",
        gap: t.space.sm,
        alignItems: "flex-start",
        opacity: s,
        transform: `translateY(${(1 - s) * 18}px)`,
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 12,
          height: 12,
          borderRadius: 999,
          marginTop: 14,
          backgroundColor: t.color.accent,
        }}
      />
      <BodyText style={{ fontSize: 30, color: t.color.textPrimary }}>{text}</BodyText>
    </div>
  );
};

const ConceptSideIcon: React.FC<{ icon: typeof Sparkles }> = ({ icon }) => {
  const s = useElementSpring(24, 22);
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: s,
        transform: `scale(${0.92 + s * 0.08})`,
      }}
    >
      <Card padding="lg" style={{ aspectRatio: "1 / 1", maxWidth: 420, width: "100%" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon icon={icon} size="2xl" color="accent" />
        </div>
      </Card>
    </div>
  );
};
