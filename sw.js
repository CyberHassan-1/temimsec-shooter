const CACHE_NAME = 'word-sniper-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './sounds/waiting-loop.mp3',
  './sounds/hack-start.mp3',
  './sounds/hack-static.mp3',
  './sounds/hack-end.mp3',
  './sounds/glitch-ambient.mp3',
  './sounds/glitch-effect.mp3',
  './sounds/alarm.mp3',
  './sounds/count-1.ogg',
  './sounds/count-2.ogg',
  './sounds/count-3.ogg',
  './sounds/kick-impact.mp3',
  './sounds/whoosh.mp3',
  './sounds/ui-hit.mp3',
  './sounds/boom.mp3',
  './sounds/heartbeat.mp3',
  './sounds/error.mp3',
  './sounds/victory.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
