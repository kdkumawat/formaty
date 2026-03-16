/**
 * Lightweight curl command parser.
 * Extracts URL, method, headers, and body for fetch execution.
 */

export interface CurlParsed {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Detect if input looks like a curl command.
 */
export function isCurlCommand(input: string): boolean {
  const trimmed = input.trim();
  return (
    trimmed.startsWith("curl ") ||
    trimmed.startsWith("curl\t") ||
    /^\s*curl\s+-[A-Za-z]/.test(trimmed) ||
    /^\s*curl\s+['"]?https?:\/\//.test(trimmed)
  );
}

function tokenizeCurl(cmd: string): string[] {
  const args: string[] = [];
  let i = 0;
  while (i < cmd.length) {
    while (/\s/.test(cmd[i])) i++;
    if (i >= cmd.length) break;
    if (cmd[i] === '"' || cmd[i] === "'") {
      const q = cmd[i];
      let j = i + 1;
      while (j < cmd.length && cmd[j] !== q) {
        if (cmd[j] === "\\") j++;
        j++;
      }
      args.push(cmd.slice(i + 1, j).replace(/\\"/g, '"'));
      i = j + 1;
    } else {
      let j = i;
      while (j < cmd.length && !/\s/.test(cmd[j]) && cmd[j] !== '"' && cmd[j] !== "'") {
        if (cmd[j] === "\\") j++;
        j++;
      }
      args.push(cmd.slice(i, j));
      i = j;
    }
  }
  return args;
}

/**
 * Parse a curl command into fetch-compatible params.
 * Supports: -X, -H, -d, --data, --data-raw, -G, --get, -u (basic auth)
 */
export function parseCurl(input: string): CurlParsed {
  const result: CurlParsed = {
    url: "",
    method: "GET",
    headers: {},
  };

  let cmd = input.replace(/\\\s*\n\s*/g, " ").replace(/\n+/g, " ").trim();
  if (!cmd.toLowerCase().startsWith("curl")) {
    throw new Error("Not a curl command");
  }
  cmd = cmd.slice(4).trim();

  const args = tokenizeCurl(cmd);
  let urlFound = false;
  let hasData = false;

  for (let j = 0; j < args.length; j++) {
    const arg = args[j];
    const next = () => args[j + 1];

    if (arg === "-X" || arg === "--request") {
      result.method = (next() ?? "GET").toUpperCase();
      j++;
      continue;
    }
    if (arg === "-H" || arg === "--header") {
      const h = next();
      if (h) {
        const colon = h.indexOf(":");
        if (colon > 0) {
          const k = h.slice(0, colon).trim();
          const v = h.slice(colon + 1).trim();
          result.headers[k] = v;
        }
      }
      j++;
      continue;
    }
    if (
      arg === "-d" ||
      arg === "--data" ||
      arg === "--data-raw" ||
      arg === "--data-ascii"
    ) {
      const body = next();
      if (body !== undefined) {
        result.body = body;
        hasData = true;
        if (result.method === "GET") result.method = "POST";
      }
      j++;
      continue;
    }
    if (arg === "-u" || arg === "--user") {
      const cred = next();
      if (cred) {
        const b64 = btoa(unescape(encodeURIComponent(cred)));
        result.headers["Authorization"] = `Basic ${b64}`;
      }
      j++;
      continue;
    }
    if (arg === "-G" || arg === "--get") {
      result.method = "GET";
      continue;
    }
    if (arg.startsWith("http://") || arg.startsWith("https://")) {
      result.url = arg;
      urlFound = true;
      continue;
    }
    if (!arg.startsWith("-") && !urlFound && /^https?:\/\//i.test(arg)) {
      result.url = arg;
      urlFound = true;
    }
  }

  if (!result.url) {
    throw new Error("Could not find URL in curl command");
  }

  if (hasData && result.method === "GET") {
    result.method = "POST";
  }

  if (result.body && !result.headers["Content-Type"]) {
    const looksJson =
      result.body.trim().startsWith("{") || result.body.trim().startsWith("[");
    result.headers["Content-Type"] = looksJson
      ? "application/json"
      : "application/x-www-form-urlencoded";
  }

  return result;
}

/**
 * Execute a parsed curl command via fetch.
 */
export async function executeCurl(parsed: CurlParsed): Promise<string> {
  const init: RequestInit = {
    method: parsed.method,
    headers: parsed.headers,
  };
  if (parsed.body && parsed.method !== "GET") {
    init.body = parsed.body;
  }
  const res = await fetch(parsed.url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return text;
}
