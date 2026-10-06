// Keismey Studio — service worker du hub.
// Ne gère QUE les fichiers du hub (et les images qu'il affiche).
// Les jeux gardent leurs propres service workers dans leurs dossiers.
// Changer VERSION à chaque mise en ligne qui touche les polices ou les icônes.
const VERSION = 'hub-1.0.0';
const SHELL = 'shell-' + VERSION;
const IMGS = 'img-v1';

const CORE = [
  '/', '/index.html', '/games.js', '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png', '/icons/favicon.png',
  '/fonts/alegreya.woff', '/fonts/alegreya-italic.woff',
  '/fonts/alegreya-sans-400.woff', '/fonts/alegreya-sans-700.woff'
];
const NETWORK_FIRST = new Set(['/', '/index.html', '/games.js', '/manifest.webmanifest']);
const HUB_PAGES = new Set(['/', '/index.html']);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => (k.startsWith('shell-') && k !== SHELL)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // GitHub API, etc. : réseau direct
  const path = url.pathname;

  // Pages et config du hub : réseau d'abord (mises à jour immédiates), cache si hors ligne
  if (NETWORK_FIRST.has(path)) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(path === '/index.html' ? '/' : path, copy)); }
        return res;
      }).catch(() => caches.match(path === '/index.html' ? '/' : path, { ignoreSearch: true }))
    );
    return;
  }

  // Polices et icônes du hub : cache d'abord
  if (CORE.includes(path)) {
    e.respondWith(caches.match(path).then(r => r || fetch(req)));
    return;
  }

  // Couvertures et icônes de jeux affichées PAR le hub : on garde une copie, rafraîchie en fond.
  // (Tout le reste — y compris les pages des jeux — passe sans être touché.)
  let ref = '';
  try { ref = new URL(req.referrer).pathname; } catch (_) {}
  if (req.destination === 'image' && HUB_PAGES.has(ref)) {
    e.respondWith(
      caches.open(IMGS).then(c => c.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }))
    );
  }
});
