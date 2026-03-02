export type FeatureKey =
  | "graphView"
  | "visualDiff"
  | "schemaImportValidate"
  | "sessionIO"
  | "history"
  | "bookmarks"
  | "shortcuts";

export const FEATURE_FLAGS: Record<FeatureKey, boolean> = {
  graphView: true,
  visualDiff: true,
  schemaImportValidate: true,
  sessionIO: true,
  history: true,
  bookmarks: true,
  shortcuts: true,
};
