interface LogoProps {
  size?: number;
  className?: string;
  /** Show the "formaty" wordmark beside the mark. */
  wordmark?: boolean;
}

/** Brand mark: three rounded bars like pretty-printed code, the middle one indented. The one shared mark (app/icon.svg and public/logo.svg use the same geometry). */
export function Logo({ size = 24, className = "", wordmark = false }: LogoProps) {
  const mark = (
    <svg viewBox="0 0 20 20" width={size} height={size} className={`inline-block shrink-0 ${wordmark ? "" : className}`} aria-hidden>
      <rect x="2" y="2.5" width="16" height="3" rx="1.5" fill="#F2B544" />
      <rect x="6" y="8.5" width="10" height="3" rx="1.5" fill="#F2B544" />
      <rect x="2" y="14.5" width="13" height="3" rx="1.5" fill="#F2B544" />
    </svg>
  );
  if (!wordmark) return mark;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark}
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">formaty</span>
    </span>
  );
}
