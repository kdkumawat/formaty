import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { BEAT, CUTS, FPS, MUSIC, SLATE, VIEW, type Cut, type Focus, type Timeline } from "./timeline";

// One family throughout: the product's own display face.
const font = loadFont("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

const INK = "#f2f2f3";
const GREY = "#8a8a93";
const HAIRLINE = "#26262c";
/** The product's violet. Used only for the pressed key and the click ring. */
const ACCENT = "#8f8cff";

// The capture fills the frame width; the bottom band holds subtitles and keys.
const S = 1920 / VIEW.width;
const W = 1920;
const H = VIEW.height * S;
const BAND = 120;
const STAGE = 1080 - BAND;
const MARGIN = 72;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Brand mark, same geometry and motion as the app's Logo: braces draw in, arrows swing into place. */
const AnimatedLogo = ({ size, frame, swap = 0 }: { size: number; frame: number; swap?: number }) => {
  const draw = interpolate(frame, [0, 36], [1, 0], { ...clamp, easing: ease });
  const swing = interpolate(frame, [9, 51], [0, 1], { ...clamp, easing: ease });
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" stroke={ACCENT} strokeWidth={3.5}>
      <g transform="translate(34 32) scale(1.9) translate(-32 -32)">
        {[
          "M24 18c-4 0-4 4-4 6v2c0 2-2 4-4 4 2 0 4 2 4 4v2c0 2 0 6 4 6",
          "M40 18c4 0 4 4 4 6v2c0 2 2 4 4 4-2 0-4 2-4 4v2c0 2 0 6-4 6",
        ].map((d) => (
          <path key={d} d={d} pathLength={1} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={draw} />
        ))}
        <g transform="rotate(-18 32 30)">
          <g
            style={{
              transformBox: "fill-box", transformOrigin: "center", opacity: swing,
              transform: `rotate(${(swing - 1 + swap) * 180}deg) scale(${lerp(0.4, 1, swing)})`,
            }}
          >
            <path strokeLinecap="round" d="M26 30h12" />
            <path d="M32 24l6 6-6 6" />
            <path d="M32 40l-6-6 6-6" />
          </g>
        </g>
      </g>
    </svg>
  );
};

/** The captured app: hard cuts between real states; only the camera and pointer move. */
const Screen = ({ tl: { steps: STEPS } }: { tl: Timeline }) => {
  const frame = useCurrentFrame();
  let i = 0;
  while (i < STEPS.length - 1 && STEPS[i + 1].from <= frame) i++;
  const step = STEPS[i];
  const local = frame - step.from;

  const prev: Focus = STEPS[i - 1]?.focus ?? step.focus;
  // A shortcut swaps the whole screen, so the camera cuts with it; otherwise it eases.
  const t = step.keys ? 1 : interpolate(local, [0, 20], [0, 1], { ...clamp, easing: ease });
  const z = lerp(prev.z, step.focus.z, t);
  const cx = lerp(prev.x, step.focus.x, t) * S;
  const cy = lerp(prev.y, step.focus.y, t) * S;
  const tx = Math.min(0, Math.max(W - W * z, W / 2 - cx * z));
  const ty = Math.min(0, Math.max(STAGE - H * z, STAGE / 2 - cy * z));

  // Pointer travels to where the next click will land, arriving before the cut.
  const next = STEPS[i + 1]?.pointer ?? null;
  const here = step.pointer ?? next;
  const travel = interpolate(local / step.frames, [0.3, 0.9], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pointer = here && { x: lerp(here.x, (next ?? here).x, travel) * S, y: lerp(here.y, (next ?? here).y, travel) * S };
  const ring = step.click && step.pointer ? interpolate(local, [0, 14], [0, 1], clamp) : 1;
  const dim = step.spot ? interpolate(local, [0, 10], [0, 0.62], clamp) : 0;

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: W, height: STAGE, overflow: "hidden" }}>
      <div style={{ width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>
        <Img src={staticFile(`shots/${step.file}`)} style={{ width: W, height: H, display: "block" }} />
        {step.spot && (
          <div
            style={{
              position: "absolute", left: step.spot[0] * S, top: step.spot[1] * S,
              width: step.spot[2] * S, height: step.spot[3] * S, borderRadius: 12,
              boxShadow: `0 0 0 4000px rgba(0,0,0,${dim})`,
            }}
          />
        )}
        {ring < 1 && step.pointer && (
          <div
            style={{
              position: "absolute", left: step.pointer.x * S, top: step.pointer.y * S,
              width: 44, height: 44, margin: -22, borderRadius: 22,
              border: `2px solid ${ACCENT}`, opacity: 1 - ring, transform: `scale(${0.4 + ring * 0.8})`,
            }}
          />
        )}
        {pointer && (
          <svg width={30} height={30} viewBox="0 0 24 24" style={{ position: "absolute", left: pointer.x, top: pointer.y }}>
            <path d="M3 2l7.5 18 2.4-7.1L20 10.5z" fill="#fff" stroke="#000" strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

/** Bottom band: what is happening on the left, the keys really pressed on the right. */
const Band = ({ tl: { steps: STEPS, cues: CUES } }: { tl: Timeline }) => {
  const frame = useCurrentFrame();
  const cue = CUES.find((c) => frame >= c.from && frame < c.to);
  const LEAD = 6; // keys show just before the state changes, like a real press
  const step = STEPS.findLast((s) => s.keys && frame >= s.from - LEAD);
  const local = step ? frame - (step.from - LEAD) : 0;
  const keys = step?.keys && local <= Math.max(step.frames, 3 * BEAT) + LEAD ? step.keys : null;
  const press = interpolate(local, [LEAD - 2, LEAD + 2, LEAD + 14], [0, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: BAND, background: "#000",
        borderTop: `1px solid ${HAIRLINE}`, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `0 ${MARGIN}px`, fontFamily: font,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: -0.8, color: INK }}>{cue?.text}</div>
      {keys && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 26, fontWeight: 500, color: GREY, marginRight: 14 }}>{keys.hint}</div>
          {keys.caps.map((cap) => (
            <div
              key={cap}
              style={{
                minWidth: 56, height: 56, padding: "0 16px", boxSizing: "border-box",
                display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10,
                border: `1px solid ${press > 0.5 ? ACCENT : "#3a3a42"}`, color: press > 0.5 ? ACCENT : INK,
                fontSize: 26, fontWeight: 500, transform: `translateY(${press * 3}px)`,
              }}
            >
              {cap}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Opening: type on black, each line landing on a beat. No animation. */
const Slate = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", padding: `0 ${MARGIN}px`, fontFamily: font }}>
      {frame >= BEAT && (
        <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -5, lineHeight: 1, color: INK }}>{SLATE[0]}</div>
      )}
      <div style={{ fontSize: 52, fontWeight: 500, letterSpacing: -1, color: GREY, marginTop: 36, visibility: frame >= 3 * BEAT ? "visible" : "hidden" }}>
        {SLATE[1]}
      </div>
    </AbsoluteFill>
  );
};

/** Closing: the name, what it is, the honest claims, where to go. */
const EndCard = ({ tl }: { tl: Timeline }) => {
  const frame = useCurrentFrame() - tl.endFrom;
  const show = (beat: number) => (frame >= beat * BEAT ? "visible" : "hidden") as "visible" | "hidden";
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", padding: `0 ${MARGIN}px`, fontFamily: font }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <AnimatedLogo size={132} frame={frame} />
        <div style={{ fontSize: 148, fontWeight: 700, letterSpacing: -6, lineHeight: 1, color: INK }}>Formaty</div>
      </div>
      <div style={{ fontSize: 52, fontWeight: 500, letterSpacing: -1, color: INK, marginTop: 40, visibility: show(1) }}>
        The developer data workspace.
      </div>
      <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: -0.5, color: GREY, marginTop: 16, visibility: show(2) }}>
        Runs in your browser. No signup. Free and open source.
      </div>
      <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1, color: INK, marginTop: 64, visibility: show(3) }}>
        formaty.dev
      </div>
    </AbsoluteFill>
  );
};

/** Music from the measured start point, plus a quiet tick for each real key press and click. */
const Sound = ({ tl }: { tl: Timeline }) => {
  const frame = useCurrentFrame();
  const volume = Math.min(
    interpolate(frame, [0, 12], [0, 0.85], clamp),
    interpolate(frame, [tl.total - 60, tl.total - 1], [0.85, 0], clamp),
  );
  return (
    <>
      <Audio src={staticFile(MUSIC.file)} trimBefore={Math.round(MUSIC.startSeconds * FPS)} volume={volume} />
      {tl.steps.filter((s) => s.keys || s.click).map((s) => (
        <Sequence key={s.from} from={s.from} durationInFrames={FPS / 2}>
          <Audio
            src={s.keys ? "https://remotion.media/switch.wav" : "https://remotion.media/mouse-click.wav"}
            volume={s.keys ? 0.3 : 0.15}
          />
        </Sequence>
      ))}
    </>
  );
};

export const Launch = ({ cut }: { cut: Cut }) => {
  const frame = useCurrentFrame();
  const tl = CUTS[cut];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {cut !== "loop" && <Sound tl={tl} />}
      {frame < tl.slateFrames ? (
        <Slate />
      ) : frame >= tl.endFrom ? (
        <EndCard tl={tl} />
      ) : (
        <>
          <Screen tl={tl} />
          <Band tl={tl} />
        </>
      )}
    </AbsoluteFill>
  );
};

/** Square mark for the Product Hunt thumbnail. Starts settled (the first frame
 *  is what shows before the GIF plays), then the arrows swap once per loop. */
export const Thumb = () => {
  const swap = interpolate(useCurrentFrame(), [30, 60], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center" }}>
      <AnimatedLogo size={190} frame={999} swap={swap} />
    </AbsoluteFill>
  );
};
