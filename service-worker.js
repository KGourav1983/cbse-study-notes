/* =========================================================================
   service-worker.js
   - App shell (HTML/CSS/JS/icons/vendor): cache-first, so the installed
     app opens instantly and works offline.
   - Content (content/index.json and every .md file): network-first with a
     cache fallback, so students studying offline still see the last
     version they loaded, but get fresh notes whenever they're online.
   ========================================================================= */

const SHELL_CACHE = "cbse-prep-shell-v3";
const CONTENT_CACHE = "cbse-prep-content-v3";

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/styles.css",
  "/vendor/marked.min.js",
  "/js/data.js",
  "/js/markdown.js",
  "/js/protection.js",
  "/js/flipcards.js",
  "/js/views.js",
  "/js/theme.js",
  "/js/pwa.js",
  "/js/router.js",
  "/js/app.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== CONTENT_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isContentRequest(url) {
  return url.pathname.startsWith("/content/");
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (isContentRequest(url)) {
    // Network-first, cache fallback — keeps notes available offline.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CONTENT_CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell — cache-first, network fallback.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
