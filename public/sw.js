const CACHE_NAME = "aira-public-shell-v1";
const PUBLIC_SHELL = ["/offline", "/icon.svg", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  const publicAsset = url.pathname === "/icon.svg" || url.pathname.startsWith("/pwa/") || url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/launch/");
  if (!publicAsset) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (!response.ok || response.type !== "basic") return response;
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    return response;
  })));
});
