import { BUILD_ID, UPDATE_CHECK_ENABLED } from "./buildId";

/** Payload served by the static `version.json` file written at build time. */
export interface VersionPayload {
  id: string;
  v: string;
  t: number;
}

const DISMISSED_KEY = "formaty:update-dismissed";
const POLL_INTERVAL_MS = 5 * 60 * 1000;
const VERSION_URL = "/version.json";

/** Pure decision fn: should we surface the "new version" toast given the
 *  current baked id, the freshly fetched remote id, and what the user has
 *  already dismissed? Kept side-effect-free for unit testing. */
export function shouldShowUpdate(
  baked: string,
  remote: string | null,
  dismissed: string | null,
): { show: boolean; remote: string | null } {
  if (!baked) return { show: false, remote };
  if (!remote) return { show: false, remote: null };
  if (remote === baked) return { show: false, remote };
  if (dismissed && dismissed === remote) return { show: false, remote };
  return { show: true, remote };
}

function readDismissed(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

export function dismissUpdate(remote: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISSED_KEY, remote);
  } catch {
    /* private mode / quota - ignore */
  }
}

async function fetchRemote(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(VERSION_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<VersionPayload>;
    if (typeof data.id !== "string" || data.id.length === 0) return null;
    return data.id;
  } catch {
    return null;
  }
}

export type VersionUpdateHandler = (remote: string) => void;

export interface VersionSubscription {
  stop: () => void;
}

/** Polls `version.json` and invokes `onUpdate` when a newer build is live.
 *  Polling cadence: immediate check, every POLL_INTERVAL_MS while the tab is
 *  visible, plus a check on `visibilitychange=visible`. Returns a teardown
 *  fn. Safe to call when `UPDATE_CHECK_ENABLED` is false - it no-ops. */
export function subscribeToVersionUpdates(onUpdate: VersionUpdateHandler): VersionSubscription {
  if (!UPDATE_CHECK_ENABLED) {
    return { stop: () => {} };
  }

  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const check = async () => {
    if (stopped) return;
    const remote = await fetchRemote();
    if (stopped) return;
    const { show, remote: confirmed } = shouldShowUpdate(BUILD_ID, remote, readDismissed());
    if (show && confirmed) onUpdate(confirmed);
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") void check();
  };

  void check();
  timer = setInterval(() => {
    if (document.visibilityState === "visible") void check();
  }, POLL_INTERVAL_MS);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    stop: () => {
      stopped = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
