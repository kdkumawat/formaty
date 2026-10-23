// Next.js 16 flat config — import the built-in flat configs directly.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".og-gen/**"] },
  ...nextVitals,
  ...nextTs,
  {
    // Scoped like the Next configs above: unscoped, ESLint applies these "react/*" rules to files where that plugin is not registered and aborts.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // React Compiler analysis rules are advisory and noisy for a hand-written codebase
      // (manual useMemo/useCallback + ref access during render). Keep them informative.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/immutability": "off",
      // Stylistic text/entity rules — treat as warnings, not build failures.
      "react/no-unescaped-entities": "warn",
      "react/jsx-no-comment-textnodes": "warn",
    },
  },
];

export default eslintConfig;