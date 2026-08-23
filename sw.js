/* =====================================================
   MarocHubOnline — Service Worker
   -----------------------------------------------------
   - Cache-first l les fichiers dyal sit (icons, manifest)
   - Network-first l index.html (bach l'updates ywsslo)
   - L'requests dyal Firebase kaymchiw direct network
   - Ila bghit tbdl l'version dyal cache: bddel CACHE
     mn "marochub-v1" l "marochub-v2" ...
   ===================================================== */

const CACHE = "marochub-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if(event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  /* Firebase w les sites dyal l'khari: network direct */
  if(url.origin !== self.location.origin) return;

  /* index.html: network-first (updates) + fallback cache (offline) */
  if(event.request.mode === "navigate"){
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  /* Autres fichiers: cache-first */
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if(hit) return hit;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => hit);
    })
  );
});
