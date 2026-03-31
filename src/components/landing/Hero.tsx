"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon, BoltIcon } from "@heroicons/react/24/outline";

type OutputMode = "typescript" | "yaml" | "xml" | "json" | "graph";

const OUTPUT_MODES: OutputMode[] = ["typescript", "yaml", "xml", "json", "graph"];

const MODE_META: Record<OutputMode, { label: string; labelColor: string; statusLabel: string; statusColor: string }> = {
  typescript: { label: "TYPESCRIPT",   labelColor: "text-violet-500",  statusLabel: "JSON \u2192 TypeScript", statusColor: "text-violet-500" },
  yaml:       { label: "YAML",         labelColor: "text-lime-600",    statusLabel: "JSON \u2192 YAML",       statusColor: "text-lime-600" },
  xml:        { label: "XML",          labelColor: "text-red-500",     statusLabel: "JSON \u2192 XML",        statusColor: "text-red-500" },
  json:       { label: "FORMATTED",    labelColor: "text-amber-500",   statusLabel: "JSON Beautify",         statusColor: "text-amber-500" },
  graph:      { label: "GRAPH VIEW",   labelColor: "text-emerald-500", statusLabel: "Graph View",            statusColor: "text-emerald-500" },
};

function TypeScriptPane() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-violet-400">interface </span><span className="text-sky-400">Root </span><span className="text-[var(--workspace-text)]">{"{"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">user: </span><span className="text-sky-400">User</span><span className="text-[var(--workspace-text)]">;</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"}"}</span>{"\n\n"}
      <span className="text-violet-400">interface </span><span className="text-sky-400">User </span><span className="text-[var(--workspace-text)]">{"{"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">id: </span><span className="text-amber-400">number</span><span className="text-[var(--workspace-text)]">;</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">name: </span><span className="text-amber-400">string</span><span className="text-[var(--workspace-text)]">;</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">roles: </span><span className="text-amber-400">string</span><span className="text-[var(--workspace-text)]">[];</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"}"}</span>
    </pre>
  );
}

function YamlPane() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-sky-500">user</span><span className="text-[var(--workspace-text)]">:</span>{"\n"}
      {"  "}<span className="text-sky-500">id</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">42</span>{"\n"}
      {"  "}<span className="text-sky-500">name</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">Alice</span>{"\n"}
      {"  "}<span className="text-sky-500">roles</span><span className="text-[var(--workspace-text)]">:</span>{"\n"}
      {"    "}<span className="text-[var(--workspace-text)]">- </span><span className="text-emerald-500">admin</span>{"\n"}
      {"    "}<span className="text-[var(--workspace-text)]">- </span><span className="text-emerald-500">dev</span>
    </pre>
  );
}

function XmlPane() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-[var(--workspace-text-muted)]">{"<?"}xml version="1.0"{"?>"}</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">root</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">user</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      {"    "}<span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">id</span><span className="text-[var(--workspace-text)]">{">"}</span><span className="text-amber-500">42</span><span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">id</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      {"    "}<span className="text-[var(--workspace-text)]">{"<"}</span><span className="text-sky-500">name</span><span className="text-[var(--workspace-text)]">{">"}</span><span className="text-emerald-500">Alice</span><span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">name</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">user</span><span className="text-[var(--workspace-text)]">{">"}</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"</"}</span><span className="text-sky-500">root</span><span className="text-[var(--workspace-text)]">{">"}</span>
    </pre>
  );
}

function JsonFormattedPane() {
  return (
    <pre className="font-mono text-[11px] leading-[1.8]">
      <span className="text-[var(--workspace-text)]">{"{"}</span>{"\n"}
      {"  "}<span className="text-sky-500">"user"</span><span className="text-[var(--workspace-text)]">: {"{"}</span>{"\n"}
      {"    "}<span className="text-sky-500">"id"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">42</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
      {"    "}<span className="text-sky-500">"name"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">"Alice"</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
      {"    "}<span className="text-sky-500">"roles"</span><span className="text-[var(--workspace-text)]">: [</span><span className="text-emerald-500">"admin"</span><span className="text-[var(--workspace-text)]">, </span><span className="text-emerald-500">"dev"</span><span className="text-[var(--workspace-text)]">]</span>{"\n"}
      {"  "}<span className="text-[var(--workspace-text)]">{"}"}</span>{"\n"}
      <span className="text-[var(--workspace-text)]">{"}"}</span>
    </pre>
  );
}

function GraphPane() {
  return (
    <div className="flex h-full min-h-[130px] flex-col items-center justify-center gap-3 py-2">
      {/* Simple SVG graph diagram */}
      <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden>
        {/* Edges */}
        <line x1="90" y1="28" x2="42" y2="72" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        <line x1="90" y1="28" x2="138" y2="72" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        <line x1="42" y1="72" x2="20" y2="108" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        <line x1="42" y1="72" x2="64" y2="108" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        {/* Root node */}
        <circle cx="90" cy="24" r="18" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.6)" strokeWidth="1.5" />
        <text x="90" y="28" textAnchor="middle" fontSize="9" fill="rgba(124,58,237,0.9)" fontFamily="monospace">user</text>
        {/* Child: id */}
        <circle cx="42" cy="74" r="15" fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.5)" strokeWidth="1.5" />
        <text x="42" y="78" textAnchor="middle" fontSize="9" fill="rgba(245,158,11,0.9)" fontFamily="monospace">id</text>
        {/* Child: roles */}
        <circle cx="138" cy="74" r="18" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" />
        <text x="138" y="78" textAnchor="middle" fontSize="9" fill="rgba(16,185,129,0.9)" fontFamily="monospace">roles</text>
        {/* Leaf: admin */}
        <circle cx="20" cy="108" r="14" fill="rgba(14,165,233,0.12)" stroke="rgba(14,165,233,0.4)" strokeWidth="1.5" />
        <text x="20" y="112" textAnchor="middle" fontSize="8" fill="rgba(14,165,233,0.9)" fontFamily="monospace">adm</text>
        {/* Leaf: dev */}
        <circle cx="64" cy="108" r="14" fill="rgba(14,165,233,0.12)" stroke="rgba(14,165,233,0.4)" strokeWidth="1.5" />
        <text x="64" y="112" textAnchor="middle" fontSize="8" fill="rgba(14,165,233,0.9)" fontFamily="monospace">dev</text>
      </svg>
      <p className="font-mono text-[10px] font-medium text-emerald-500">Interactive Graph View</p>
    </div>
  );
}

const OUTPUT_PANES: Record<OutputMode, () => React.JSX.Element> = {
  typescript: TypeScriptPane,
  yaml: YamlPane,
  xml: XmlPane,
  json: JsonFormattedPane,
  graph: GraphPane,
};

export function Hero() {
  const [modeIndex, setModeIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setModeIndex((i) => (i + 1) % OUTPUT_MODES.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const mode = OUTPUT_MODES[modeIndex];
  const meta = MODE_META[mode];
  const OutputPane = OUTPUT_PANES[mode];

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
            No signup - Runs locally - Always free
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
              JSON · XML · YAML · TOML · CSV
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

          {/* Format pills - per-format colors */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start"
          >
            {[
              { label: "JSON",       color: "text-amber-500 border-amber-500/25 bg-amber-500/5" },
              { label: "XML",        color: "text-red-500 border-red-500/25 bg-red-500/5" },
              { label: "YAML",       color: "text-lime-600 border-lime-600/25 bg-lime-600/5" },
              { label: "TOML",       color: "text-teal-500 border-teal-500/25 bg-teal-500/5" },
              { label: "CSV",        color: "text-sky-500 border-sky-500/25 bg-sky-500/5" },
              { label: "TypeScript", color: "text-blue-500 border-blue-500/25 bg-blue-500/5" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={`rounded-md border px-2.5 py-0.5 font-mono text-[11px] font-medium ${color}`}
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
                <span className="ml-auto flex items-center gap-1 font-mono text-[10px] font-medium text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Valid
                </span>
              </div>

              {/* Split code panes */}
              <div className="grid grid-cols-2 divide-x divide-[var(--workspace-border)]">
                {/* Input pane - static JSON */}
                <div className="p-4">
                  <p className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]">
                    JSON Input
                  </p>
                  <pre className="font-mono text-[11px] leading-[1.8]">
                    <span className="text-[var(--workspace-text)]">{"{"}</span>{"\n"}
                    {"  "}<span className="text-sky-500">"user"</span><span className="text-[var(--workspace-text)]">: {"{"}</span>{"\n"}
                    {"    "}<span className="text-sky-500">"id"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-amber-500">42</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
                    {"    "}<span className="text-sky-500">"name"</span><span className="text-[var(--workspace-text)]">: </span><span className="text-emerald-500">"Alice"</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
                    {"    "}<span className="text-sky-500">"roles"</span><span className="text-[var(--workspace-text)]">: [</span>{"\n"}
                    {"      "}<span className="text-emerald-500">"admin"</span><span className="text-[var(--workspace-text)]">,</span>{"\n"}
                    {"      "}<span className="text-emerald-500">"dev"</span>{"\n"}
                    {"    "}<span className="text-[var(--workspace-text)]">]</span>{"\n"}
                    {"  "}<span className="text-[var(--workspace-text)]">{"}"}</span>{"\n"}
                    <span className="text-[var(--workspace-text)]">{"}"}</span>
                  </pre>
                </div>

                {/* Output pane - cycles through modes */}
                <div className="relative overflow-hidden p-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <p className={`mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${meta.labelColor}`}>
                        {meta.label}
                      </p>
                      <OutputPane />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Status bar footer */}
              <div className="flex items-center gap-2 border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-1.5">
                <span className="font-mono text-[10px] text-[var(--workspace-text-muted)]">258 B</span>
                <span className="select-none text-[var(--workspace-border)]">·</span>
                <span className="font-mono text-[10px] text-[var(--workspace-text-muted)]">10 lines</span>
                <span className="select-none text-[var(--workspace-border)]">·</span>
                <span className="font-mono text-[10px] text-[var(--workspace-text-muted)]">UTF-8</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={mode}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`ml-auto font-mono text-[10px] font-semibold ${meta.statusColor}`}
                  >
                    {meta.statusLabel}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Mode indicator dots */}
              <div className="flex items-center justify-center gap-1.5 border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] py-2">
                {OUTPUT_MODES.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    aria-label={`Switch to ${m} view`}
                    onClick={() => setModeIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === modeIndex
                        ? "w-4 bg-primary"
                        : "w-1.5 bg-[var(--workspace-border)] hover:bg-[var(--workspace-text-muted)]"
                    }`}
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

// removed old static Hero export
