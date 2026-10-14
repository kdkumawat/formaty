import type { ReactNode } from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsToc, type TocItem } from "@/components/docs/DocsToc";
import { H3, Kbd, P, Section, Steps, Table, Terms, Ui } from "@/components/docs/parts";
import { FaqList, Footer, PageHero, WRAP } from "@/components/landing";
import { GROUPS } from "@/components/utils/readings";
import { utilLabel } from "@/components/landing/utilLinks";
import { SHORTCUT_GROUPS, displayShortcut } from "@/lib/shortcuts";

const TOC: TocItem[] = [
  { id: "start", label: "Quick start" },
  { id: "formats", label: "Formats" },
  { id: "tabs", label: "Tabs" },
  { id: "transform", label: "Transform" },
  { id: "compare", label: "Compare" },
  { id: "utils", label: "Utils" },
  { id: "palette", label: "Search every tool" },
  { id: "share", label: "Share" },
  { id: "settings", label: "Settings and status bar" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "privacy", label: "Privacy" },
  { id: "faq", label: "Questions" },
];

const FAQ = [
  {
    q: "What is the difference between Transform and Compare?",
    a: "Transform works on one document: the input is on the left and the output on the right. Compare takes two lists, two documents, or one list, and shows what they share and where they differ.",
  },
  {
    q: "Does my data leave the device?",
    a: "Not while you format, convert, compare, query or generate. The only actions that send your content are the Share dialog's Short link, an explicit cURL Send request, and a feedback message you submit. The Privacy section lists every case.",
  },
  {
    q: "Can I use Formaty offline?",
    a: "After your first visit a service worker keeps the app files in your browser, so the playground can load without a connection. Anything that needs a server, such as a short link or a cURL request, still needs one.",
  },
  {
    q: "Where are my tabs saved?",
    a: "In your browser's local storage, on this device only. Settings has a Clear saved data button that removes saved sessions, settings and offline data, then reloads.",
  },
  {
    q: "How do I report a bug?",
    a: "Use Feedback in the status bar of the playground, or open an issue on GitHub with the input, the output you expected and the output you got.",
  },
];

const mono = (s: string) => <code className="font-mono text-[15px]">{s}</code>;

export default function DocsPage() {
  return (
    <div className="bg-[var(--workspace-background)]">
      <PageHero
        crumbs={[{ label: "Formaty", href: "/" }, { label: "Docs" }]}
        title="Docs"
        intro="How the Formaty playground works, with the exact names you see on screen."
        action={{ href: "/playground", label: "Open the playground" }}
        small
      />

      <div className="text-[var(--workspace-text)]">
        <div className={`${WRAP} grid gap-x-16 gap-y-8 py-[clamp(32px,5vw,64px)] lg:grid-cols-[200px_minmax(0,1fr)]`}>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="On this page" className="hidden lg:block">
              <DocsToc items={TOC} />
            </nav>
            <details className="border-b border-[var(--workspace-border)] pb-3 lg:hidden">
              <summary className="cursor-pointer py-2 text-[17px] font-semibold">On this page</summary>
              <nav aria-label="On this page (list)">
                <DocsToc items={TOC} />
              </nav>
            </details>
          </aside>

          <main id="main" className="flex max-w-[70ch] min-w-0 flex-col gap-12">
            <Section id="start" title="Quick start">
              <Steps>
                <>Open the <Link href="/playground" className="underline underline-offset-2">playground</Link>. One row at the top holds your tabs, <Ui>Search every tool</Ui>, <Ui>Share</Ui>, help and settings.</>
                <>Paste data into <Ui>Input</Ui>. The format is detected and shown next to <Ui>Read as</Ui>, for example <Ui>Auto: JSON</Ui>.</>
                <>Pick what you want in the output pane: <Ui>JSON</Ui>, <Ui>YAML</Ui>, <Ui>CSV</Ui>, <Ui>SQL</Ui>, or <Ui>More</Ui> for everything else.</>
                <>Press <Ui>Copy</Ui>, or the download button, or <Ui>Move to input</Ui> to keep working on the result.</>
              </Steps>
              <P>
                To compare or to use a utility, press <Ui>+</Ui> in the tab row and choose the tool. See <a href="#tabs" className="underline underline-offset-2">Tabs</a>.
              </P>
            </Section>

            <Section id="formats" title="Formats">
              <P>The input is read as JSON, XML, YAML, TOML, CSV or cURL. Formaty detects which one you pasted. To force one, open <Ui>Read as</Ui> and pick it; <Ui>Detect for me</Ui> turns detection back on.</P>
              <Terms
                items={[
                  ["JSON, XML, YAML, TOML", "Convert between any of them. The output chips and the More menu choose the target."],
                  ["CSV", "Read as an array of objects. The command palette has CSV delimiter entries for comma, tab, semicolon and pipe."],
                  ["cURL", <>A pasted curl command is parsed and shown as JSON. <Ui>Send request</Ui> appears in the input header and runs it. <Ui>More</Ui> lists <Ui>Code from this cURL</Ui> for client code.</>],
                ]}
              />
            </Section>

            <Section id="tabs" title="Tabs">
              <P>The top row is a tab bar. Every tab is one of three kinds: Transform, Compare or Utils. Each keeps its own input, output and settings.</P>
              <Terms
                items={[
                  ["Naming", <>Tabs name themselves from what they do: {mono("JSON to SQL")}, {mono("Format JSON")}, {mono("Compare lists")}, {mono("UUID")}. Repeats get a number, such as {mono("JSON to YAML 2")}.</>],
                  ["Rename", <>Double-click a tab, type a name and press Enter. Saving an empty name returns it to the automatic name. Esc cancels.</>],
                  ["New tab", <>The <Ui>+</Ui> button lists every tool in three groups, Transform, Compare and Utils. The last one you used in each group has a check.</>],
                  ["Close", <>Use the x on the tab, or middle-click it. <Ui>Reopen closed tab</Ui> in the + menu brings back the last closed tab and shows its name.</>],
                  ["Keyboard", <><Kbd>Alt N</Kbd> opens a new tab and <Kbd>Alt W</Kbd> closes the current one, when there is more than one.</>],
                ]}
              />
            </Section>

            <Section id="transform" title="Transform">
              <H3>Input pane</H3>
              <Terms
                items={[
                  ["Read as", "Shows the detected format and lets you override it."],
                  ["Wrap long lines", "Toggle in the input header. The same switch is in Settings."],
                  ["Tidy", "Rewrites the input in its own format, neatly indented. Available when the input is valid and is not cURL."],
                  ["Clear", "Empties the input. Shown once there is input."],
                  ["Hide input", <>The arrow at the right of the input header collapses the pane so the output gets the full width. A <Ui>Show input</Ui> button brings it back. <Kbd>Alt M</Kbd> does the same for the output pane.</>],
                  ["Error strip", <>When the input does not parse, a message appears under the editor with <Ui>Go to line</Ui>.</>],
                ]}
              />

              <H3>Output pane</H3>
              <P>
                The header starts with output chips: <Ui>JSON</Ui>, <Ui>YAML</Ui>, <Ui>CSV</Ui> and <Ui>SQL</Ui>. After them come two slots that fill with outputs you picked recently; they start as <Ui>TypeScript</Ui> and <Ui>Zod</Ui>. On a narrow pane the two slots fold into the menu.
              </P>
              <P>
                <Ui>More</Ui> opens the rest: XML and TOML under <Ui>Formats</Ui>; TypeScript, Zod, Java, C#, Python, Pydantic, Go, Protobuf, Kotlin, Swift and Rust under <Ui>Types</Ui>; and <Ui>Schemas and more</Ui> with JSON Schema, OpenAPI spec, <Ui>Validate against a schema</Ui>, Flatten, Unflatten and Minify.
              </P>
              <CodeBlock
                language="json"
                label="Input"
                code={`{ "id": 1, "name": "Ada", "tags": ["math", "cs"] }`}
              />
              <CodeBlock
                language="ts"
                label="TypeScript output"
                code={`export interface JsonData {
  id: number;
  name: string;
  tags: string[];
}`}
              />

              <H3>Views</H3>
              <P>
                The switch at the right of the output header changes how the same result is shown: <Ui>Text</Ui>, <Ui>Table</Ui>, <Ui>Tree</Ui>, <Ui>Graph</Ui> and <Ui>Query</Ui>. Everything except Text needs output that is valid data. Query runs a JSONPath or JMESPath expression against the output.
              </P>

              <H3>Options, copy and download</H3>
              <Terms
                items={[
                  ["Options", <>For data outputs: <Ui>Sort keys</Ui>, <Ui>Drop empty values</Ui>, <Ui>Quotes</Ui> and, for JSON, <Ui>Indent</Ui>. For SQL: <Ui>Table name</Ui> and <Ui>SQL dialect</Ui> (SQLite, PostgreSQL, MySQL). For types: <Ui>Type name</Ui>.</>],
                  ["Move to input", "Replaces the input with the current output, so you can chain conversions."],
                  ["Download", "Saves the output as a file with the matching extension."],
                  ["Copy", "The amber button copies the output as shown."],
                  ["Copy as", <>The chevron next to Copy opens <Ui>Copy as</Ui>: Base64, Escaped string, URL-encoded and Data URI. In Table view it offers Markdown table, HTML table, CSV and TSV. In Graph view it copies an image.</>],
                ]}
              />
              <P>
                <Ui>Live</Ui> in the status bar keeps the output in step with every keystroke. Turn it off for very large inputs and press <Kbd>Ctrl Enter</Kbd> to run once.
              </P>
            </Section>

            <Section id="compare" title="Compare">
              <P>
                A Compare tab has a switch with three modes: <Ui>One list</Ui>, <Ui>Two lists</Ui> and <Ui>Two documents</Ui>. Open one from the + menu or from <Ui>Search every tool</Ui>.
              </P>
              <H3>Two lists</H3>
              <Steps>
                <>Paste the first list into <Ui>List A</Ui> and the second into <Ui>List B</Ui>. Click a name to rename it. <Ui>Use sample lists</Ui> fills both, and <Ui>Swap A and B</Ui> exchanges them.</>
                <>Set <Ui>Split by</Ui> if the automatic choice is wrong: Auto, Comma, Semicolon, Pipe, Whitespace or JSON array. <Ui>Options</Ui> has Trim whitespace, Skip empty, Ignore case, Strip quotes, Normalize numbers and Auto-clean on paste.</>
                <>Choose a result: <Ui>Only in A</Ui> (purple), <Ui>In both</Ui>, <Ui>Only in B</Ui> (teal), <Ui>In one only</Ui>, <Ui>All merged</Ui>, <Ui>Repeated</Ui> or <Ui>Summary</Ui>.</>
                <>Pick an export format and copy or download. Formats include Newline separated, Comma + space, SQL IN, SQL NOT IN, SQL VALUES rows, JSON array, CSV quoted, Markdown table and Go slice; <Ui>More</Ui> lists the others.</>
              </Steps>
              <P>
                When both sides are CSV, <Ui>Match rows by column</Ui> appears so rows are compared by the column you choose.
              </P>
              <H3>One list</H3>
              <P>Paste a single list to see <Ui>Unique in order</Ui>, <Ui>Unique A to Z</Ui> and <Ui>Repeated</Ui>, with the same export formats.</P>
              <H3>Two documents</H3>
              <P>
                Paste two documents and read the differences as <Ui>Side by side</Ui> or <Ui>Inline</Ui>; <Ui>By field</Ui> is offered when the content is structured data. <Ui>Ignore whitespace</Ui> hides spacing-only changes, the arrows step through changes, and the counts above the diff show how many lines changed or exist only in A or B.
              </P>
            </Section>

            <Section id="utils" title="Utils">
              <P>
                A Utils tab shows a tool list on the left and the tool on the right. Type in <Ui>Find a tool</Ui> to filter the list. On a narrow screen the list becomes a <Ui>Tool</Ui> menu.
              </P>
              <Terms
                items={[
                  ["Detect anything", <>Paste anything and see every way it can be read, each with its own Copy. Where a reading belongs to another tool, <Ui>Open in</Ui> that tool carries the text over.</>],
                  ...GROUPS.filter((g) => g.name).map((g): [string, ReactNode] => [
                    g.name,
                    <>
                      {g.tools.map(utilLabel).join(", ")}.
                      {g.name === "Time" && <> Time zone converter also has its own page at <Link href="/utils/instant" className="underline underline-offset-2">/utils/instant</Link>.</>}
                    </>,
                  ]),
                ]}
              />
            </Section>

            <Section id="palette" title="Search every tool">
              <P>
                Press <Kbd>Ctrl K</Kbd> (<Kbd>Cmd K</Kbd> on Mac), or click <Ui>Search every tool</Ui> in the top row. <Kbd>Cmd Shift P</Kbd> also opens it.
              </P>
              <P>
                The list covers every output (<Ui>Convert to YAML</Ui>, <Ui>Generate SQL</Ui>, <Ui>Generate Go types</Ui>), every Compare mode and every Utils tool, plus workspace actions such as import a file, paste, download, undo, zoom, tab management, theme and the tour. Choosing a tool of the same kind as the current tab switches that tab in place. Choosing another kind opens a new tab.
              </P>
            </Section>

            <Section id="share" title="Share">
              <P>
                <Ui>Share</Ui> in the top row (or <Kbd>Ctrl Shift E</Kbd>) opens a dialog with two ways to hand someone your work. When you have more than one tab you first choose <Ui>This tab</Ui> or all of them (the second button reads, for example, <Ui>All 3 tabs</Ui>).
              </P>
              <Table
                head={["Option", "What happens"]}
                rows={[
                  [<Ui key="a">Link that carries the data</Ui>, "Nothing is uploaded. The content is packed into the link itself, after the # sign, so the link is long. The dialog shows its length and disables Copy link when it is too large."],
                  [<Ui key="b">Short link</Ui>, <>Press <Ui>Upload and create short link</Ui>. This tab or all tabs are uploaded to Formaty&apos;s server and you get a link ending in {mono("/playground?id=")}. <Ui>Delete from server</Ui> removes the upload.</>],
                ]}
              />
              <P>Opening either kind of link restores the tabs in the playground.</P>
            </Section>

            <Section id="settings" title="Settings and status bar">
              <P>
                The sliders button at the right of the top row opens <Ui>Settings</Ui>. Theme lives only here.
              </P>
              <Terms
                items={[
                  ["Theme", "System, Light or Dark."],
                  ["Editor", "Font size from 10 to 24, and Wrap long lines."],
                  ["Transform", "Live transform, Format on paste, Indent width from 0 to 10."],
                  ["Instant", "Days shown, Time format and Show seconds. Shown only while the Time zone converter is open."],
                  ["Reset settings", "Restores the defaults."],
                  ["Clear saved data", "Press twice. Removes saved sessions, settings and offline data, then reloads."],
                ]}
              />
              <P>
                The question-mark button opens help: keyboard shortcuts, the tour, this documentation and GitHub.
              </P>
              <P>
                The status bar runs along the bottom. On the left, <Ui>Nothing leaves this device</Ui> links to the Privacy section, followed by details about the current tab. On the right are <Ui>Live</Ui> (a switch), the indent width (click to cycle it), <Ui>Shortcuts</Ui> and <Ui>Feedback</Ui>.
              </P>
            </Section>

            <Section id="shortcuts" title="Shortcuts">
              <P>The same list opens in the playground with <Kbd>?</Kbd> or <Kbd>Ctrl /</Kbd>.</P>
              {SHORTCUT_GROUPS.map((g) => (
                <div key={g.title} className="flex flex-col gap-2">
                  <H3>{g.title}</H3>
                  <Table
                    head={["Action", "Windows and Linux", "Mac"]}
                    rows={g.items.map((it) => [it.label, <Kbd key="pc">{displayShortcut(it.keys)}</Kbd>, <Kbd key="mac">{it.keys}</Kbd>])}
                  />
                </div>
              ))}
            </Section>

            <Section id="privacy" title="Privacy">
              <P>
                Formaty has no server that parses your data. The editor hands text to a Web Worker in the page and the worker hands the result back. Open DevTools, switch to Network, format a large file, and the request list stays empty.
              </P>
              <H3>Every time Formaty uses the network</H3>
              <Table
                head={["When you", "What is sent"]}
                rows={[
                  ["Format, convert, compare, query, generate, or use a utility", <strong key="n" className="font-semibold text-[var(--workspace-text)]">Nothing</strong>],
                  ["Open the site", <>A request for the site&apos;s static files. The app also fetches {mono("/version.json")} from the same site to tell you when a new version is out. No content.</>],
                  ["Copy a Link that carries the data", "Nothing. The data sits after the # in the link, which browsers do not send to servers."],
                  ["Create a Short link", "The tab or tabs you chose, uploaded to Formaty. Delete from server removes them."],
                  ["Press Send request on a cURL input", "That request, from your browser to the URL you typed. The target server decides whether to allow it."],
                  ["Send Feedback", "What you write, an optional email, and the items listed in the dialog, which you can remove first."],
                  ["Press Accept on the analytics notice", "Anonymous usage events such as which operation ran. Never editor content. Before you accept, Formaty sends no events. If you decline, nothing changes."],
                ]}
              />
              <P>
                Your tabs and settings are stored in your browser&apos;s local storage. They stay on this device until you clear them with <Ui>Clear saved data</Ui>. The worker source is on{" "}
                <a href="https://github.com/kdkumawat/formaty/blob/main/src/workers/json.worker.ts" className="underline underline-offset-2">GitHub</a>.
              </P>
            </Section>

            <Section id="faq" title="Questions">
              <FaqList items={FAQ} />
              <div>
                <Link
                  href="/playground"
                  className="inline-flex min-h-11 items-center text-[17px] font-semibold underline underline-offset-4"
                >
                  Try it in the playground
                </Link>
              </div>
            </Section>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
