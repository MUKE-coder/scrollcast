/**
 * BackgroundLayer — fills the parent with theme `color.bg` and renders an
 * optional Imagen-generated background image at low opacity behind scene
 * content. Phase 4 wires the image slot to `public/assets/{theme}/`; Phase 2
 * uses it bare.
 */

import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { useTheme } from "../theme/ThemeProvider";

export type BackgroundLayerProps = {
  /** Absolute or static URL of a generated background image. */
  image?: string;
  /** Image opacity (0..1). Default 0.3 — keeps foreground readable. */
  imageOpacity?: number;
  /** Render children above the bg + image stack. */
  children?: React.ReactNode;
};

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  image,
  imageOpacity = 0.3,
  children,
}) => {
  const t = useTheme();
  return (
    <AbsoluteFill style={{ backgroundColor: t.color.bg }}>
      {image && (
        <Img
          src={image}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: imageOpacity,
          }}
        />
      )}
      {children}
    </AbsoluteFill>
  );
};
