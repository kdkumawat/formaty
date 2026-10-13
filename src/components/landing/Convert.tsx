import { parseInput, stringifyOutput, type FormatKind } from "@/lib/formats";
import { ALL_TOOL_ROUTES } from "@/lib/seo";
import { ConvertMatrix, type Cell } from "./ConvertMatrix";
import { playHref } from "./live/playLink";
import { SectionHead } from "./PageParts";
import { SPACE, WRAP } from "./ui";

export const FORMATS: { id: FormatKind; name: string }[] = [
  { id: "json", name: "JSON" },
  { id: "xml", name: "XML" },
  { id: "yaml", name: "YAML" },
  { id: "toml", name: "TOML" },
  { id: "csv", name: "CSV" },
];

const ROUTES = new Set<string>(ALL_TOOL_ROUTES);

const RECORD = { user: "alice", email: "alice@example.com", plan: "pro", seats: 12, active: true };

/** The same record the way it tends to arrive: valid, not tidy. The formatter cells start from these. */
const UNTIDY: Record<FormatKind, string> = {
  json: '{"user":"alice","email":"alice@example.com",\n"plan":"pro","seats":12,"active":true}',
  xml: "<root><user>alice</user><email>alice@example.com</email>\n<plan>pro</plan><seats>12</seats><active>true</active></root>",
  yaml: '{user: alice, email: "alice@example.com",\n   plan: pro, seats: 12, active: true}',
  toml: 'user="alice"\nemail   = "alice@example.com"\nplan="pro"\n\n\nseats=12\nactive   =true',
  csv: "user;email;plan;seats;active\nalice;alice@example.com;pro;12;true",
};

const convert = (text: string, from: FormatKind, to: FormatKind) => stringifyOutput(parseInput(text, from), to).trimEnd();

const TIDY = Object.fromEntries(FORMATS.map((f) => [f.id, stringifyOutput(RECORD, f.id).trimEnd()])) as Record<FormatKind, string>;

/** Every cell's output is what the playground's own parsers return for the input beside it. */
const CELLS: Cell[][] = FORMATS.map((a) =>
  FORMATS.map((b) => {
    const same = a.id === b.id;
    const route = same ? `${a.id}-formatter` : `${a.id}-to-${b.id}`;
    const own = ROUTES.has(route);
    const input = same ? UNTIDY[a.id] : TIDY[a.id];
    const label = same ? `${a.name} formatter` : `${a.name} to ${b.name}`;
    return {
      label,
      // A pair without a page of its own opens the playground already set to it.
      href: own ? `/${route}` : playHref({ input, activeOperation: "format", convertToFormat: b.id }),
      open: own ? `Open the ${label}${same ? "" : " converter"}` : `Convert ${label} in the playground`,
      input,
      output: convert(input, a.id, b.id),
    };
  }),
);

/** The format matrix: five formats down, five across, every cell a link and a worked example. */
export function Convert() {
  const n = FORMATS.length;
  return (
    <section id="convert" className={`${WRAP} flex flex-col gap-[clamp(28px,3.4vw,44px)] ${SPACE}`}>
      <SectionHead title="Every format, into every other.">
        <p>
          {n} formats, {n * (n - 1)} conversions and a formatter for each. Find the format you have, then the one you need. The example is one record, converted by the parsers the playground runs.
        </p>
      </SectionHead>
      <ConvertMatrix formats={FORMATS} cells={CELLS} />
    </section>
  );
}
