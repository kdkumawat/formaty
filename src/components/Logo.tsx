"use client";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Brand mark, inline so it can animate (same geometry as public/logo.svg):
 * the braces draw in on mount and the conversion arrows swap on hover.
 * Motion lives in globals.css (`.logo-*`) and is covered by the global
 * reduced-motion rule.
 */
export function Logo({ size = 24, className = "" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`logo-mark inline-block shrink-0 text-primary ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      aria-hidden
    >
      <g transform="translate(34 32) scale(1.9) translate(-32 -32)">
        <path
          className="logo-brace"
          pathLength={1}
          strokeLinecap="round"
          d="M24 18c-4 0-4 4-4 6v2c0 2-2 4-4 4 2 0 4 2 4 4v2c0 2 0 6 4 6"
        />
        <path
          className="logo-brace"
          pathLength={1}
          strokeLinecap="round"
          d="M40 18c4 0 4 4 4 6v2c0 2 2 4 4 4-2 0-4 2-4 4v2c0 2 0 6-4 6"
        />
        <g transform="rotate(-18 32 30)">
          <g className="logo-arrows">
            <path strokeLinecap="round" d="M26 30h12" />
            <path d="M32 24l6 6-6 6" />
            <path d="M32 40l-6-6 6-6" />
          </g>
        </g>
      </g>
    </svg>
  );
}
