/** Build id baked at compile time via `next.config.ts` (`env.NEXT_PUBLIC_BUILD_ID`).
 *  The static export also writes this same id to `out/version.json` so the
 *  client can poll for a newer deploy. Empty string in dev (env var unset)
 *  means the update check is disabled. */
export const BUILD_ID: string = process.env.NEXT_PUBLIC_BUILD_ID ?? "";

/** `true` when running in production and a build id is available. The update
 *  toast polls only then - dev HMR and local file edits would loop otherwise. */
export const UPDATE_CHECK_ENABLED: boolean =
  process.env.NODE_ENV === "production" && BUILD_ID.length > 0;
