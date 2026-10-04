// Turns the capture manifest into a beat-aligned timeline.
// Every duration below is in beats, so swapping the music track only means
// changing BPM. No Remotion imports here: scripts/srt.ts reuses this module.
import manifest from "../public/shots/manifest.json";

export const FPS = 60;
export const BPM = 122;
export const BEAT = (FPS * 60) / BPM; // frames per beat (not a whole number: round positions, never durations)

/** public/music.mp3, measured: 122.00 BPM, first kick at 0.044s, the loud
 *  section returns on beat 65. The video starts 6 beats before that, so the
 *  breakdown sits under the opening slate and the drop lands on the first cut. */
export const MUSIC = { file: "music.mp3", startSeconds: 0.044 + (65 - 6) * (60 / BPM) };

/** Capture viewport in CSS px; pointer positions, focus points and spots use this space. */
export const VIEW = manifest.viewport;

/** Camera target: centre point in viewport px, plus zoom. */
export type Focus = { x: number; y: number; z: number };
/** Region left lit while the rest of the app is dimmed: [x, y, width, height]. */
export type Spot = [number, number, number, number];

const FULL: Focus = { x: 640, y: 320, z: 1 };
const CODE: Focus = { x: 420, y: 250, z: 1.35 };
const QUERY: Focus = { x: 520, y: 220, z: 1.3 };
const PALETTE: Focus = { x: 640, y: 190, z: 1.6 };
const TYPES_MENU: Focus = { x: 600, y: 270, z: 1.35 };
const CODE_MENU: Focus = { x: 720, y: 220, z: 1.5 };
const RESULT: Focus = { x: 1010, y: 250, z: 1.5 };
const SETTINGS: Focus = { x: 1010, y: 320, z: 1.25 };

type Spec = { b: number; t: string; f?: Focus; s?: Spot };

/** `${beat}-${label}` → beats on screen, subtitle, camera, spotlight. Shots not listed are dropped. */
const SPEC: Record<string, Spec> = {
  "paste-empty": { b: 2, t: "Start with a raw API response." },
  "paste-pasted": { b: 6, t: "Paste. It formats itself.", f: { x: 640, y: 300, z: 1.12 } },
  "paste-maximized": { b: 6, t: "Maximize the output when the input is done.", f: CODE },

  "views-tree": { b: 3, t: "Read it as a tree.", f: CODE },
  "views-graph": { b: 4, t: "Or as a graph." },
  "views-table": { b: 2, t: "Or as a table.", f: CODE },
  "views-table-orders": { b: 3, t: "Open any nested array as rows." },
  "views-copy-menu": { b: 3, t: "Copy it as Markdown, HTML, CSV or TSV.", f: { x: 1060, y: 200, z: 1.5 } },
  "views-copied-markdown": { b: 3, t: "Copy it as Markdown, HTML, CSV or TSV.", f: { x: 1000, y: 560, z: 1.4 } },

  "query-query": { b: 3, t: "Query it with JSONPath or JMESPath.", f: QUERY },
  "query-result": { b: 7, t: "Results update on every keystroke.", f: QUERY },

  "diff-lists": { b: 1, t: "Now compare two lists." },
  "diff-left": { b: 2, t: "5,000 order IDs from the API." },
  "diff-both": { b: 3, t: "4,803 from the database." },
  "diff-bucket-menu": { b: 2, t: "The summary counts what matches and what does not.", f: RESULT },
  "diff-summary": { b: 2, t: "The summary counts what matches and what does not.", f: RESULT },
  "diff-summary-fold-1": { b: 1, t: "4,615 in both. 385 missing from the database. 188 unknown to the API.", f: RESULT },
  "diff-summary-fold-2": { b: 1, t: "4,615 in both. 385 missing from the database. 188 unknown to the API.", f: RESULT },
  "diff-summary-counts": { b: 3, t: "4,615 in both. 385 missing from the database. 188 unknown to the API.", f: RESULT, s: [765, 122, 515, 96] },
  "diff-left-bucket": { b: 3, t: "Open the missing ones.", f: RESULT },

  "exports-sql-in-menu": { b: 2, t: "Export the result in 22 formats.", f: { x: 960, y: 290, z: 1.5 }, s: [826, 113, 272, 360] },
  "exports-sql-in": { b: 3, t: "A SQL IN clause.", f: RESULT },
  "exports-comma-menu": { b: 1.5, t: "Comma separated.", f: { x: 960, y: 290, z: 1.5 } },
  "exports-comma": { b: 2.5, t: "Comma separated.", f: RESULT },
  "exports-json-array-menu": { b: 1.5, t: "A JSON array.", f: { x: 960, y: 290, z: 1.5 } },
  "exports-json-array": { b: 2.5, t: "A JSON array.", f: RESULT },
  "exports-copy-menu": { b: 2.5, t: "Or copy with the quoting you need.", f: { x: 1100, y: 200, z: 1.6 }, s: [1017, 76, 224, 240] },
  "exports-copied": { b: 2.5, t: "Or copy with the quoting you need.", f: RESULT },

  "tabs-new-tab": { b: 2, t: "Open another tab. The first keeps its state.", f: { x: 300, y: 220, z: 1.5 } },
  "tabs-transform": { b: 1, t: "Open another tab. The first keeps its state." },
  "tabs-curl-pasted": { b: 2.5, t: "Paste a cURL command.", f: { x: 400, y: 220, z: 1.4 } },
  "tabs-response": { b: 4, t: "Run it. The response comes back formatted.", f: { x: 900, y: 300, z: 1.3 } },
  "tabs-fetch-menu": { b: 1, t: "Generate the same request as code.", f: CODE_MENU },
  "tabs-code-fetch": { b: 2.5, t: "JavaScript fetch.", f: { x: 900, y: 240, z: 1.4 } },
  "tabs-python-menu": { b: 0.75, t: "Python.", f: CODE_MENU },
  "tabs-code-python": { b: 1.75, t: "Python.", f: { x: 900, y: 240, z: 1.4 } },
  "tabs-go-menu": { b: 0.75, t: "Or Go.", f: CODE_MENU },
  "tabs-code-go": { b: 1.75, t: "Or Go.", f: { x: 900, y: 240, z: 1.4 } },

  "types-tab-1": { b: 1.5, t: "Back in the first tab, the payload is still there.", f: { x: 300, y: 220, z: 1.5 } },
  "types-raw": { b: 1, t: "Back in the first tab, the payload is still there." },
  "types-typescript": { b: 3, t: "TypeScript types.", f: CODE },
  "types-go-menu": { b: 1, t: "Go structs.", f: TYPES_MENU },
  "types-go": { b: 2, t: "Go structs.", f: CODE },
  "types-sql-menu": { b: 1, t: "A SQL schema with seed rows.", f: TYPES_MENU },
  "types-sql": { b: 2, t: "A SQL schema with seed rows.", f: CODE },
  "types-settings": { b: 1.5, t: "Change the SQL dialect in settings.", f: SETTINGS, s: [925, 35, 345, 562] },
  "types-settings-postgres": { b: 2, t: "Change the SQL dialect in settings.", f: { x: 1010, y: 480, z: 1.5 } },
  "types-sql-postgres": { b: 2, t: "Now it is PostgreSQL.", f: CODE },
  "types-settings-pinned": { b: 1.5, t: "Pin the actions you use to the toolbar.", f: SETTINGS },
  "types-pinned-toolbar": { b: 1.5, t: "Pin the actions you use to the toolbar.", f: { x: 560, y: 200, z: 1.5 } },

  "utils-utils-tab": { b: 2, t: "Utilities live in the same workspace." },
  "utils-jwt-decoded": { b: 6, t: "Decode a JWT.", f: { x: 700, y: 270, z: 1.25 } },
  "utils-base64": { b: 3, t: "Encode Base64.", f: { x: 700, y: 220, z: 1.3 } },
  "utils-instant": { b: 7, t: "Compare timezones on one board.", f: { x: 730, y: 330, z: 1.1 } },
};

function spec(beat: string, label: string): Spec | undefined {
  if (label.endsWith("-palette-open")) return { b: 0.5, t: "Every action is in the command palette.", f: PALETTE };
  if (/-palette-\d+$/.test(label)) return { b: 0.25, t: "Every action is in the command palette.", f: PALETTE };
  if (/^type-\d+$/.test(label)) return { b: 0.4, t: "Results update on every keystroke.", f: QUERY };
  return SPEC[`${beat}-${label}`];
}

export type Step = {
  file: string;
  from: number;
  frames: number;
  focus: Focus;
  spot: Spot | null;
  text: string;
  pointer: { x: number; y: number } | null;
  /** A real click landed just before this state. */
  click: boolean;
  /** The real keyboard shortcut that produced this state. */
  keys: { caps: string[]; hint: string } | null;
};

const SLATE_BEATS = 6;
const END_BEATS = 8;
export const SLATE_FRAMES = Math.round(SLATE_BEATS * BEAT);
export const SLATE = ["Close the other ten tabs.", "One workspace for your data."];

export type Timeline = {
  steps: Step[];
  /** Subtitle cues: consecutive steps with the same text merge into one. */
  cues: { from: number; to: number; text: string }[];
  slateFrames: number;
  endFrom: number;
  total: number;
};

/** Build a cut from the capture. only: which beats to keep; bare: no slate or end card. */
function build(only?: string[], bare = false): Timeline {
  const slateFrames = bare ? 0 : SLATE_FRAMES;
  const steps: Step[] = [];
  // Positions come from the running beat count so rounding never accumulates.
  let beats = bare ? 0 : SLATE_BEATS;
  const at = (b: number) => Math.round(b * BEAT);
  let lastPointer: Step["pointer"] = null;
  for (const shot of manifest.shots) {
    const s = spec(shot.beat, shot.label);
    if (!s || (only && !only.includes(shot.beat))) continue;
    const cursor = at(beats);
    const frames = at(beats + s.b) - cursor;
    const p = shot.pointer;
    steps.push({
      file: shot.file,
      from: cursor,
      frames,
      focus: s.f ?? FULL,
      spot: s.s ?? null,
      text: s.t,
      pointer: p,
      click: !shot.keys && !!p && (p.x !== lastPointer?.x || p.y !== lastPointer?.y),
      keys: shot.keys,
    });
    lastPointer = p;
    beats += s.b;
  }
  const cursor = at(beats);
  const cues: Timeline["cues"] = bare ? [] : [{ from: BEAT, to: SLATE_FRAMES, text: SLATE.join(" ") }];
  for (const step of steps) {
    const last = cues.at(-1);
    if (last?.text === step.text) last.to = step.from + step.frames;
    else cues.push({ from: step.from, to: step.from + step.frames, text: step.text });
  }
  return { steps, cues, slateFrames, endFrom: cursor, total: bare ? cursor : at(beats + END_BEATS) };
}

export const CUTS = {
  /** Full showcase for Product Hunt and YouTube. */
  hero: build(),
  /** Short cut for X: paste, list diff, export. */
  short: build(["paste", "diff", "exports"]),
  /** Silent loop for the landing page: list diff and export only. */
  loop: build(["diff", "exports"], true),
};
export type Cut = keyof typeof CUTS;
