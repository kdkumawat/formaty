import { useIconAnimation, type AnimatedIconHandle } from "@/components/icons";

function TriggerIcon({
  Icon,
  iconRef,
  className,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  iconRef: React.Ref<AnimatedIconHandle>;
  className?: string;
}) {
  const Animated = Icon as React.ComponentType<{ className?: string; ref?: React.Ref<AnimatedIconHandle> }>;
  return <Animated ref={iconRef} className={className} />;
}

/** Brand-tinted 2-letter badges for the Types trigger (no icon dependency). */
const TYPE_BADGES: Record<string, { text: string; bg: string; fg: string }> = {
  typescript: { text: "TS", bg: "#3178c6", fg: "#fff" },
  zod: { text: "Z", bg: "#1e3a8a", fg: "#fff" },
  java: { text: "Jv", bg: "#e76f00", fg: "#fff" },
  csharp: { text: "C#", bg: "#68217a", fg: "#fff" },
  python: { text: "Py", bg: "#3776ab", fg: "#ffd43b" },
  pydantic: { text: "Pd", bg: "#3d7ea6", fg: "#fff" },
  go: { text: "Go", bg: "#00add8", fg: "#00273b" },
  protobuf: { text: "Pb", bg: "#4f5b93", fg: "#fff" },
  kotlin: { text: "Kt", bg: "#7f52ff", fg: "#fff" },
  swift: { text: "Sw", bg: "#f05138", fg: "#fff" },
  rust: { text: "Rs", bg: "#ce422b", fg: "#fff" },
  sql: { text: "SQL", bg: "#336791", fg: "#fff" },
  fetch: { text: "JS", bg: "#f7df1e", fg: "#000" },
  axios: { text: "JS", bg: "#5a29e4", fg: "#fff" },
};

function TypeBadge({ id }: { id: string }) {
  const b = TYPE_BADGES[id] ?? { text: id.slice(0, 2).toUpperCase(), bg: "var(--workspace-border)", fg: "var(--workspace-text-muted)" };
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[7px] font-bold"
      style={{ backgroundColor: b.bg, color: b.fg }}
      aria-hidden
    >
      {b.text}
    </span>
  );
}

/**
 * Pinned toolbar button (non-compact mode): label plus an animated-capable
 * icon. Static heroicons glyphs ignore the animation ref; the itsHover-style
 * icons (JSON braces, sparkles, …) nudge on hover/focus. `leading` (e.g. a
 * TypeBadge) overrides the icon slot entirely.
 */
function PinnedToolbarButton({
  leading,
  icon,
  label,
  active = false,
  disabled = false,
  btnClass,
  activeClass,
  onClick,
}: {
  leading?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  btnClass: string;
  activeClass: string;
  onClick: () => void;
}) {
  const iconAnim = useIconAnimation();
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${btnClass} ${active ? activeClass : ""}`}
      onClick={onClick}
      {...iconAnim.bind}
    >
      {leading ??
        (icon ? (
          <TriggerIcon
            Icon={icon}
            iconRef={iconAnim.ref}
            className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-[var(--workspace-text-muted)]"}`}
          />
        ) : null)}
      <span>{label}</span>
    </button>
  );
}

export { TriggerIcon, TypeBadge, PinnedToolbarButton };
