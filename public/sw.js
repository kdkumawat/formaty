/* Formaty offline service worker.
   Static export: navigations are network-first (cached copy when offline) and
   hashed /_next/static assets are cache-first (their URLs are immutable).
   Everything else (RSC payloads, version.json, ...) bypasses the cache.
   Bump CACHE to invalidate. */
const CACHE = "formaty-v2.4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;
  const url = new URL(request.url);
  const isStatic = url.pathname.startsWith("/_next/static/");
  // Not a page and not an immutable asset: let the browser handle it (no caching),
  // so update checks like /version.json and ?_rsc= payloads are never stale.
  if (request.mode !== "navigate" && !isStatic) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      // Pages: network-first so returning visitors always get fresh HTML
      // (analytics/meta changes); fall back to cache when offline.
      if (request.mode === "navigate") {
        try {
          const response = await fetch(request);
          if (response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return response;
        } catch {
          return cached || Response.error();
        }
      }
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })(),
  );
});
