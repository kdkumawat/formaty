"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  XMarkIcon,
  ListBulletIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  ArrowsRightLeftIcon,
  CodeBracketIcon,
  SparklesIcon,
  CommandLineIcon,
  ShareIcon,
  ShieldCheckIcon,
  RectangleStackIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Star, Menu } from "lucide-react";
import { AnimatedMagnifierIcon, useIconAnimation } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock, CodeSample } from "@/components/CodeBlock";
import { cn } from "@/lib/utils";

/* ─── Platform detection ───────────────────────────────── */
function useIsMac(): boolean {
  return useMemo(() => {
    if (typeof navigator === "undefined") return true;
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  }, []);
}

/* ─── Nav sections ─────────────────────────────────────── */
const NAV_SECTIONS = [
  { id: "formats",   label: "Formats" },
  { id: "workspace", label: "Workspace" },
  { id: "multi-tab", label: "Multi-Tab" },
  { id: "actions",   label: "Actions" },
  { id: "convert",   label: "Convert" },
  { id: "views",     label: "Views" },
  { id: "types",     label: "Type Gen" },
  { id: "query",     label: "Query" },
  { id: "options",   label: "Options" },
  { id: "diff",      label: "Diff" },
  { id: "utils",     label: "Utils" },
  { id: "palette",   label: "Command Palette" },
  { id: "copy-as",   label: "Copy As" },
  { id: "history",   label: "History" },
  { id: "share",     label: "Share & Export" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "pinning",   label: "Pinning" },
  { id: "privacy",   label: "Privacy" },
];

/* ─── Categories - group sections under eyebrows ───────── */
const CATEGORIES = [
  {
    id: "getting-started",
    label: "Getting started",
    intro: "Two minutes to your first transformed document. Pick a format, paste, get output.",
    sectionIds: ["formats", "workspace"],
  },
  {
    id: "transform",
    label: "Transform",
    intro: "Work with a single document: parse, convert, view as a tree or table, generate types, query, and configure options.",
    sectionIds: ["multi-tab", "actions", "convert", "views", "types", "query", "options"],
  },
  {
    id: "compare",
    label: "Compare",
    intro: "Diff two documents, two lists, or analyze one list. Export results as SQL, JSON, CSV, and more.",
    sectionIds: ["diff"],
  },
  {
    id: "workflow",
    label: "Workflow",
    intro: "Tools for everyday work: 18 developer utils, the command palette, copy-as, history, share, shortcuts, and pinning.",
    sectionIds: ["utils", "palette", "copy-as", "history", "share", "shortcuts", "pinning"],
  },
  {
    id: "reference",
    label: "Reference",
    intro: "Privacy guarantees and how your data is handled.",
    sectionIds: ["privacy"],
  },
] as const;

/* ─── Search ───────────────────────────────────────────── */
const SEARCH_SUGGESTIONS = ["json", "diff", "export", "shortcuts", "type", "history", "share", "yaml", "csv"];

/* ─── Quick start cards ───────────────────────────────── */
const QUICK_START = [
  {
    icon: BoltIcon,
    title: "Format JSON",
    desc: "Beautify, minify, sort keys, remove empties.",
    href: "/playground?tool=json-formatter",
    badge: "30 sec",
  },
  {
    icon: ArrowsRightLeftIcon,
    title: "Convert formats",
    desc: "JSON ⇄ YAML ⇄ TOML ⇄ XML ⇄ CSV in one click.",
    href: "/playground?tool=json-to-yaml",
    badge: "20 sec",
  },
  {
    icon: CodeBracketIcon,
    title: "Diff two files",
    desc: "Side-by-side document diff with path navigation.",
    href: "/playground?tool=json-diff",
    badge: "45 sec",
  },
  {
    icon: SparklesIcon,
    title: "Generate types",
    desc: "TypeScript, Go, Python, Zod, SQL, Protobuf.",
    href: "/playground?tool=json-to-typescript",
    badge: "30 sec",
  },
];

/* ─── Helpers ──────────────────────────────────────────── */
function Kbd({ children, isMac }: { children: React.ReactNode; isMac: boolean }) {
  return (
    <kbd className="inline-flex items-center rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--workspace-text)]">
      {children}
    </kbd>
  );
}

const TAG_PRESETS = {
  default: "border-[var(--workspace-border)] bg-[var(--workspace-background)] text-[var(--workspace-text-muted)]",
  amber:   "text-amber-600 border-amber-500/30 bg-amber-500/8",
  red:     "text-red-600 border-red-500/30 bg-red-500/8",
  lime:    "text-lime-700 border-lime-600/30 bg-lime-600/8",
  teal:    "text-teal-600 border-teal-500/30 bg-teal-500/8",
  blue:    "text-blue-600 border-blue-500/30 bg-blue-500/8",
  sky:     "text-sky-600 border-sky-500/30 bg-sky-500/8",
} as const;
type TagPreset = keyof typeof TAG_PRESETS;

function Tag({ children, color = "default" }: { children: React.ReactNode; color?: TagPreset }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium", TAG_PRESETS[color])}>
      {children}
    </span>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[var(--workspace-background)] px-1 font-mono text-xs">
      {children}
    </code>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group mb-2 flex scroll-mt-[72px] items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--workspace-text)]">
      <a
        href={`#${id}`}
        aria-label={`Link to section: ${typeof children === "string" ? children : id}`}
        className="text-base text-primary opacity-30 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
      >
        #
      </a>
      {children}
    </h2>
  );
}

function SectionSummary({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[var(--workspace-text-muted)]">{children}</p>
  );
}

function H3({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("mb-3 mt-8 text-sm font-bold uppercase tracking-wider text-[var(--workspace-text)]", className)}>
      {children}
    </h3>
  );
}

function DefList({ items }: { items: { label: React.ReactNode; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-[var(--workspace-border)]/50 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
      {items.map((it, i) => (
        <div key={i} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4 sm:px-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">{it.label}</dt>
          <dd className="text-sm leading-relaxed text-[var(--workspace-text)]">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--workspace-border)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]">
        {cols.map((c) => (
          <th key={c} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <tr className="border-b border-[var(--workspace-border)]/60">
      <td className="px-4 py-2.5 align-top font-semibold text-[var(--workspace-text)] whitespace-nowrap">{label}</td>
      <td className="px-4 py-2.5 text-sm text-[var(--workspace-text-muted)] leading-relaxed">{value}</td>
    </tr>
  );
}

function CategoryHeader({ id, label, intro }: { id: string; label: string; intro: string }) {
  return (
    <div id={id} className="mb-8 mt-16 scroll-mt-[72px] border-b border-[var(--workspace-border)] pb-4 first:mt-0">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{label}</p>
      <p className="max-w-2xl text-sm leading-relaxed text-[var(--workspace-text-muted)]">{intro}</p>
    </div>
  );
}

/* ─── Section wrapper: hides when filtered out ── */
function Section({
  id,
  query,
  keywords,
  children,
}: {
  id: string;
  query: string;
  keywords: string[];
  children: React.ReactNode;
}) {
  const q = query.toLowerCase().trim();
  if (q && !keywords.some((k) => k.toLowerCase().includes(q))) return null;
  return (
    <section id={id} className="mb-12 scroll-mt-[72px]">
      {children}
    </section>
  );
}

/* ─── Mobile TOC drawer ─────────────────────────────── */
function MobileToc({
  open,
  onOpenChange,
  activeId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeId: string;
  onSelect: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-docs-toc
        className="left-0 top-0 max-h-[85dvh] w-[85vw] max-w-sm translate-x-0 translate-y-0 rounded-r-xl rounded-l-none p-0 sm:rounded-xl sm:left-[50%] sm:top-[50%] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%]"
      >
        <DialogHeader className="border-b border-[var(--workspace-border)] px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ListBulletIcon className="h-4 w-4" />
            Contents
          </DialogTitle>
        </DialogHeader>
        <nav className="max-h-[calc(85dvh-60px)] overflow-y-auto px-2 py-2">
          <ul className="space-y-0.5">
            {NAV_SECTIONS.map(({ id, label }) => {
              const active = activeId === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={onSelect}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-[var(--workspace-text-muted)] hover:bg-primary/8 hover:text-primary",
                    )}
                  >
                    {active && <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Back-to-top button ─────────────────────────────── */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "no-print fixed bottom-5 right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)]/90 text-[var(--workspace-text-muted)] shadow-lg backdrop-blur transition-all hover:text-primary focus-visible:outline-none",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ArrowUpIcon className="h-4 w-4" />
    </button>
  );
}

/* ─── Edit-on-GitHub link ───────────────────────────── */
const GITHUB_EDIT_BASE = "https://github.com/kdkumawat/formaty/edit/main/src/app/docs/page.tsx";

function EditLink({ id }: { id: string }) {
  return (
    <a
      href={`${GITHUB_EDIT_BASE}#${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print ml-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--workspace-text-muted)] opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"
      aria-label="Edit this section on GitHub"
    >
      <PencilSquareIcon className="h-3.5 w-3.5" />
      Edit
    </a>
  );
}

function SectionHeader({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="group mb-4 flex items-center justify-between">
      <SectionTitle id={id}>{children}</SectionTitle>
      <EditLink id={id} />
    </div>
  );
}

/* ─── Quick start grid ─────────────────────────────── */
function QuickStartGrid() {
  return (
    <div className="mb-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {QUICK_START.map(({ icon: Icon, title, desc, href, badge }) => (
        <Link
          key={title}
          href={href}
          className="group flex flex-col gap-3 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--workspace-text-muted)]">
              {badge}
            </span>
          </div>
          <div>
            <p className="font-semibold text-[var(--workspace-text)] group-hover:text-primary">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Open <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─── Recipe card ──────────────────────────────────── */
function RecipeCard({
  title,
  desc,
  input,
  output,
  inputLabel,
  outputLabel,
  language,
  href,
}: {
  title: string;
  desc: string;
  input: string;
  output: string;
  inputLabel?: string;
  outputLabel?: string;
  language?: "json" | "yaml" | "ts" | "bash" | "csv";
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-[var(--workspace-text)]">{title}</h4>
          <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">{desc}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 py-1 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:border-primary/40 hover:text-primary"
        >
          Open →
        </Link>
      </div>
      <CodeSample
        input={input}
        output={output}
        inputLabel={inputLabel}
        outputLabel={outputLabel}
        language={language}
      />
    </div>
  );
}

/* ─── FAQ item ─────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] [&[open]]:border-primary/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[var(--workspace-text)] transition-colors hover:text-primary">
        <span>{q}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)] transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-4 text-sm leading-relaxed text-[var(--workspace-text-muted)]">{a}</div>
    </details>
  );
}

/* ─── Prev/Next nav ───────────────────────────────── */
function PrevNext() {
  return (
    <div className="mt-16 grid gap-3 border-t border-[var(--workspace-border)] pt-8 sm:grid-cols-2">
      <Link
        href="/playground?tool=json-formatter"
        className="group flex items-center gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
      >
        <ArrowLeftIcon className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)] group-hover:text-primary" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">Try it</p>
          <p className="truncate text-sm font-semibold text-[var(--workspace-text)] group-hover:text-primary">JSON Formatter</p>
        </div>
      </Link>
      <Link
        href="/playground?tool=json-diff"
        className="group flex items-center justify-end gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 text-right transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">Next up</p>
          <p className="truncate text-sm font-semibold text-[var(--workspace-text)] group-hover:text-primary">Compare two documents</p>
        </div>
        <ArrowRightIcon className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)] group-hover:text-primary" />
      </Link>
    </div>
  );
}

/* ─── Feedback widget ─────────────────────────────── */
function FeedbackWidget() {
  const [vote, setVote] = useState<"yes" | "no" | null>(null);
  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6 text-center">
      {vote === null ? (
        <>
          <p className="text-sm font-semibold text-[var(--workspace-text)]">Was this page helpful?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVote("yes")}
              className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1.5 text-sm font-medium text-[var(--workspace-text)] hover:border-emerald-500/40 hover:text-emerald-600"
            >
              Yes 👍
            </button>
            <button
              type="button"
              onClick={() => setVote("no")}
              className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1.5 text-sm font-medium text-[var(--workspace-text)] hover:border-amber-500/40 hover:text-amber-600"
            >
              No 👎
            </button>
          </div>
          <a
            href="https://github.com/kdkumawat/formaty/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--workspace-text-muted)] underline-offset-2 hover:text-primary hover:underline"
          >
            Or open an issue on GitHub →
          </a>
        </>
      ) : vote === "yes" ? (
        <p className="text-sm text-emerald-600">Thanks! Have fun building with formaty.</p>
      ) : (
        <div className="text-sm text-[var(--workspace-text-muted)]">
          <p>Sorry about that. Tell us what was missing:</p>
          <a
            href="https://github.com/kdkumawat/formaty/issues/new?template=docs.md&title=Docs+feedback"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:scale-[1.02]"
          >
            Open a docs issue →
          </a>
        </div>
      )}
    </div>
  );
}

/* ─── Utils chip grid (filterable) ─────────────────── */
const UTILS_LIST = [
  { name: "UUID",         desc: "v4 / v1 / v7 / v5 batches" },
  { name: "Base64",       desc: "Encode / decode with auto-detect" },
  { name: "JWT",          desc: "Decode header + payload" },
  { name: "Hash",         desc: "SHA-256 / SHA-1 hex digest" },
  { name: "Password",     desc: "Random passwords, strength meter" },
  { name: "URL Encode",   desc: "Percent-encode / decode" },
  { name: "Case",         desc: "snake, kebab, camel, pascal…" },
  { name: "Regex",        desc: "Live tester with flags" },
  { name: "Escape",       desc: "JSON string escape / unescape" },
  { name: "HTML",         desc: "Entity encode / decode" },
  { name: "Time",         desc: "Unix ↔ ISO conversion" },
  { name: "Hex",          desc: "UTF-8 text ↔ hex bytes" },
  { name: "Number",       desc: "Decimal / hex / binary / octal" },
  { name: "URL Parse",    desc: "Split into protocol, host, path…" },
  { name: "Color",        desc: "HEX / RGB / HSL / CMYK" },
  { name: "Cron",         desc: "Explain 5/6-field cron" },
  { name: "Lorem",        desc: "Words, sentences, paragraphs" },
  { name: "Stats",        desc: "Lines, words, chars, bytes" },
];

function UtilsGrid({ query }: { query: string }) {
  const q = query.toLowerCase().trim();
  const visible = q ? UTILS_LIST.filter((u) => u.name.toLowerCase().includes(q) || u.desc.toLowerCase().includes(q)) : UTILS_LIST;
  if (q && !visible.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((u) => (
        <div key={u.name} className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-2.5 transition-colors hover:border-primary/30">
          <p className="text-sm font-semibold text-[var(--workspace-text)]">{u.name}</p>
          <p className="text-xs text-[var(--workspace-text-muted)]">{u.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────── */
export default function DocsPage() {
  const [query, setQuery] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const isMac = useIsMac();
  const modKey = isMac ? "Cmd" : "Ctrl";

  const docsSearchIcon = useIconAnimation();
  const heroSearchIcon = useIconAnimation();
  const [activeId, setActiveId] = useState<string>("");
  const mainRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* IntersectionObserver to track active sidebar link */
  useEffect(() => {
    const els = NAV_SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [query]);

  /* Global keyboard: `/` or Cmd/Ctrl+K to focus search; Esc to clear. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "Escape" && query) { setQuery(""); searchRef.current?.blur(); return; }
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (e.key === "/" && !inField && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query]);

  const clearSearch = useCallback(() => setQuery(""), []);

  const trimmedQuery = query.trim();
  const visibleNavIds = trimmedQuery
    ? NAV_SECTIONS.filter(({ id }) => {
        const sec = document.getElementById(id);
        return sec && sec.offsetParent !== null;
      }).map(({ id }) => id)
    : NAV_SECTIONS.map(({ id }) => id);
  const totalMatches = visibleNavIds.length;

  return (
    <div className="min-h-screen bg-[var(--workspace-background)]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)]/95 backdrop-blur-md supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTocOpen(true)}
              className="no-print -ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary focus-visible:outline-none lg:hidden"
              aria-label="Open table of contents"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[var(--workspace-text)] hover:text-primary transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">formaty</span>
            </Link>
            <span aria-hidden className="select-none text-[var(--workspace-border)]">/</span>
            <span aria-current="page" className="text-sm text-[var(--workspace-text-muted)]">Docs</span>
          </div>

          {/* Single responsive search input (header) */}
          <div className="relative max-w-xs flex-1" {...docsSearchIcon.bind}>
            <AnimatedMagnifierIcon ref={docsSearchIcon.ref} className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--workspace-text-muted)]" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={docsSearchIcon.bind.onFocus}
              onBlur={docsSearchIcon.bind.onBlur}
              placeholder={`Search docs… (${modKey}K)`}
              aria-label="Search documentation"
              className="w-full rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] py-1.5 pl-8 pr-14 text-xs text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)] outline-none transition-colors focus:border-primary/50"
            />
            <kbd aria-hidden className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-1 font-mono text-[10px] text-[var(--workspace-text-muted)] sm:inline-block">
              {modKey}K
            </kbd>
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-[var(--workspace-text-muted)] hover:text-primary sm:right-14"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/playground" className="no-print hidden rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:scale-[1.02] sm:inline-flex">
              Open Playground
            </Link>
            <a
              href="https://github.com/kdkumawat/formaty"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)] hover:text-primary transition-colors"
              aria-label="formaty on GitHub"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        {/* ── Left sidebar (desktop) ── */}
        <aside data-docs-toc className="sticky top-[49px] hidden h-[calc(100dvh-49px)] w-56 shrink-0 overflow-y-auto border-r border-[var(--workspace-border)] bg-[var(--workspace-panel)] py-5 lg:block">
          <nav aria-label="Documentation contents" className="px-3">
            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--workspace-text-muted)]">Contents</p>
            <ul className="space-y-0.5">
              {NAV_SECTIONS.map(({ id, label }) => {
                const active = activeId === id;
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className={cn(
                        "flex items-center rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-[var(--workspace-text-muted)] hover:bg-primary/8 hover:text-primary",
                      )}
                    >
                      {active && <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 border-t border-[var(--workspace-border)] pt-4 px-2">
              <Link href="/playground" className="block rounded-lg bg-primary/10 px-2.5 py-2 text-[12px] font-semibold text-primary transition-all hover:bg-primary/15 text-center">
                Try Playground →
              </Link>
            </div>
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main ref={mainRef} className="min-w-0 flex-1 px-5 py-10 md:px-10">
          {/* Skip link */}
          <a
            href="#docs-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-1.5 focus:text-xs focus:font-semibold focus:text-primary-foreground"
          >
            Skip to content
          </a>

          <div id="docs-content" />

          {/* Hero - search-as-CTA */}
          {!query && (
            <section className="mb-12 border-b border-[var(--workspace-border)] pb-10">
              <span className="mb-3 inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">Docs</span>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-4xl">
                Everything you can do with formaty.
              </h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--workspace-text-muted)]">
                A local-first toolkit for working with JSON, XML, YAML, TOML, CSV, and cURL. Search any feature or jump straight in.
              </p>

              {/* Hero search */}
              <div className="relative mt-6 max-w-2xl" {...heroSearchIcon.bind}>
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { docsSearchIcon.bind.onFocus(); heroSearchIcon.bind.onFocus(); searchRef.current?.focus(); }}
                  onBlur={heroSearchIcon.bind.onBlur}
                  placeholder="Search the docs - try “json”, “diff”, “export”…"
                  aria-label="Search documentation"
                  className="w-full rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] py-3.5 pl-12 pr-24 text-sm text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)] outline-none transition-colors focus:border-primary/50 focus:shadow-lg focus:shadow-primary/5"
                />
                <kbd aria-hidden className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--workspace-text-muted)] sm:inline-block">
                  Press <span className="text-[var(--workspace-text)]">{modKey}</span> K
                </kbd>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--workspace-text-muted)]">
                <span>Try:</span>
                {["json", "diff", "export", "shortcuts"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setQuery(s); searchRef.current?.focus(); }}
                    className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2 py-0.5 font-mono text-[11px] hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/playground"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-primary/30"
                >
                  Open Playground
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
                <a
                  href="https://github.com/kdkumawat/formaty"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-2 text-sm font-semibold text-[var(--workspace-text)] hover:border-primary/40 hover:text-primary"
                >
                  View on GitHub
                </a>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5 text-[11px] text-[var(--workspace-text-muted)]">
                <span>Supports:</span>
                {["JSON", "XML", "YAML", "TOML", "CSV", "cURL"].map((f) => (
                  <Tag key={f}>{f}</Tag>
                ))}
                <span className="text-[var(--workspace-border)]">·</span>
                <span>Last updated August 2026</span>
              </div>
            </section>
          )}

          {/* Quick start grid */}
          {!query && (
            <>
              <div className="mb-5 flex items-end justify-between border-b border-[var(--workspace-border)] pb-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Quick start</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--workspace-text)]">Pick a starting point</h2>
                </div>
              </div>
              <QuickStartGrid />
            </>
          )}

          {/* ── Getting started ── */}
          {!query && <CategoryHeader id="getting-started" label={CATEGORIES[0].label} intro={CATEGORIES[0].intro} />}

          {/* ── Formats ── */}
          <Section id="formats" query={query} keywords={["formats","json","xml","yaml","toml","csv","curl","input","output","parse","convert","auto-detect","detect"]}>
            <SectionHeader id="formats">Input &amp; Output Formats</SectionHeader>
            <SectionSummary>Paste any of these into the input editor - formaty auto-detects the format. Override via the format selector in the toolbar.</SectionSummary>
            <DefList
              items={[
                { label: <Tag color="amber">JSON</Tag>, value: "The primary format. Beautify, minify, flatten, sort, validate, schema, diff, and more." },
                { label: <Tag color="red">XML</Tag>, value: "Parse and convert to/from all other formats." },
                { label: <Tag color="lime">YAML</Tag>, value: "Parse and convert; ideal for configs and infrastructure files." },
                { label: <Tag color="teal">TOML</Tag>, value: "Parse and convert; Rust / systems-friendly config format." },
                { label: <Tag color="blue">CSV</Tag>, value: <>Parse and convert (array of objects). Supports comma <InlineCode>,</InlineCode>, tab <InlineCode>⇥</InlineCode>, semicolon <InlineCode>;</InlineCode>, and pipe <InlineCode>|</InlineCode>.</> },
                { label: <Tag color="sky">cURL</Tag>, value: "Paste any curl command. formaty executes it and renders the live API response as formatted JSON." },
              ]}
            />
            <Callout variant="tip" className="mt-4">
              On parse errors, use <strong>Samples</strong> in the command palette to load a known-good example, then compare to your input.
            </Callout>
          </Section>

          {/* ── Workspace ── */}
          <Section id="workspace" query={query} keywords={["workspace","pane","splitter","resize","live transform","auto-format","paste","import","font size","fullscreen","maximize","split input","settings","editor","drag"]}>
            <SectionHeader id="workspace">Workspace</SectionHeader>
            <SectionSummary>Three tools share one chrome: <strong>Transform</strong>, <strong>Compare</strong>, and <strong>Utils</strong>. The input editor is shared; each tool has its own toolbar row.</SectionSummary>
            <DefList
              items={[
                { label: "Transform", value: "Format, convert, views, types - classic left input / right output split." },
                { label: "Compare", value: "Document text/JSON diff or list/set compare with SQL IN export." },
                { label: "Utils", value: "UUID, Base64, JWT, hash, time, URL, case, hex, password, and more. Each tool keeps its own state." },
                { label: "Drag splitter", value: "Click and drag the center divider to resize input/output panes to any ratio." },
                { label: "Live transform", value: "Output updates instantly as you type. Toggle via command palette." },
                { label: "Auto-format on paste", value: "Automatically beautifies data when you paste into the input editor." },
                { label: "Import file", value: 'Upload any supported file directly into the input pane via command palette "Import file".' },
                { label: "Maximize output", value: 'Expand the output pane to full width via command palette "Maximize output pane".' },
                { label: "Fullscreen", value: 'Enter true browser fullscreen via command palette "Enter fullscreen".' },
                { label: "Find in output", value: 'Open find/replace in the output editor via command palette "Find in output".' },
                { label: "Font size", value: 'Increase / decrease via command palette "Font size +" / "Font size -".' },
                { label: "Line wrap", value: "Toggle long-line wrapping in the Monaco editor." },
                { label: "Samples", value: "Load built-in examples: JSON, Table, cURL, GitHub API, Stripe, K8s, OpenAPI." },
                { label: "Loose JSON", value: "Single-quoted keys/strings and trailing commas are accepted when possible (e.g. Python dicts)." },
              ]}
            />
          </Section>

          {/* ── Transform category header ── */}
          {!query && <CategoryHeader id="transform" label={CATEGORIES[1].label} intro={CATEGORIES[1].intro} />}

          {/* ── Multi-Tab ── */}
          <Section id="multi-tab" query={query} keywords={["multi-tab","tab","tabs","multiple","parallel","enable","disable","vertical","sidebar","multi tab"]}>
            <SectionHeader id="multi-tab">Multi-Tab Mode</SectionHeader>
            <SectionSummary>Work on multiple independent documents at the same time. Each tab keeps its own input, output, format settings, and history.</SectionSummary>
            <DefList
              items={[
                { label: "Enable / disable", value: 'Command palette "Enable multi-tab mode". State persists across page refreshes.' },
                { label: "New tab", value: 'Command palette "New tab" (only available when multi-tab is on).' },
                { label: "Close tab", value: "Hover the vertical tab label in the left rail then click the x button." },
                { label: "Switch tab", value: "Click any tab in the vertical tab bar on the left edge of the input pane." },
                { label: "Persistence", value: "Tab names and the enabled/disabled state are saved in localStorage." },
              ]}
            />
            <Callout variant="info" className="mt-4">
              Tabs display as a compact vertical column on the left edge of the input pane, keeping the editor at full width.
            </Callout>
          </Section>

          {/* ── Actions ── */}
          <Section id="actions" query={query} keywords={["actions","beautify","minify","flatten","unflatten","sort","deduplicate","schema","validate","diff","compare","pretty","compress","format"]}>
            <SectionHeader id="actions">Transform Actions</SectionHeader>
            <SectionSummary>One-click operations on your input data. Each runs in a Web Worker, so the editor stays responsive even on large files.</SectionSummary>
            <DefList
              items={[
                { label: "Beautify", value: "Pretty-print with configurable indentation (0-10 spaces)." },
                { label: "Minify", value: "Remove all whitespace for the smallest possible output." },
                { label: "Flatten", value: <>Convert nested objects to dot-notation keys: <InlineCode>a.b.c</InlineCode></> },
                { label: "Unflatten", value: "Expand dot-notation keys back to nested objects." },
                { label: "Sort array items", value: "Sort all array contents recursively (alphabetically / numerically)." },
                { label: "Remove duplicates", value: "Deep-deduplicate array values recursively." },
                { label: "Generate JSON Schema", value: "Infer a JSON Schema draft from your sample data." },
                { label: "Validate against Schema", value: "Paste a JSON Schema in the modal - formaty validates input and reports all errors." },
              ]}
            />
            <H3>Flatten: input → output</H3>
            <CodeSample
              language="json"
              input={`{
  "user": {
    "name": "Ada",
    "address": { "city": "London" }
  }
}`}
              output={`{
  "user.name": "Ada",
  "user.address.city": "London"
}`}
            />
          </Section>

          {/* ── Convert ── */}
          <Section id="convert" query={query} keywords={["convert","json","yaml","xml","toml","csv","change format","output format","curl"]}>
            <SectionHeader id="convert">Format Conversion</SectionHeader>
            <SectionSummary>Convert between any supported format pair using the output format picker or command palette.</SectionSummary>
            <div className="flex flex-wrap gap-2">
              {[
                { from: "JSON", to: "YAML" }, { from: "JSON", to: "XML" }, { from: "JSON", to: "TOML" }, { from: "JSON", to: "CSV" },
                { from: "YAML", to: "JSON" }, { from: "XML", to: "JSON" }, { from: "TOML", to: "JSON" }, { from: "CSV", to: "JSON" },
                { from: "cURL", to: "JSON" },
              ].map(({ from, to }) => (
                <span key={`${from}-${to}`} className="inline-flex items-center gap-1 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1 text-xs font-medium text-[var(--workspace-text-muted)]">
                  <span className="text-[var(--workspace-text)]">{from}</span>
                  <span className="text-primary">→</span>
                  <span className="text-[var(--workspace-text)]">{to}</span>
                </span>
              ))}
            </div>
            <H3 className="mt-6">JSON → YAML</H3>
            <CodeSample
              language="yaml"
              input={`{
  "name": "formaty",
  "version": "1.x",
  "local": true
}`}
              output={`name: formaty
version: 1.x
local: true`}
            />
          </Section>

          {/* ── Views ── */}
          <Section id="views" query={query} keywords={["views","raw","tree","graph","table","query","jsonpath","jmespath","visual","explore","pin"]}>
            <SectionHeader id="views">Output Views</SectionHeader>
            <SectionSummary>Switch the output between five renderings of the same data. Each view reuses the parsed tree - no re-parse needed when switching.</SectionSummary>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Raw",   desc: "Monaco editor with syntax highlighting, folding, line numbers, and find/replace." },
                { name: "Tree",  desc: "Expandable/collapsible explorer of the full data structure." },
                { name: "Graph", desc: "Interactive node graph - zoom, pan, drag to explore relationships." },
                { name: "Query", desc: "JSONPath / JMESPath live filter with highlighted matching nodes." },
                { name: "Table", desc: "Tabular grid for arrays of objects. Sort, search, hide columns." },
              ].map(({ name, desc }) => (
                <div key={name} className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4">
                  <p className="mb-1 font-bold text-[var(--workspace-text)]">{name}</p>
                  <p className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
            <Callout variant="tip" className="mt-4">
              <span className="inline-flex items-center gap-1">
                Pin any view to the output toolbar with <Star className="inline h-3.5 w-3.5 text-amber-500" aria-hidden /> for one-click switching.
              </span>
            </Callout>
          </Section>

          {/* ── Type Gen ── */}
          <Section id="types" query={query} keywords={["types","typescript","zod","java","csharp","python","pydantic","go","kotlin","swift","rust","sql","protobuf","generate","interface","struct","type generation"]}>
            <SectionHeader id="types">Type Generation</SectionHeader>
            <SectionSummary>Generate strongly-typed interfaces and structs from your JSON. Search <strong>generate</strong> in the command palette, or use the output format picker.</SectionSummary>
            <div className="flex flex-wrap gap-2">
              {["TypeScript", "Java", "C#", "Python", "Go", "Protobuf", "Kotlin", "Swift", "Rust", "SQL"].map((l) => (
                <Tag key={l}>{l}</Tag>
              ))}
            </div>
            <H3>JSON → TypeScript</H3>
            <CodeSample
              language="ts"
              input={`{
  "id": 1,
  "name": "Ada",
  "tags": ["math", "cs"]
}`}
              output={`interface Root {
  id: number;
  name: string;
  tags: string[];
}`}
            />
          </Section>

          {/* ── Query ── */}
          <Section id="query" query={query} keywords={["query","jsonpath","jmespath","filter","search","expression","path","result","live"]}>
            <SectionHeader id="query">Query Playground</SectionHeader>
            <SectionSummary>Switch to <strong>Query</strong> view to run live path expressions against your output data. Matching nodes are highlighted, results appear below the expression input.</SectionSummary>
            <TableWrap>
              <THead cols={["Language", "Example", "Notes"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <tr className="border-b border-[var(--workspace-border)]/60">
                  <td className="px-4 py-2.5 font-semibold text-[var(--workspace-text)] whitespace-nowrap">JSONPath</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-emerald-600">$.users[*].name</td>
                  <td className="px-4 py-2.5 text-sm text-[var(--workspace-text-muted)]">Recursive descent, filter expressions, array slices</td>
                </tr>
                <tr className="border-b border-[var(--workspace-border)]/60">
                  <td className="px-4 py-2.5 font-semibold text-[var(--workspace-text)] whitespace-nowrap">JMESPath</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-emerald-600">users[].name</td>
                  <td className="px-4 py-2.5 text-sm text-[var(--workspace-text-muted)]">AWS-standard query language; projections &amp; functions</td>
                </tr>
              </tbody>
            </TableWrap>
          </Section>

          {/* ── Options ── */}
          <Section id="options" query={query} keywords={["options","indent","quote style","sort keys","remove empty","csv delimiter","line wrap","auto-format","font size","settings","indentation"]}>
            <SectionHeader id="options">Format Options &amp; Settings</SectionHeader>
            <SectionSummary>Per-format and editor-wide settings. Access via the toolbar or the command palette.</SectionSummary>
            <DefList
              items={[
                { label: "Indent", value: "0-10 spaces. Use the - / + buttons in the toolbar or reset to 2 (default)." },
                { label: "Quote style", value: "Double or single quotes for JSON string values." },
                { label: "Sort keys", value: "Alphabetize all object keys in output." },
                { label: "Remove empty", value: "Strip null, empty string, and empty array/object values from output." },
                { label: "CSV delimiter", value: <>Comma <InlineCode>,</InlineCode>, Tab <InlineCode>⇥</InlineCode>, Semicolon <InlineCode>;</InlineCode>, or Pipe <InlineCode>|</InlineCode></> },
                { label: "Live transform", value: "Re-runs the active operation on every keystroke. Disable for large files." },
                { label: "Auto-format on paste", value: "Automatically beautifies when pasting content into the input editor." },
                { label: "Line wrap", value: "Wrap long lines inside the Monaco editor." },
                { label: "Editor font size", value: 'Increase / decrease via command palette "Font size +" / "Font size -".' },
              ]}
            />
            <Callout variant="warning" className="mt-4">
              With <strong>Live transform</strong> on, files larger than ~5 MB will visibly lag the editor. Toggle off and use <Kbd isMac={isMac}>{`${modKey} Enter`}</Kbd> to run on demand.
            </Callout>
          </Section>

          {/* ── Compare category header ── */}
          {!query && <CategoryHeader id="compare" label={CATEGORIES[2].label} intro={CATEGORIES[2].intro} />}

          {/* ── Diff ── */}
          <Section id="diff" query={query} keywords={["diff","compare","delta","side-by-side","inline","navigate","changes","two documents","delta","paths","hunks","swap","whitespace","report","stats","list","set","sql","in","common","intersection"]}>
            <SectionHeader id="diff">Diff &amp; Compare</SectionHeader>
            <SectionSummary>Three modes: <strong>Document</strong> (text/JSON line + path diff), <strong>List / Set</strong> (common / only-left / only-right with SQL <InlineCode>IN</InlineCode> export), and <strong>Single list</strong> (dedupe, counts, sort).</SectionSummary>

            <H3>Document mode</H3>
            <p className="mb-3 text-sm text-[var(--workspace-text-muted)]">Full-width left/right panes for comparing two documents. Path-aware JSON diff highlights structural changes, not just lines.</p>
            <DefList
              items={[
                { label: "Enter", value: 'Actions → Diff, or palette → Diff. Main input is hidden when in diff mode.' },
                { label: "Counts", value: "current/total hunks, +/- lines, JSON path totals. Navigate with arrows or palette." },
                { label: "Tools", value: "Inline layout, Trim WS, Paths panel, swap, beautify, paste, export report." },
              ]}
            />

            <H3>List / Set mode</H3>
            <p className="mb-3 text-sm text-[var(--workspace-text-muted)]">Compare two lists of values. Buckets: common, only-left, only-right, union, symmetric diff, duplicates per side, and CSV-key changes.</p>
            <DefList
              items={[
                { label: "Switch", value: 'Toolbar tab List / Set, or palette → "Diff: List / set mode".' },
                { label: "Buckets", value: "Common, Left, Right, Union, Symmetric diff, Left/Right duplicates, Changed (CSV key compare) - with live counts." },
                { label: "CSV column compare", value: "Paste two CSVs with a shared header; pick a key column and see common, missing, extra, and changed rows." },
                { label: "Counts (multiset)", value: <>Toggle <em>Counts</em> for count-aware comparison: keys on both sides with different occurrence counts are reported (e.g. <InlineCode>A: 1 extra on left</InlineCode>).</> },
                { label: "Parse", value: "Auto / newline / comma / semicolon / pipe / whitespace / JSON array; toggles for trim, skip empty, ignore case, strip quotes, normalize numbers." },
                { label: "Sort", value: "Original, A→Z, Z→A, numeric, by frequency." },
                { label: "Export", value: <>SQL <InlineCode>IN</InlineCode> / <InlineCode>NOT IN</InlineCode> / <InlineCode>ANY(ARRAY[…])</InlineCode> / <InlineCode>INSERT</InlineCode> with table/column names, quote style, and chunking. Also: PostgreSQL ARRAY, JSON array, CSV, TSV, YAML, Markdown &amp; HTML tables, JS/Python lists, Go slices, regex alternation.</> },
                { label: "Sample", value: "Empty state offers sample developer lists (user IDs) to try common vs left-only vs right-only." },
              ]}
            />
            <Callout variant="tip" className="mt-3">
              Paste two CSVs and pick a key column to see missing, extra, and changed rows in a single bucket view - useful for syncing two database exports.
            </Callout>

            <H3>Single list mode</H3>
            <p className="mb-3 text-sm text-[var(--workspace-text-muted)]">Analyze one list: find duplicates, count frequencies, sort, dedupe, export.</p>
            <DefList
              items={[
                { label: "Switch", value: "Toolbar tab Single." },
                { label: "Views", value: "Unique, Duplicates (with counts), and Counts (frequency)." },
                { label: "Actions", value: <>Dedupe in place, sort A→Z / Z→A / numerically, copy SQL <InlineCode>IN</InlineCode>.</> },
                { label: "Export", value: "Same formats as List / Set." },
                { label: "Sample", value: '"Load sample" loads a realistic developer ID list with duplicates.' },
              ]}
            />
          </Section>

          {/* ── Workflow category header ── */}
          {!query && <CategoryHeader id="workflow" label={CATEGORIES[3].label} intro={CATEGORIES[3].intro} />}

          {/* ── Utils ── */}
          <Section id="utils" query={query} keywords={["utils","uuid","base64","jwt","hash","sha","time","timestamp","url","encode","decode","hex","password","case","html","escape","stats","generator","devtools"]}>
            <SectionHeader id="utils">Utils</SectionHeader>
            <SectionSummary>Switch the workspace tool to <strong>Utils</strong> for common developer helpers. Each tool keeps its own input/output state, sample data, and options.</SectionSummary>
            <UtilsGrid query={query} />
            <Callout variant="info" className="mt-4">
              Output updates <strong>live</strong> as you type (no Run required). Copy via the toolbar copy button - each tool remembers its own last copy format (per tab). All processing stays in your browser.
            </Callout>
          </Section>

          {/* ── Command Palette ── */}
          <Section id="palette" query={query} keywords={["command palette","palette","search","cmd k","ctrl k","recent","shortcut","all commands"]}>
            <SectionHeader id="palette">Command Palette</SectionHeader>
            <SectionSummary>Press <Kbd isMac={isMac}>{`${modKey} K`}</Kbd> anywhere - even inside the editor - to open the command palette. The last 3 used commands always appear first.</SectionSummary>
            <DefList
              items={[
                { label: "Recent", value: "Last 3 executed commands at the top for fast re-run." },
                { label: "Actions", value: "Beautify, Minify, Flatten, Unflatten, Sort arrays, Remove duplicates, Diff, Generate Schema, Validate…" },
                { label: "Convert to", value: "JSON, YAML, XML, TOML, CSV" },
                { label: "View as", value: "Raw, Tree, Graph, Query, Table" },
                { label: "Generate Types", value: "TypeScript, Zod, Go, Python, Pydantic, Java, C#, Rust, Kotlin, Swift, Protobuf, SQL…" },
                { label: "Samples", value: "Load JSON / YAML / CSV / cURL samples; GitHub API, Stripe, K8s, OpenAPI examples." },
                { label: "Settings", value: "Sort keys, Remove empty, Quote style, Indent, CSV delimiter, Live transform, Auto-format on paste, Line wrap, Font size…" },
                { label: "Workspace", value: "Paste, Import file, Copy output, Download, Share, Browse history, Multi-tab, Find in output, Fullscreen, Maximize output, Focus pane…" },
                { label: "Theme", value: "Light, Dark, System." },
              ]}
            />
          </Section>

          {/* ── Copy As ── */}
          <Section id="copy-as" query={query} keywords={["copy as","base64","escaped","url-encoded","data uri","clipboard","encode","export"]}>
            <SectionHeader id="copy-as">Copy As</SectionHeader>
            <SectionSummary>Search <strong>copy as</strong> in the command palette to copy output in alternate encodings.</SectionSummary>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "Base64",         desc: "btoa(output) - compact binary-safe encoding." },
                { name: "Escaped string", desc: "Output wrapped as a JSON string literal (escaped) for embedding in code." },
                { name: "URL-encoded",    desc: "Percent-encoded for use in query parameters or form POST bodies." },
                { name: "Data URI",       desc: "data:application/json;base64,... for inline embedding in HTML / CSS." },
              ].map(({ name, desc }) => (
                <div key={name} className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4">
                  <p className="mb-1 font-bold text-[var(--workspace-text)]">{name}</p>
                  <p className="text-sm text-[var(--workspace-text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── History ── */}
          <Section id="history" query={query} keywords={["history","undo","redo","restore","browse","export","stack","entry","previous"]}>
            <SectionHeader id="history">Input History</SectionHeader>
            <SectionSummary>Every paste, import, or edit batch is saved to an undo stack (up to 100 entries per tab).</SectionSummary>
            <DefList
              items={[
                { label: "Undo / Redo", value: <><Kbd isMac={isMac}>{`${modKey} Z`}</Kbd> / <Kbd isMac={isMac}>{`${modKey} Shift Z`}</Kbd>, toolbar arrow buttons, or command palette.</> },
                { label: "Browse history", value: 'Command palette → "Browse history". Opens a side panel listing all entries. Click any entry to restore.' },
                { label: "Export history", value: "Downloads all undo entries as a JSON file." },
              ]}
            />
          </Section>

          {/* ── Share ── */}
          <Section id="share" query={query} keywords={["share","export","download","embed","iframe","link","url","copy","cloud","disable"]}>
            <SectionHeader id="share">Share &amp; Export</SectionHeader>
            <SectionSummary>Save your workspace as a short link, embed formaty in another site, or download the output.</SectionSummary>
            <DefList
              items={[
                { label: "Share", value: "Confirms first (only action that can leave your device), then saves a short link. Recipients see the same input/output/settings." },
                { label: "Share state", value: "Links preserve the tool, input, output, view, query text, compare mode and both sides, list options, CSV key column, and selected operation. Backwards compatible with older links." },
                { label: "Embed", value: <>Append <InlineCode>?embed=1</InlineCode> to any playground URL (e.g. <InlineCode>/playground?tool=json-diff&amp;embed=1</InlineCode>) for a chrome-free embeddable frame with an "Open in Formaty" link.</> },
                { label: "Disable sharing", value: "Click the disable icon next to the shared link in the status bar." },
                { label: "Download", value: "Saves output as a file (or graph as PNG/JPG). Output toolbar or command palette." },
                { label: "Copy / Copy as", value: "Output toolbar (never covers text). Copy as Base64, escaped, URL-encoded, or Data URI. Optional draggable floating bar in Settings." },
                { label: "Use output as input", value: "Chain transforms (toolbar back-arrow or command palette)." },
              ]}
            />
          </Section>

          {/* ── Shortcuts ── */}
          <Section id="shortcuts" query={query} keywords={["shortcuts","keyboard","hotkey","cmd","ctrl","keybinding","esc","enter","undo","redo"]}>
            <SectionHeader id="shortcuts">Keyboard Shortcuts</SectionHeader>
            <SectionSummary>Shortcuts shown for your platform ({isMac ? "macOS" : "Windows / Linux"}). The same actions are available in the command palette.</SectionSummary>
            <TableWrap>
              <THead cols={["Shortcut", "Action"]} />
              <tbody className="divide-y divide-[var(--workspace-border)]/50">
                <Row label={<Kbd isMac={isMac}>{`${modKey} K`}</Kbd>} value="Open command palette (works inside the editor)" />
                <Row label={<Kbd isMac={isMac}>{`${modKey} Z`}</Kbd>} value="Undo input" />
                <Row label={<Kbd isMac={isMac}>{`${modKey} Shift Z`}</Kbd>} value="Redo input" />
                <Row label={<Kbd isMac={isMac}>{`${modKey} V`}</Kbd>} value="Paste from clipboard into input" />
                <Row label={<Kbd isMac={isMac}>{`${modKey} C`}</Kbd>} value="Copy output to clipboard" />
                <Row label={<Kbd isMac={isMac}>{`${modKey} Enter`}</Kbd>} value="Parse and transform (when live transform is off)" />
                <Row label={<Kbd isMac={isMac}>ESC</Kbd>} value="Close command palette / modal" />
                <Row label={<Kbd isMac={isMac}>/</Kbd>} value="Focus docs search" />
              </tbody>
            </TableWrap>
          </Section>

          {/* ── Pinning ── */}
          <Section id="pinning" query={query} keywords={["pinning","pin","star","toolbar","persist","quick access","favorite","unpin"]}>
            <SectionHeader id="pinning">Toolbar Pinning</SectionHeader>
            <SectionSummary>Pin the actions, views, type languages, and settings you use most to the quick-access toolbar. Pinned items persist across sessions.</SectionSummary>
            <Callout variant="info">
              <span className="flex flex-wrap items-center gap-1.5">
                Every item - format, view, action, type language, setting - has a{" "}
                <Star className="inline h-3.5 w-3.5 text-amber-500" aria-hidden /> icon. Click to pin to the quick-access toolbar. You can also pin/unpin via command palette → search <strong>pin</strong>.
              </span>
            </Callout>
          </Section>

          {/* ── Reference category header ── */}
          {!query && <CategoryHeader id="reference" label={CATEGORIES[4].label} intro={CATEGORIES[4].intro} />}

          {/* ── Privacy ── */}
          <Section id="privacy" query={query} keywords={["privacy","local","browser","data","server","localstorage","share","secure","offline"]}>
            <SectionHeader id="privacy">Privacy &amp; Local-First</SectionHeader>
            <Callout variant="tip" title="Local-first by default">
              formaty processes everything locally using a Web Worker. No input, output, or transform result is sent to any server - except when you explicitly click <strong>Share</strong> and confirm the privacy dialog.
              <br /><br />
              Session state (pinned items, theme, tabs, settings) is stored in localStorage. Shared links can be disabled from the status bar.
            </Callout>
          </Section>

          {/* ── Recipes ── */}
          {!query && (
            <section className="mt-20 mb-12 border-t border-[var(--workspace-border)] pt-12">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Recipes</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--workspace-text)]">Common tasks, end-to-end</h2>
                </div>
              </div>
              <div className="grid gap-4">
                <RecipeCard
                  title="Flatten nested JSON"
                  desc="Convert a nested object to dot-notation keys for CSV export or querying."
                  input={`{ "user": { "name": "Ada", "address": { "city": "London" } } }`}
                  output={`{ "user.name": "Ada", "user.address.city": "London" }`}
                  inputLabel="Input"
                  outputLabel="After Flatten"
                  language="json"
                  href="/playground?tool=json-formatter"
                />
                <RecipeCard
                  title="Convert cURL response to YAML"
                  desc="Paste a cURL command, then switch the output to YAML."
                  input={`curl https://api.github.com/repos/kdkumawat/formaty`}
                  output={`id: 123456789
name: formaty
full_name: kdkumawat/formaty
private: false
stargazers_count: 42`}
                  inputLabel="Input (cURL)"
                  outputLabel="Output (YAML)"
                  language="bash"
                  href="/playground?tool=curl-to-json"
                />
                <RecipeCard
                  title="Generate TypeScript from API response"
                  desc="Paste a sample response, switch output to TypeScript, copy the interface."
                  input={`{ "id": 1, "name": "Ada", "email": "ada@example.com" }`}
                  output={`interface Root {
  id: number;
  name: string;
  email: string;
}`}
                  inputLabel="Input"
                  outputLabel="Generated TS"
                  language="ts"
                  href="/playground?tool=json-to-typescript"
                />
                <RecipeCard
                  title="Diff two CSV files by key column"
                  desc="Use Compare → List / Set, paste both CSVs, pick the key column. Get common / missing / extra rows."
                  input={`id,name
1,Ada
2,Grace
3,Linus

id,name
2,Grace
3,Linus
4,Margaret`}
                  output={`-- common
2,Grace
3,Linus

-- only-left
1,Ada

-- only-right
4,Margaret`}
                  inputLabel="Input (CSV × 2)"
                  outputLabel="Buckets"
                  language="csv"
                  href="/playground?tool=csv-compare"
                />
              </div>
            </section>
          )}

          {/* ── FAQ ── */}
          {!query && (
            <section className="mb-12">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">FAQ</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--workspace-text)]">Frequently asked</h2>
                </div>
              </div>
              <div className="space-y-2">
                <FaqItem q="What's the difference between Transform and Compare?" a={<>Transform works on a single document - input on the left, output on the right, every action updates the output. Compare is a separate tool for two documents (text/JSON diff) or two lists (set operations) or one list (analyze/dedupe).</>} />
                <FaqItem q="Does my data leave the device?" a={<>No. Everything runs in a Web Worker in your browser. The only network action is <strong>Share</strong>, which asks for confirmation before sending the workspace state to the link-shortener.</>} />
                <FaqItem q="Can I use formaty offline?" a={<>Yes. After the first visit, the site is cached by your browser. The Web Worker, Monaco editor, and all format parsers run without a network connection.</>} />
                <FaqItem q="Is there a CLI?" a={<>Not yet. The playground is the only interface. If a CLI would be useful, open an issue and let us know which formats / operations you'd want.</>} />
                <FaqItem q="How big can my input be?" a={<>In practice, around 10-50 MB depending on the operation. Live transform gets slow above ~5 MB - toggle it off and run with <Kbd isMac={isMac}>{`${modKey} Enter`}</Kbd>. The history panel is capped at 100 entries per tab.</>} />
                <FaqItem q="How do I report a bug?" a={<>Open an issue on GitHub with the input, expected output, and actual output. Use the "Was this helpful?" widget below to send docs feedback, or the feedback dialog inside the playground for app feedback.</>} />
              </div>
            </section>
          )}

          {/* No-results state */}
          {trimmedQuery && totalMatches === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-8 text-center">
              <p className="text-sm font-semibold text-[var(--workspace-text)]">No matches for "{query}"</p>
              <p className="mt-2 text-xs text-[var(--workspace-text-muted)]">Try one of these:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {SEARCH_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 py-0.5 font-mono text-[11px] text-[var(--workspace-text-muted)] hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          {!query && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
              <p className="mb-4 text-base font-semibold text-[var(--workspace-text)]">Ready to try it?</p>
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/35"
              >
                Open Playground →
              </Link>
            </div>
          )}

          {/* Feedback widget */}
          {!query && <FeedbackWidget />}

          {/* Prev / Next nav */}
          {!query && <PrevNext />}

          {/* Footer */}
          {!query && (
            <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-border)] pt-6 text-xs text-[var(--workspace-text-muted)]">
              <span>Last updated August 2026 · formaty v1.x</span>
              <div className="flex items-center gap-3">
                <a href={GITHUB_EDIT_BASE} target="_blank" rel="noopener noreferrer" className="no-print hover:text-primary">
                  Edit this page on GitHub →
                </a>
                <span className="text-[var(--workspace-border)]">·</span>
                <a href="https://github.com/kdkumawat/formaty/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="no-print hover:text-primary">
                  Changelog
                </a>
              </div>
            </footer>
          )}
        </main>
      </div>

      <MobileToc
        open={tocOpen}
        onOpenChange={setTocOpen}
        activeId={activeId}
        onSelect={() => setTocOpen(false)}
      />

      <BackToTop />
    </div>
  );
}
