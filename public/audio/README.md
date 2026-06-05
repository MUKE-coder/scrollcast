# Audio slot

ScrollCast renders without any audio by default. There are two slots you can fill:

## 1. Background music

Drop a music file (`.mp3` / `.m4a` / `.wav`) into this folder, then set the
`BACKGROUND_MUSIC_TRACK` constant in [`src/MainVideo.tsx`](../../src/MainVideo.tsx)
to the file path (relative to `public/`), e.g.:

```ts
const BACKGROUND_MUSIC_TRACK: string | null = "audio/ambient-loop.mp3";
```

The track is ducked to `MUSIC_VOLUME` (default `0.12`) and fades in/out around
the intro and outro so it never clips. Adjust `MUSIC_VOLUME` to taste.

If the track is shorter than the composition (default ~8 min), use a longer
file or loop it via your DAW first — ScrollCast does not loop audio
automatically.

## 2. Voiceover

ScrollCast does **not** generate AI voiceover. After rendering the MP4, layer
your own VO track in any video editor (DaVinci Resolve, Premiere, FFmpeg, etc.)
on top of the rendered video. The scene `narration` strings in
`src/video-plan.json` are designed to be the spoken script.

If you want VO inside Remotion (advanced), add a second `<Audio>` element
inside `MainVideo.tsx` pointed at your VO file and lower `MUSIC_VOLUME` further
so it doesn't compete.

## Why no audio is included in this repo

Background music is taste-dependent and frequently has licensing constraints
that aren't compatible with redistributing the repo. The slot exists so you
can drop in your licensed music without touching scene code.
