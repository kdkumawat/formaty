"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon, BoltIcon } from "@heroicons/react/24/outline";

// Each slide: {inputLabel, inputColor, outputLabel, outputColor, statusText, InputPane, OutputPane}
type Slide = {
  id: string;
  inputLabel: string;
  inputColor: string;
  outputLabel: string;
  outputColor: string;
  statusText: string;
  InputPane: () => React.JSX.Element;
  OutputPane: () => React.JSX.Element;
};

/* ─── Input Panes ───────────────────────────────────── */
function JsonInput() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-[var(--workspace-text)]">{"{"}</span>{"\n"}
      {"  "}<span className="text-sky-500">"id"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">42</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
      {"  "}<span className="text-sky-500">"name"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">"Alice"</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
      {"  "}<span className="text-sky-500">"roles"</span><span className="text-[var(--workspace-text)]">: [</span>{"\n"}
      {"    "}<span className="text-emerald-500">"admin"</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
      {"    "}<span className="text-emerald-500">"dev"</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">]</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"}"}</span>
    </pre>
  );
}

function XmlInput() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-[var(--workspace-text-muted)]">{"<?"}xml version="1.0"{"?>"}</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">product</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">sku</span><span className="text-[var(--workspace-text)]">{">"}</span><span className="text-amber-500">X-42</span><span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">sku</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">price</span><span className="text-[var(--workspace-text)]">{">"}</span><span className="text-amber-500">29.99</span><span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">price</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">inStock</span><span className="text-[var(--workspace-text)]">{">"}</span><span className="text-violet-400">true</span><span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">inStock</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">product</span><span className="text-[var(--workspace-text)]">{">"}</span>
    </pre>
  );
}

function YamlInput() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-sky-500">server</span><span className="text-[var(--workspace-text)]">:</span>{"\n"}
      {"  "}<span className="text-sky-500">host</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">api.example.com</span>{"\n"}
      {"  "}<span className="text-sky-500">port</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">8080</span>{"\n"}
      {"  "}<span className="text-sky-500">tls</span><span className="text-[var(--workspace-text)]">: </span><span className="text-violet-400">true</span>{"\n"}
      <span className="text-sky-500">timeout</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">30</span>
    </pre>
  );
}

function CurlInput() {
  return (
    <pre className="font-mono text-[10px] leading-[1.85] break-all">
      <span className="text-[var(--workspace-text-muted)]">$</span>{" "}
      <span className="text-violet-400">curl</span>{" "}
      <span className="text-sky-400">-X GET</span>{" "}
      <span className="text-emerald-500 break-all">{"\""}https://api.github.com{"\n"}{"  "}/users/octocat{"\""}
      </span>{"\n"}
      <span className="text-[var(--workspace-text-muted)]">  -H </span>
      <span className="text-amber-500">"Accept:{"\n"}{"    "}application/json"</span>
    </pre>
  );
}

function CsvInput() {
  return (
    <pre className="font-mono text-[11px] leading-[1.9]">
      <span className="text-sky-500 font-semibold">name</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-sky-500 font-semibold">score</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-sky-500 font-semibold">level</span>{"\n"}
      <span className="text-emerald-500">Alice</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-amber-500">98</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-violet-400">gold</span>{"\n"}
      <span className="text-emerald-500">Bob</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-amber-500">72</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-violet-400">silver</span>{"\n"}
      <span className="text-emerald-500">Carol</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-amber-500">85</span><span className="text-[var(--workspace-text-muted)]">,</span><span className="text-violet-400">gold</span>
    </pre>
  );
}

/* ─── Output Panes ───────────────────────────────────── */
function TypeScriptOut() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-violet-400">interface </span><span className="text-sky-400">Root </span><span className="text-[var(--workspace-text)]">{"{"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">id: </span><span className="text-amber-400">number</span><span className="text-[var(--workspace-text)]">;</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">name: </span><span className="text-amber-400">string</span><span className="text-[var(--workspace-text)]">;</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">roles: </span><span className="text-amber-400">string</span><span className="text-[var(--workspace-text)]">[];</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"}"}</span>
    </pre>
  );
}

function XmlToYamlOut() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-sky-500">product</span><span className="text-[var(--workspace-text)]">:</span>{"\n"}
      {"  "}<span className="text-sky-500">sku</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">X-42</span>{"\n"}
      {"  "}<span className="text-sky-500">price</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">29.99</span>{"\n"}
      {"  "}<span className="text-sky-500">inStock</span><span className="text-[var(--workspace-text)]">: </span><span className="text-violet-400">true</span>
    </pre>
  );
}

function YamlToTomlOut() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-[var(--workspace-text-muted)]">[server]</span>{"\n"}
      <span className="text-sky-400">host</span><span className="text-[var(--workspace-text)]"> = </span><span className="text-emerald-500">"api.example.com"</span>{"\n"}
      <span className="text-sky-400">port</span><span className="text-[var(--workspace-text)]"> = </span><span className="text-amber-500">8080</span>{"\n"}
      <span className="text-sky-400">tls</span><span className="text-[var(--workspace-text)]"> = </span><span className="text-violet-400">true</span>{"\n"}
      <span className="text-sky-400">timeout</span><span className="text-[var(--workspace-text)]"> = </span><span className="text-amber-500">30</span>
    </pre>
  );
}

function CurlToJsonOut() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-[var(--workspace-text)]">{"{"}</span>{"\n"}
      {"  "}<span className="text-sky-500">"login"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">"octocat"</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
      {"  "}<span className="text-sky-500">"id"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">583231</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
      {"  "}<span className="text-sky-500">"type"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">"User"</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"}"}</span>
    </pre>
  );
}

function CsvTableOut() {
  return (
    <div className="overflow-hidden rounded-md border border-[var(--workspace-border)] text-[10.5px]">
      <table className="w-full border-collapse font-mono">
        <thead>
          <tr className="border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]">
            {["name","score","level"].map(h => (
              <th key={h} className="px-2 py-1 text-left font-bold text-[var(--workspace-text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[["Alice","98","gold"],["Bob","72","silver"],["Carol","85","gold"]].map((row, i) => (
            <tr key={i} className="border-b border-[var(--workspace-border)]/50">
              <td className="px-2 py-1 text-emerald-500">{row[0]}</td>
              <td className="px-2 py-1 text-amber-500">{row[1]}</td>
              <td className="px-2 py-1 text-violet-400">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    id: "json-ts",
    inputLabel: "JSON", inputColor: "text-amber-500",
    outputLabel: "TypeScript", outputColor: "text-violet-500",
    statusText: "JSON → TypeScript types",
    InputPane: JsonInput, OutputPane: TypeScriptOut,
  },
  {
    id: "xml-yaml",
    inputLabel: "XML", inputColor: "text-red-500",
    outputLabel: "YAML", outputColor: "text-lime-600",
    statusText: "XML → YAML convert",
    InputPane: XmlInput, OutputPane: XmlToYamlOut,
  },
  {
    id: "yaml-toml",
    inputLabel: "YAML", inputColor: "text-lime-600",
    outputLabel: "TOML", outputColor: "text-teal-500",
    statusText: "YAML → TOML convert",
    InputPane: YamlInput, OutputPane: YamlToTomlOut,
  },
  {
    id: "curl-json",
    inputLabel: "cURL", inputColor: "text-sky-500",
    outputLabel: "JSON", outputColor: "text-amber-500",
    statusText: "cURL → Live API response",
    InputPane: CurlInput, OutputPane: CurlToJsonOut,
  },
  {
    id: "csv-table",
    inputLabel: "CSV", inputColor: "text-blue-500",
    outputLabel: "Table View", outputColor: "text-emerald-500",
    statusText: "CSV → Table view",
    InputPane: CsvInput, OutputPane: CsvTableOut,
  },
];

export function Hero() {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx((i) => (i + 1) % SLIDES.length);
    }, 3400);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[slideIdx];
  const { InputPane, OutputPane } = slide;

  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden bg-[var(--workspace-background)] px-4 py-12 md:py-20">
      {/* Fine line grid background */}
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />

      {/* Drifting gradient blob - top right */}
      <div
        className="blob-drift-a pointer-events-none absolute -right-24 -top-36 h-[700px] w-[700px]"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.13) 0%, rgba(124,58,237,0.04) 45%, transparent 65%)",
          filter: "blur(64px)",
        }}
        aria-hidden
      />
      {/* Drifting gradient blob - bottom left */}
      <div
        className="blob-drift-b pointer-events-none absolute -bottom-36 -left-24 h-[600px] w-[600px]"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.11) 0%, rgba(37,99,235,0.04) 45%, transparent 65%)",
          filter: "blur(64px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">
        {/* Left: Copy */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.07] px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm shadow-primary/10"
          >
            <BoltIcon className="h-3 w-3" aria-hidden />
            No signup · Runs locally · Always free
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="text-[2.8rem] font-bold leading-[1.04] tracking-[-0.03em] text-[var(--workspace-text)] sm:text-5xl md:text-6xl lg:text-[4.5rem]"
          >
            Work with data.
            <br />
            <span className="gradient-text">Instantly.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="mx-auto max-w-lg text-base leading-relaxed text-[var(--workspace-text-muted)] lg:mx-0 lg:text-lg"
          >
            Format, convert, diff, query, and visualize{" "}
            <span className="font-semibold text-[var(--workspace-text)]">
              JSON · XML · YAML · TOML · CSV · cURL
            </span>{" "}
            - one workspace, zero installs.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Link
              href="/playground"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-content shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/35"
            >
              Open Playground
              <ArrowRightIcon
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/json-formatter"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-6 py-3 text-sm font-medium text-[var(--workspace-text)] shadow-sm transition-all duration-200 hover:border-primary/40 hover:scale-[1.03] hover:shadow-md"
            >
              Format JSON
            </Link>
          </motion.div>

          {/* Format pills - with active slide highlighted */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start"
          >
            {[
              { label: "JSON",       id: "json-ts",   color: "text-amber-500 border-amber-500/25 bg-amber-500/5",   activeColor: "text-amber-600 border-amber-500/60 bg-amber-500/15 scale-105" },
              { label: "XML",        id: "xml-yaml",  color: "text-red-500 border-red-500/25 bg-red-500/5",         activeColor: "text-red-600 border-red-500/60 bg-red-500/15 scale-105" },
              { label: "YAML",       id: "yaml-toml", color: "text-lime-600 border-lime-600/25 bg-lime-600/5",       activeColor: "text-lime-700 border-lime-600/60 bg-lime-600/15 scale-105" },
              { label: "cURL",       id: "curl-json", color: "text-sky-500 border-sky-500/25 bg-sky-500/5",         activeColor: "text-sky-600 border-sky-500/60 bg-sky-500/15 scale-105" },
              { label: "CSV",        id: "csv-table", color: "text-blue-500 border-blue-500/25 bg-blue-500/5",      activeColor: "text-blue-600 border-blue-500/60 bg-blue-500/15 scale-105" },
              { label: "TypeScript", id: "json-ts",   color: "text-violet-500 border-violet-500/25 bg-violet-500/5", activeColor: "text-violet-600 border-violet-500/60 bg-violet-500/15 scale-105" },
            ].map(({ label, id, color, activeColor }) => (
              <span
                key={label}
                className={`inline-flex items-center rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-medium transition-all duration-300 ${slide.id === id ? activeColor : color}`}
              >
                {label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right: animated dual-pane code widget */}
        <motion.div
          initial={{ opacity: 0, x: 32, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 80 }}
          className="w-full max-w-xl flex-1"
        >
          <div className="relative">
            {/* Rim glow */}
            <div
              className="pointer-events-none absolute -inset-px rounded-[1.15rem]"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(37,99,235,0.2) 60%, transparent 100%)",
                filter: "blur(1px)",
              }}
              aria-hidden
            />
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute -inset-10 rounded-3xl"
              style={{
                background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 65%)",
                filter: "blur(30px)",
              }}
              aria-hidden
            />
            {/* Main card */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-2xl shadow-black/20">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 font-mono text-xs text-[var(--workspace-text-muted)]">
                  formaty - playground
                </span>
                <span className="ml-auto flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Valid
                </span>
              </div>

              {/* Split code panes */}
              <div className="grid grid-cols-2 divide-x divide-[var(--workspace-border)]">
                {/* Input pane - cycles through input formats */}
                <div className="h-[200px] overflow-hidden p-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id + "-in"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className={`mb-2.5 font-mono text-[10px] font-bold uppercase tracking-widest ${slide.inputColor}`}>
                        {slide.inputLabel}
                      </p>
                      <InputPane />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Output pane - cycles through output modes */}
                <div className="relative h-[200px] overflow-hidden p-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id + "-out"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <p className={`mb-2.5 font-mono text-[10px] font-bold uppercase tracking-widest ${slide.outputColor}`}>
                        {slide.outputLabel}
                      </p>
                      <OutputPane />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Status bar footer */}
              <div className="flex items-center gap-2 border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-1.5">
                <span className="font-mono text-[10px] text-[var(--workspace-text-muted)]">auto-detect</span>
                <span className="select-none text-[var(--workspace-border)]">·</span>
                <span className="font-mono text-[10px] text-[var(--workspace-text-muted)]">UTF-8</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={slide.id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2 }}
                    className="ml-auto flex items-center gap-1.5 font-mono text-[10px] font-semibold"
                  >
                    <span className={slide.inputColor}>{slide.inputLabel}</span>
                    <span className="text-primary">→</span>
                    <span className={slide.outputColor}>{slide.outputLabel}</span>
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Slide indicator dots */}
              <div className="flex items-center justify-center gap-1.5 border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] py-2">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Show ${s.inputLabel} → ${s.outputLabel}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIdx ? "w-4 bg-primary" : "w-1.5 bg-[var(--workspace-border)] hover:bg-primary/40"}`}
                    onClick={() => setSlideIdx(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


type OutputMode = "typescript" | "yaml" | "xml" | "json" | "graph";

const OUTPUT_MODES: OutputMode[] = ["typescript", "yaml", "xml", "json", "graph"];

const MODE_META: Record<OutputMode, { label: string; labelColor: string; statusLabel: string; statusColor: string }> = {
  typescript: { label: "TYPESCRIPT",   labelColor: "text-violet-500",  statusLabel: "JSON \u2192 TypeScript", statusColor: "text-violet-500" },
  yaml:       { label: "YAML",         labelColor: "text-lime-600",    statusLabel: "JSON \u2192 YAML",       statusColor: "text-lime-600" },
  xml:        { label: "XML",          labelColor: "text-red-500",     statusLabel: "JSON \u2192 XML",        statusColor: "text-red-500" },
  json:       { label: "FORMATTED",    labelColor: "text-amber-500",   statusLabel: "JSON Beautify",         statusColor: "text-amber-500" },
  graph:      { label: "GRAPH VIEW",   labelColor: "text-emerald-500", statusLabel: "Graph View",            statusColor: "text-emerald-500" },
};

