import "./theme/loadFonts";

import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { MainVideo, VIDEO_PLAN, type MainVideoProps } from "./MainVideo";
import { ThemeGallery } from "./dev/ThemeGallery";
import { ComponentGallery } from "./dev/ComponentGallery";

const calculateMainMetadata: CalculateMetadataFunction<MainVideoProps> = async ({
  props,
}) => ({
  durationInFrames: VIDEO_PLAN.meta.totalDurationFrames,
  props,
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={VIDEO_PLAN.meta.totalDurationFrames}
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
