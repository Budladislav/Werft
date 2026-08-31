/* Верфь service worker: static assets only; private and authenticated responses are never cached. */
const CACHE_NAME = "werft-static-v0.1.2";
const ROUTE_CACHE_NAME = "werft-routes-v0.1.2";
const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/werft.svg",
  "/icons/werft-maskable.svg",
  "/icons/werft-192.png",
  "/icons/werft-512.png",
  "/icons/werft-maskable-512.png",
];
const ROUTE_SHELLS = ["/start", "/overview", "/dock", "/projects", "/journal", "/maintenance", "/ideas", "/settings"];

function isPrivatePath(url) {
  return url.pathname === "/api"
    || url.pathname.startsWith("/api/")
    || url.pathname === "/auth"
    || url.pathname.startsWith("/auth/");
}

function isStaticAsset(request, url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return ["style", "script", "font", "image"].includes(request.destination);
}

function responseCanBeCached(response) {
  if (!response || !response.ok || response.type === "opaque") return false;
  const cacheControl = response.headers.get("cache-control") || "";
  return !/(?:^|,)\s*(?:private|no-store)\b/i.test(cacheControl);
}

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
    caches.open(ROUTE_CACHE_NAME).then((cache) => Promise.all(
      ROUTE_SHELLS.map((path) => fetch(path).then((response) => {
        if (responseCanBeCached(response)) return cache.put(path, response);
        return undefined;
      }).catch(() => undefined)),
    )),
  ]));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== ROUTE_CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivatePath(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (responseCanBeCached(response)) {
        const copy = response.clone();
        event.waitUntil(caches.open(ROUTE_CACHE_NAME).then((cache) => cache.put(request, copy)));
      }
      return response;
    }).catch(async () => (
      await caches.match(request, { ignoreSearch: true })
      || await caches.match("/start")
      || await caches.match("/offline.html")
      || new Response("Верфь недоступна без сети.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    )));
    return;
  }
  if (!isStaticAsset(request, url) && !PRECACHE.includes(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (responseCanBeCached(response)) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
      }
      return response;
    })),
  );
});
