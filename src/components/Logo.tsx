interface LogoProps {
  size?: number;
  className?: string;
}

/** Brand mark (same geometry as public/logo.svg): an opening brace with an arrow leaving it. */
export function Logo({ size = 24, className = "" }: LogoProps) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} className={`inline-block shrink-0 ${className}`} aria-hidden>
      <rect width="28" height="28" rx="8" fill="#F2B544" />
      <path
        d="M11.5 7c-2.2 0-3 1.1-3 3v1.6c0 1.5-.9 2.4-2.5 2.4 1.6 0 2.5.9 2.5 2.4V18c0 1.9.8 3 3 3M13.5 14h8.5M18.5 10.5 22 14l-3.5 3.5"
        fill="none"
        stroke="#1A1816"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
