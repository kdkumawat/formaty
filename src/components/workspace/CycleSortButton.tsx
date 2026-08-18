import { BarsArrowDownIcon, BarsArrowUpIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/components/workspace/Tooltip";
import type { ListSortMode } from "@/lib/json/listCompare";

/** Single icon cycles none → asc → desc → none (table-style). */
export function CycleSortButton({
  linkBtnClass,
  mode,
  disabled,
  onCycle,
  titlePrefix = "Sort",
}: {
  linkBtnClass: string;
  mode: ListSortMode;
  disabled?: boolean;
  onCycle: () => void;
  titlePrefix?: string;
}) {
  const title =
    mode === "none"
      ? `${titlePrefix}: click for A → Z`
      : mode === "asc"
        ? `${titlePrefix}: A → Z - click for Z → A`
        : `${titlePrefix}: Z → A - click to reset`;
  return (
    <Tooltip content={title}>
    <button
      type="button"
      className={`${linkBtnClass} h-7 min-h-7 w-7 disabled:opacity-40 ${
        mode !== "none" ? "!bg-primary/12 !text-primary" : ""
      }`}
      disabled={disabled}
      onClick={onCycle}
    >
      {mode === "desc" ? (
        <BarsArrowDownIcon className="h-3.5 w-3.5" />
      ) : (
        <BarsArrowUpIcon className={`h-3.5 w-3.5 ${mode === "none" ? "opacity-50" : ""}`} />
      )}
    </button>
    </Tooltip>
  );
}

export function cycleSort(mode: ListSortMode): ListSortMode {
  if (mode === "none") return "asc";
  if (mode === "asc") return "desc";
  return "none";
}
