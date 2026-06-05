import "./theme/loadFonts";

import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import {
  MainVideo,
  compositionFramesFor,
  type MainVideoProps,
} from "./MainVideo";
import { ThemeGallery } from "./dev/ThemeGallery";
import { ComponentGallery } from "./dev/ComponentGallery";

/**
 * Composition duration depends on the chosen theme because each theme
 * has its own transition frame count (Apple 15f / Vercel 12f) — see
 * `MainVideo.compositionFramesFor`.
 */
const calculateMainMetadata: CalculateMetadataFunction<MainVideoProps> = async ({
  props,
}) => ({
  durationInFrames: compositionFramesFor(props.theme),
  props,
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={compositionFramesFor("vercel")}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "vercel" as const }}
        calculateMetadata={calculateMainMetadata}
      />
      <Composition
        id="ThemeGallery-Apple"
        component={ThemeGallery}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "apple" as const }}
      />
      <Composition
        id="ThemeGallery-Vercel"
        component={ThemeGallery}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "vercel" as const }}
      />
      <Composition
        id="ComponentGallery-Apple"
        component={ComponentGallery}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "apple" as const }}
      />
      <Composition
        id="ComponentGallery-Vercel"
        component={ComponentGallery}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "vercel" as const }}
      />
    </>
  );
};
