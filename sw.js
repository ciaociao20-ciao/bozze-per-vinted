/* Bozze per Vinted — service worker: rende l'app disponibile anche senza internet.
   Le bozze non passano mai di qui: stanno in IndexedDB nel telefono. */
const CACHE = 'bozze-vinted-1.2.1';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'config.js', 'data.js', 'tags.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('bozze-vinted-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Prima la copia salvata (apertura istantanea, funziona offline), poi aggiornamento in sottofondo. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const hit = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then(res => { if (res && res.ok && res.type === 'basic') cache.put(key, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
