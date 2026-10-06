// Keismey Studio — service worker du hub.
// Ne gère QUE les fichiers du hub (et les images qu'il affiche).
// Les jeux gardent leurs propres service workers dans leurs dossiers.
// Changer VERSION à chaque mise en ligne qui touche les polices ou les icônes.
const VERSION = 'hub-1.1.0';
const SHELL = 'shell-' + VERSION;
const IMGS = 'img-v1';

const CORE = [
  '/', '/index.html', '/games.js', '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png', '/icons/favicon.png', '/icons/badge-96.png',
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

// ---------- Alertes : nouveaux jeux et grosses mises à jour ----------
// Le hub range son état dans le Cache Storage ({ on, lang, seen: [ids] }).
// À chaque réveil (periodicsync) ou ouverture du hub (message), on relit announcements.json
// et on notifie les annonces pas encore vues.
const STATE_CACHE = 'ks-state', STATE_KEY = '/__ks-state';

async function readState() {
  try { const r = await (await caches.open(STATE_CACHE)).match(STATE_KEY); return r ? await r.json() : {}; } catch (e) { return {}; }
}
async function writeState(st) {
  try { await (await caches.open(STATE_CACHE)).put(STATE_KEY, new Response(JSON.stringify(st), { headers: { 'content-type': 'application/json' } })); } catch (e) {}
}

async function checkNews() {
  const st = await readState();
  if (!st.on) return;
  let list;
  try {
    const r = await fetch('/announcements.json', { cache: 'no-store' });
    if (!r.ok) return;
    list = await r.json();
  } catch (e) { return; }
  const seen = new Set(st.seen || []);
  const fresh = (Array.isArray(list) ? list : []).filter(n => n && n.id && !seen.has(n.id));
  if (!fresh.length) return;
  const lang = st.lang === 'en' ? 'en' : 'fr';
  for (const n of fresh.slice(-3)) {                 // au plus 3 d'un coup : les plus récentes
    const m = n[lang] || n.fr || n.en || {};
    try {
      await self.registration.showNotification(m.title || 'Keismey Studio', {
        body: m.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-96.png',
        tag: 'ks-' + n.id,
        data: { url: n.url || '/' }
      });
    } catch (e) { return; }                         // permission retirée : on n'insiste pas
  }
  fresh.forEach(n => seen.add(n.id));
  st.seen = [...seen];
  await writeState(st);
}

self.addEventListener('periodicsync', e => { if (e.tag === 'ks-news') e.waitUntil(checkNews()); });
self.addEventListener('message', e => { if (e.data && e.data.type === 'ks-check') e.waitUntil(checkNews()); });

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      try { const n = w.navigate ? await w.navigate(url) : null; return (n || w).focus(); } catch (_) { try { return w.focus(); } catch (__) {} }
    }
    return self.clients.openWindow(url);
  })());
});
