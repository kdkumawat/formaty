# Launch video

Remotion project that renders the Formaty launch video from screenshots of the real app.

```bash
bun install
cd .. && bun run build && cd video   # capture reads the static export in ../out
bun run capture                      # Playwright drives the app, writes public/shots/
bun run render                       # out/launch-1080p60.mp4 (hero)
bun run render:short                 # out/launch-30s.mp4
bun run render:loop                  # out/landing-loop.mp4 (silent)
bun run srt                          # out/launch.srt
```

`SCALE=1 bun run capture` gives fast draft screenshots; the default is 3 (3840x2160).

## Music

`public/music.mp3` is not in the repository. The track is "Minimal Techno Background Pulse" by MKGomez from Pixabay, whose licence does not allow redistributing the file on its own. Download it and save it under that name before rendering. Tempo and start offset are set in `src/timeline.ts` (`BPM`, `MUSIC`).

Rendering needs a network connection: the key and click sounds load from `remotion.media`.
