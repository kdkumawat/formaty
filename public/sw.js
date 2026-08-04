/* Formaty does not use a service worker.
   Browsers or leftover registrations may still request /sw.js.
   This file is served as a static asset so it is not captured by /[tool]. */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        for (const client of clients) {
          if ("navigate" in client) client.navigate(client.url);
        }
      })
      .catch(() => undefined),
  );
});
