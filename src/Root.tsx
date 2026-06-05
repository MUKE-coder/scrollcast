import "./theme/loadFonts";

import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { ThemeGallery } from "./dev/ThemeGallery";
import { ComponentGallery } from "./dev/ComponentGallery";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ theme: "vercel" as const }}
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
