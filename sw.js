// sw.js — Service Worker: cache-first für Offline-Spiel und
// Add-to-Home-Screen. Bei jeder Veröffentlichung CACHE-Version erhöhen.

const CACHE = 'ninja-weltraum-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './js/main.js',
  './js/config.js',
  './js/engine/loop.js',
  './js/engine/viewport.js',
  './js/engine/input.js',
  './js/engine/game.js',
  './js/world/camera.js',
  './js/world/physics.js',
  './js/world/levels.js',
  './js/entities/player.js',
  './js/entities/enemies.js',
  './js/entities/projectile.js',
  './js/entities/pickups.js',
  './js/entities/powerups.js',
  './js/ui/render.js',
  './js/ui/screens.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        // Neue gleiche-Origin-Antworten nachträglich cachen.
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
