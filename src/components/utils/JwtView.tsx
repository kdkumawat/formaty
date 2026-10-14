"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton, EmptyState, InputActions, PaneHeader, StatusText, TextField } from "@/components/kit";
import { Highlighted } from "@/components/Highlighted";
import { editorClass } from "@/components/compare/shared";
import { decodeJwt, prettyJson, utilPlaceholder } from "@/lib/utils/devtools";
import { selectFieldAll, type UtilToolState } from "@/components/utils/state";
import { HMAC, verifyHmac } from "@/components/utils/jwtVerify";
import { TOOL_META } from "@/components/utils/readings";

const MEANING: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  jti: "Token ID",
  name: "Name",
  email: "Email",
  scope: "Scopes",
  iat: "Issued at",
  nbf: "Not before",
  exp: "Expires",
};
const TIME_CLAIMS = new Set(["iat", "nbf", "exp"]);

const utc = (n: number) => `${new Date(n * 1000).toISOString().replace("T", " ").slice(0, 19)} UTC`;
const show = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

type Verdict = "none" | "ok" | "bad" | "unsupported";

/** Numbered, token-coloured JSON. */
function JsonPane({ label, text, children }: { label: string; text: string; children?: React.ReactNode }) {
  const lines = text.split("\n");
  return (
    <section aria-label={label} className="flex min-h-0 min-w-0 flex-1 flex-col bg-sunk border-[var(--workspace-border)] max-[900px]:min-h-[200px] min-[901px]:[&:not(:first-child)]:border-l">
      <PaneHeader
        title={label}
        left={<span className="inline-flex h-[22px] items-center gap-1.5 rounded-sm border border-input px-[7px] font-mono text-[11.5px]"><span className="text-[var(--workspace-text-muted)]">{"{}"}</span>JSON</span>}
        right={<CopyButton variant="secondary" label={`Copy ${label.toLowerCase()}`} getText={() => text} disabled={!text} />}
      />
      <div className="flex max-h-[60%] min-h-0 flex-none overflow-auto bg-sunk py-2 font-mono text-[13px] leading-[1.6]">
        <div aria-hidden className="w-10 shrink-0 select-none pr-3 text-right text-faint">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="m-0 min-w-0 font-[inherit]">
          <Highlighted code={text} lang="json" />
        </pre>
      </div>
      {children}
    </section>
  );
}

export function JwtView({ state, patch }: { state: UtilToolState; patch: (p: Partial<UtilToolState>) => void }) {
  const input = state.input;
  const [secret, setSecret] = useState("");
  const [verdict, setVerdict] = useState<Verdict>("none");

  const jwt = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return decodeJwt(input);
    } catch {
      return null;
    }
  }, [input]);
  const alg = String((jwt?.header as Record<string, unknown> | null)?.alg ?? "");

  useEffect(() => {
    if (!jwt || !secret) return setVerdict("none");
    if (!HMAC[alg]) return setVerdict("unsupported");
    let cancelled = false;
    verifyHmac(jwt.raw, alg, secret)
      .then((ok) => !cancelled && setVerdict(ok ? "ok" : "bad"))
      .catch(() => !cancelled && setVerdict("bad"));
    return () => {
      cancelled = true;
    };
  }, [jwt, alg, secret]);

  const claims = useMemo(() => Object.entries((jwt?.payload ?? {}) as Record<string, unknown>), [jwt]);
  const parts = input.trim().split(".");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:overflow-hidden">
      <section aria-label="Token" className="flex shrink-0 flex-col border-b border-[var(--workspace-border)]">
        <PaneHeader
          title="Token"
          right={
            <InputActions
              samples={[{ id: "sample", label: "Sample" }]}
              onSample={() => patch({ input: TOOL_META.jwt.example })}
              onClear={() => patch({ input: "" })}
              canClear={!!input}
            />
          }
        />
        <textarea
          aria-label="JWT token"
          className={`${editorClass} h-24 min-h-24 flex-none break-all`}
          value={input}
          onChange={(e) => patch({ input: e.target.value })}
          onKeyDown={selectFieldAll}
          placeholder={utilPlaceholder("jwt")}
          spellCheck={false}
        />
        {jwt && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--workspace-border)] px-3 py-1.5 text-[12px] text-[var(--workspace-text-muted)]">
            {(["Header", "Payload", "Signature"] as const).map((name, i) => (
              <span key={name} className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="w-6 border-t-2 border-[var(--workspace-text)]"
                  style={{ borderTopStyle: (["solid", "dotted", "dashed"] as const)[i] }}
                />
                <span className="text-[var(--workspace-text)]">{name}</span>
                <span className="font-mono tabular-nums">{(parts[i] ?? "").length} chars</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {!input.trim() ? (
        <EmptyState title="Nothing to read yet" description="Paste a token above, or use Sample." />
      ) : !jwt ? (
        <p className="px-3 py-3 text-[13px] text-bad">{state.error ?? "This is not a valid JWT."}</p>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col min-[901px]:flex-row">
            <JsonPane label="Header" text={prettyJson(jwt.header)} />
            <JsonPane label="Payload" text={prettyJson(jwt.payload)}>
              {claims.length > 0 && (
                <div className="max-h-[45%] shrink-0 overflow-auto border-t border-[var(--workspace-border)]">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead className="sticky top-0 bg-[var(--workspace-panel)] text-[12px] text-[var(--workspace-text-muted)]">
                      <tr>
                        <th scope="col" className="px-3 py-1 font-medium">Claim</th>
                        <th scope="col" className="px-3 py-1 font-medium">Value</th>
                        <th scope="col" className="px-3 py-1 font-medium">Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map(([k, v]) => (
                        <tr key={k} className="border-t border-[var(--workspace-border)] align-top">
                          <td className="px-3 py-1 font-mono">{k}</td>
                          <td className="break-all px-3 py-1 font-mono">{show(v)}</td>
                          <td className="px-3 py-1 text-[var(--workspace-text-muted)]">
                            {MEANING[k] ?? ""}
                            {TIME_CLAIMS.has(k) && typeof v === "number" ? ` — ${utc(v)}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </JsonPane>
          </div>
          <section aria-label="Signature" className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--workspace-border)] px-3 py-1.5">
            <h2 className="text-[14px] font-semibold">Signature</h2>
            {alg && <span className="font-mono text-[12px] text-[var(--workspace-text-muted)]">{alg}</span>}
            <label htmlFor="jwt-secret" className="text-[12px] text-[var(--workspace-text-muted)]">Secret to verify</label>
            <TextField
              id="jwt-secret"
              type="password"
              autoComplete="off"
              placeholder="Paste the HMAC secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              wrapperClassName="w-64"
            />
            <StatusText tone={verdict === "ok" ? "ok" : verdict === "bad" ? "bad" : "muted"}>
              {verdict === "ok"
                ? "Signature verified"
                : verdict === "bad"
                  ? "Signature does not match"
                  : verdict === "unsupported"
                    ? `${alg || "This algorithm"} cannot be checked here`
                    : "Not verified"}
            </StatusText>
          </section>
        </>
      )}
    </div>
  );
}
