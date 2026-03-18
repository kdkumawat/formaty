import type { WorkspaceState } from "./shareState";
import type { FormatKind } from "./formats";
import type { TypeTargetLanguage } from "./json/core";

const API_URL = process.env.FORMATY_API_URL ?? "";

export interface PlaygroundApiPayload {
  input: string;
  format: string;
  options?: Record<string, unknown>;
}

export function mapStateToPayload(state: WorkspaceState): PlaygroundApiPayload {
  return {
    input: state.input,
    format: state.convertToFormat ?? "json",
    options: {
      liveTransform: state.liveTransform,
      outputFormat: state.outputFormat,
      outputLanguage: state.outputLanguage,
      typeLanguage: state.typeLanguage,
      viewMode: state.viewMode,
      activeOperation: state.activeOperation,
      split: state.split,
    },
  };
}

const TYPE_LANGS = ["typescript", "java", "csharp", "python", "go", "protobuf", "kotlin", "swift", "rust", "sql"] as const;

export function mapPayloadToState(payload: PlaygroundApiPayload): WorkspaceState {
  const opts = payload.options ?? {};
  const of = opts.outputFormat;
  const ol = opts.outputLanguage;
  const outputFormat = typeof of === "string" && ["json", "xml", "yaml", "toml", "csv"].includes(of) ? (of as FormatKind) : undefined;
  const outputLanguage = typeof ol === "string" && (["json", "xml", "yaml", "toml", "csv"].includes(ol) || TYPE_LANGS.includes(ol as (typeof TYPE_LANGS)[number]))
    ? (ol as WorkspaceState["outputLanguage"])
    : outputFormat;
  return {
    input: payload.input,
    convertToFormat: (payload.format as FormatKind) || "json",
    liveTransform: opts.liveTransform as boolean | undefined,
    outputFormat,
    outputLanguage: outputLanguage ?? outputFormat,
    typeLanguage: opts.typeLanguage as TypeTargetLanguage | undefined,
    viewMode: ((): WorkspaceState["viewMode"] | undefined => {
      const v = opts.viewMode;
      if (typeof v !== "string") return undefined;
      if (v === "raw" || v === "tree" || v === "graph" || v === "query" || v === "table") return v;
      return undefined;
    })(),
    activeOperation: opts.activeOperation as WorkspaceState["activeOperation"] | undefined,
    split: typeof opts.split === "number" ? opts.split : undefined,
  };
}

export async function savePlayground(state: WorkspaceState): Promise<{ id: string } | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/playground`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapStateToPayload(state)),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string };
    return data.id ? { id: data.id } : null;
  } catch {
    return null;
  }
}

export async function updatePlayground(
  id: string,
  state: WorkspaceState
): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/playground/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapStateToPayload(state)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deletePlayground(id: string): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/playground/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export type LoadPlaygroundResult =
  | { status: "ok"; data: WorkspaceState }
  | { status: "not_found" }
  | { status: "rate_limit" }
  | { status: "error" };

export async function loadPlayground(id: string): Promise<LoadPlaygroundResult> {
  if (!API_URL) return { status: "error" };
  try {
    const res = await fetch(`${API_URL}/playground/${id}`);
    if (res.status === 404) return { status: "not_found" };
    if (res.status === 429) return { status: "rate_limit" };
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as PlaygroundApiPayload;
    return { status: "ok", data: mapPayloadToState(data) };
  } catch {
    return { status: "error" };
  }
}
