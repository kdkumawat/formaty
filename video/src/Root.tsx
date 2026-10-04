import { Composition } from "remotion";
import { Launch, Thumb } from "./Launch";
import { CUTS, FPS, type Cut } from "./timeline";

const cut = (id: string, name: Cut) => (
  <Composition
    id={id}
    component={Launch}
    defaultProps={{ cut: name }}
    durationInFrames={CUTS[name].total}
    fps={FPS}
    width={1920}
    height={1080}
  />
);

export const Root = () => (
  <>
    {cut("Launch", "hero")}
    {cut("Launch30", "short")}
    {cut("Loop", "loop")}
    <Composition id="Thumb" component={Thumb} durationInFrames={90} fps={30} width={240} height={240} />
  </>
);
