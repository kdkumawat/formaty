import { TOOL_META, detectReadings, looksEncoded, toolReadings } from "@/components/utils/readings";
import { formatLocalTime, projectInstant } from "@/lib/instant/engine";
import { generateLorem, generatePassword, generateUuidV4, regexTest, sha256Hex, type UtilTab } from "@/lib/utils/devtools";

/** One worked example: what goes in, what comes out. Both on one line. */
export interface UtilSample {
  give: string;
  get: string;
}

const line = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();
const UNIX = 1700000000;
const ZONES = [
  ["UTC", "UTC"],
  ["Asia/Kolkata", "Kolkata"],
  ["America/New_York", "New York"],
];

/**
 * What each utility returns for its own example (the one its Sample button loads in the playground), computed by
 * the same functions at build time. The three generators have nothing to paste, so they show their setting and
 * one real result, which is different on every build.
 */
export async function utilSample(id: UtilTab): Promise<UtilSample> {
  const example = TOOL_META[id].example;
  const read = () => toolReadings(id, example, looksEncoded(id, example) ? "decode" : "encode");
  switch (id) {
    case "auto":
      return { give: example, get: detectReadings(example).map((r) => r.label).join(", ") };
    case "uuid":
      return { give: "Version 4", get: generateUuidV4() };
    case "password":
      return { give: "16 characters", get: generatePassword(16) };
    case "lorem":
      return { give: "6 words", get: generateLorem(6, "words") };
    case "hash":
      return { give: example, get: `SHA-256 ${await sha256Hex(example)}` };
    case "instant":
      return {
        give: String(UNIX),
        get: ZONES.map(([zone, city]) => `${formatLocalTime(projectInstant(UNIX * 1000, zone), "24h", false)} ${city}`).join(", "),
      };
    case "regex": {
      const [pattern, text] = ["ord_\\d+", "ord_1041, ord_1042, usr_7"];
      const { matches } = regexTest(pattern, "g", text);
      return { give: `${pattern} in ${text}`, get: `${matches.length} matches: ${matches.map((m) => m.match).join(", ")}` };
    }
    case "case":
      return { give: example, get: read().slice(0, 3).map((r) => r.value).join(", ") };
    case "stats":
      return { give: line(example), get: read().filter((r) => r.label !== "Without spaces").map((r) => `${r.value} ${r.label.toLowerCase()}`).join(", ") };
    case "number":
    case "color":
      return { give: example, get: read().slice(1).map((r) => r.value).join(", ") };
    case "urlparse":
      return { give: example, get: read().filter((r) => ["Hostname", "Path", "Hash"].includes(r.label) || r.label.startsWith("Query")).map((r) => r.value).join(", ") };
    case "jwt":
      return { give: example, get: line(read().find((r) => r.label === "Payload")?.value ?? "") };
    default:
      return { give: line(example), get: line(read()[0]?.value ?? "") };
  }
}
