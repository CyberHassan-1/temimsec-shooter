/* قناص الكلمات — Service Worker
   - تثبيت لكل ملف على حدة: غياب ملف واحد لا يُفشل التثبيت كاملًا.
   - الصفحة والسكربتات: الشبكة أولًا (فتصل التحديثات تلقائيًا) مع الكاش عند انقطاع الإنترنت.
   - الأصوات والصور: الكاش أولًا (سريعة وتعمل بدون إنترنت).
   - لتحديث الكاش القديم بالكامل غيّر رقم VERSION فقط. */
const VERSION = 'v3';
const CORE_CACHE = 'word-sniper-core-' + VERSION;
const MEDIA_CACHE = 'word-sniper-media-' + VERSION;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];
const SOUND_ASSETS = [
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

async function addEach(cacheName, urls){
  const cache = await caches.open(cacheName);
  await Promise.allSettled(urls.map(u => cache.add(new Request(u, { cache: 'reload' }))));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await addEach(CORE_CACHE, CORE_ASSETS);       // الأساسيات أولًا
    await addEach(MEDIA_CACHE, SOUND_ASSETS);     // ثم الأصوات (الفشل هنا لا يمنع التثبيت)
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [CORE_CACHE, MEDIA_CACHE];
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('word-sniper') && !keep.includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isCacheable(res){ return res && res.status === 200 && (res.type === 'basic' || res.type === 'default'); }

async function networkFirst(req, cacheName, timeoutMs){
  const cache = await caches.open(cacheName);
  try{
    const net = fetch(req);
    const res = await (timeoutMs ? Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))]) : net);
    if(isCacheable(res)) cache.put(req, res.clone()).catch(() => {});
    return res;
  }catch(e){
    const hit = await cache.match(req, { ignoreSearch: true });
    if(hit) return hit;
    if(req.mode === 'navigate'){ const home = await cache.match('./index.html'); if(home) return home; }
    throw e;
  }
}

async function cacheFirst(req, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch: true });
  if(hit) return hit;
  const res = await fetch(req);
  if(isCacheable(res)) cache.put(req, res.clone()).catch(() => {});
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  const isMedia = /\.(mp3|ogg|wav|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname);
  if(isMedia){
    event.respondWith(cacheFirst(req, MEDIA_CACHE));
  } else {
    event.respondWith(networkFirst(req, CORE_CACHE, 4000));
  }
});
