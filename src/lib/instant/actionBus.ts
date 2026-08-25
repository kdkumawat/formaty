/**
 * Bridge between `<InstantApp>` and the workspace `OutputActionBar`. When
 * Instant is the active tool, the workspace chrome (top bar) is the only
 * place reset/share/copy should live; Instant's own header suppresses its
 * bar in embedded mode and registers its handlers here so the workspace
 * bar can call them.
 *
 * Single-tab assumption: at most one Instant mounted at a time.
 */
export interface InstantActions {
  onCopy: () => void;
  onShare: () => void;
  onReset: () => void;
  onDownload: () => void;
  resetLabel?: string;
}

let current: InstantActions | null = null;

export function registerInstantActions(actions: InstantActions | null): void {
  current = actions;
}

export function getInstantActions(): InstantActions | null {
  return current;
}
