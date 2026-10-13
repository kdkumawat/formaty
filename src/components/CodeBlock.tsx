"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/16/solid";
import { Highlighted } from "@/components/Highlighted";
import { IconButton } from "@/components/kit";
import { toast } from "@/components/Toast";
import type { HighlightLang } from "@/lib/highlight";
import { cn } from "@/lib/utils";

export type CodeLanguage = HighlightLang | "ts";

const LANG_LABEL: Record<CodeLanguage, string> = {
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  toml: "TOML",
  csv: "CSV",
  sql: "SQL",
  bash: "Bash",
  code: "Code",
  ts: "TypeScript",
  text: "Text",
};

/** Code on the page's panel, coloured with the playground editor's token colours. */
export function CodeBlock({
  code,
  language = "text",
  label,
  showCopy = true,
  className,
}: {
  code: string;
  language?: CodeLanguage;
  label?: string;
  showCopy?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ type: "error", message: "Copy failed" });
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] text-[var(--workspace-text)]", className)}>
      {(label || language !== "text") && (
        <div className="flex min-h-9 items-center justify-between gap-2 border-b border-[var(--workspace-border)] px-3 py-1">
          <span className="text-[13px] font-medium text-[var(--workspace-text-muted)]">{label ?? LANG_LABEL[language]}</span>
          {showCopy && (
            <IconButton label={copied ? "Copied" : "Copy code"} onClick={onCopy}>
              {copied ? <CheckIcon /> : <ClipboardDocumentIcon />}
            </IconButton>
          )}
        </div>
      )}
      <pre tabIndex={0} className="m-0 overflow-x-auto px-3 py-2 font-mono text-[13px] leading-[1.6]">
        <code>
          <Highlighted code={code} lang={language === "ts" ? "code" : language} />
        </code>
      </pre>
    </div>
  );
}

/* Side-by-side input / output sample. */
export function CodeSample({
  input,
  output,
  inputLabel = "Input",
  outputLabel = "Output",
  language = "json",
  className,
}: {
  input: string;
  output: string;
  inputLabel?: string;
  outputLabel?: string;
  language?: CodeLanguage;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <CodeBlock code={input} language={language} label={inputLabel} />
      <CodeBlock code={output} language={language} label={outputLabel} />
    </div>
  );
}
