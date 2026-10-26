/* Keismey Studio — serveur de synchro des sauvegardes (Cloudflare Worker + base D1).

   Le joueur se connecte avec Google sur le hub. On ne garde de lui que l'empreinte (SHA-256)
   de son identifiant Google : ni nom, ni e-mail, ni photo. Chaque appareil reçoit un jeton
   de session ; la base n'en garde que l'empreinte.

   Toutes les requêtes sont des POST en text/plain avec un corps JSON (pas de requête
   préalable CORS, et l'envoi à la fermeture d'un jeu fonctionne). Le jeton voyage dans le
   corps, jamais dans l'adresse.

     POST /v1/login    { credential }               → { token }
     POST /v1/logout   { t }                        → { ok }
     POST /v1/list     { t, full? }                 → { saves: [{ jeu, rev, updated, data? }] }
     POST /v1/get      { t, jeu, have? }            → { rev, updated, data? }   (data omis si rev = have ; rev 0 = rien en ligne)
     POST /v1/put      { t, jeu, base, data }       → { rev, updated }  ou 409 { conflict, rev, updated }
     POST /v1/delete   { t }                        → { ok }            (compte, appareils et sauvegardes)

   Notifications push (cloche du hub), sans compte :
     POST /v1/push/key          {}                  → { key }   clé publique VAPID (créée au premier appel, gardée dans la base)
     POST /v1/push/subscribe    { endpoint }        → { ok }    adresse d'abonnement donnée par le navigateur
     POST /v1/push/unsubscribe  { endpoint }        → { ok }
     POST /v1/push/status       {}                  → état de l'envoi (abonnés par service, dernière annonce, journal du dernier lot)
   Chaque minute (déclencheur Cron « * * * * * »), toutes les 5 minutes seulement si rien n'est en cours :
   le Worker relit announcements.json ; si la dernière annonce est nouvelle, il « réveille » chaque abonné
   par lots de PUSH_BATCH (push sans contenu : le service worker du hub lit lui-même l'annonce et l'affiche).

   Réglages du Worker (Settings → Variables and Secrets / Bindings) :
     DB                 liaison vers la base D1 (schema.sql)
     GOOGLE_CLIENT_ID   identifiant client OAuth Google (pas un secret)
     ORIGINS            facultatif : origines autorisées en plus de https://keismey.github.io, séparées par des virgules
     HUB                facultatif, pour les tests : adresse du hub (par défaut https://keismey.github.io)
     JWKS_URL           facultatif, pour les tests : adresse des clés publiques à la place de celles de Google */

const MAX_DATA = 1000000;          // 1 Mo par jeu
const MAX_GAMES = 60;              // jeux par joueur
const SESSION_IDLE = 400 * 86400e3; // un appareil inutilisé plus d'un an est déconnecté
const GOOGLE_JWKS = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISS = ['accounts.google.com', 'https://accounts.google.com'];
const JEU_RE = /^[A-Za-z0-9-]{1,48}$/;
const PUSH_BATCH = 40;             // le forfait gratuit permet 50 requêtes sortantes par exécution
const PUSH_HOSTS = /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)$/;

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = allowedOrigin(origin, env);
    const cors = {
      'Access-Control-Allow-Origin': allowed ? origin : 'https://keismey.github.io',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const reply = (status, obj) => new Response(JSON.stringify(obj), {
      status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
    if (!allowed) return reply(403, { error: 'origin' });
    if (req.method !== 'POST') return reply(405, { error: 'method' });

    const action = new URL(req.url).pathname.replace(/^\/v1\//, '');
    let body;
    try {
      const txt = await req.text();
      if (txt.length > MAX_DATA + 4096) return reply(413, { error: 'too_big' });
      body = JSON.parse(txt);
      if (!body || typeof body !== 'object') throw 0;
    } catch (e) { return reply(400, { error: 'json' }); }

    try {
      if (action === 'login') return reply(200, await login(env, body.credential));
      if (action === 'push/key') return reply(200, { key: (await vapid(env)).pub });
      if (action === 'push/status') {
        const per = (await env.DB.prepare("SELECT substr(endpoint, 9, instr(substr(endpoint, 9), '/') - 1) AS host, COUNT(*) AS n FROM push GROUP BY host").all()).results || [];
        return reply(200, { subs: per, last: await meta(env, 'push_last'), job: await meta(env, 'push_job'), log: await meta(env, 'push_log'), tick: await meta(env, 'push_tick') });
      }
      if (action === 'push/subscribe' || action === 'push/unsubscribe') {
        const ep = pushEndpoint(body.endpoint);
        if (!ep) return reply(400, { error: 'endpoint' });
        if (action === 'push/subscribe') await env.DB.prepare('INSERT OR IGNORE INTO push (endpoint, created) VALUES (?, ?)').bind(ep, Date.now()).run();
        else await env.DB.prepare('DELETE FROM push WHERE endpoint = ?').bind(ep).run();
        return reply(200, { ok: true });
      }
      const uid = await auth(env, body.t);
      if (!uid) return reply(401, { error: 'session' });
      const now = Date.now();

      if (action === 'logout') {
        await env.DB.prepare('DELETE FROM sessions WHERE th = ?').bind(await sha(body.t)).run();
        return reply(200, { ok: true });
      }
      if (action === 'list') {
        const cols = body.full ? 'jeu, rev, updated, data' : 'jeu, rev, updated';
        const r = await env.DB.prepare('SELECT ' + cols + ' FROM saves WHERE uid = ?').bind(uid).all();
        return reply(200, { saves: r.results || [] });
      }
      if (action === 'get') {
        if (!JEU_RE.test(body.jeu || '')) return reply(400, { error: 'jeu' });
        const row = await env.DB.prepare('SELECT rev, updated, data FROM saves WHERE uid = ? AND jeu = ?').bind(uid, body.jeu).first();
        if (!row) return reply(200, { rev: 0, updated: 0 });
        if (body.have === row.rev) return reply(200, { rev: row.rev, updated: row.updated });
        return reply(200, row);
      }
      if (action === 'put') {
        if (!JEU_RE.test(body.jeu || '')) return reply(400, { error: 'jeu' });
        if (!validData(body.data)) return reply(400, { error: 'data' });
        if (body.data.length > MAX_DATA) return reply(413, { error: 'too_big' });
        const base = Number.isInteger(body.base) ? body.base : -1;
        if (base === 0) {
          // première sauvegarde de ce jeu pour ce joueur
          const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM saves WHERE uid = ?').bind(uid).first();
          if (n && n.n >= MAX_GAMES) return reply(400, { error: 'too_many' });
          const ins = await env.DB.prepare('INSERT OR IGNORE INTO saves (uid, jeu, rev, updated, data) VALUES (?, ?, 1, ?, ?)')
            .bind(uid, body.jeu, now, body.data).run();
          if (ins.meta && ins.meta.changes === 1) return reply(200, { rev: 1, updated: now });
        } else if (base > 0) {
          const up = await env.DB.prepare('UPDATE saves SET rev = rev + 1, updated = ?, data = ? WHERE uid = ? AND jeu = ? AND rev = ?')
            .bind(now, body.data, uid, body.jeu, base).run();
          if (up.meta && up.meta.changes === 1) return reply(200, { rev: base + 1, updated: now });
        }
        // la sauvegarde en ligne a changé depuis (autre appareil) : le joueur choisira
        const cur = await env.DB.prepare('SELECT rev, updated FROM saves WHERE uid = ? AND jeu = ?').bind(uid, body.jeu).first();
        return reply(409, { conflict: true, rev: cur ? cur.rev : 0, updated: cur ? cur.updated : 0 });
      }
      if (action === 'delete') {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM saves WHERE uid = ?').bind(uid),
          env.DB.prepare('DELETE FROM sessions WHERE uid = ?').bind(uid),
          env.DB.prepare('DELETE FROM users WHERE uid = ?').bind(uid)
        ]);
        return reply(200, { ok: true });
      }
      return reply(404, { error: 'action' });
    } catch (e) {
      if (e && e.status) return reply(e.status, { error: e.code });
      console.log('erreur', e && e.stack || e);
      return reply(500, { error: 'server' });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(pushTick(env, event.scheduledTime || Date.now()).catch(e => console.log('push', e && e.stack || e)));
  }
};

// ---------- notifications push ----------

function pushEndpoint(s) {
  if (typeof s !== 'string' || s.length > 1000) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && PUSH_HOSTS.test(u.hostname) ? u.href : null;
  } catch (e) { return null; }
}

async function meta(env, k) {
  const r = await env.DB.prepare('SELECT v FROM meta WHERE k = ?').bind(k).first();
  return r ? JSON.parse(r.v) : null;
}
async function setMeta(env, k, v) {
  if (v === null) return env.DB.prepare('DELETE FROM meta WHERE k = ?').bind(k).run();
  return env.DB.prepare('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, JSON.stringify(v)).run();
}

// Clés VAPID : créées une fois, la clé privée ne quitte jamais la base
let VAPID = null;
async function vapid(env) {
  if (VAPID) return VAPID;
  let v = await meta(env, 'vapid');
  if (!v) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
    v = { pub: b64url(raw), jwk: await crypto.subtle.exportKey('jwk', kp.privateKey) };
    await env.DB.prepare('INSERT OR IGNORE INTO meta (k, v) VALUES (?, ?)').bind('vapid', JSON.stringify(v)).run();
    v = await meta(env, 'vapid');   // si deux appels simultanés : on garde celle qui a été enregistrée
  }
  VAPID = { pub: v.pub, key: await crypto.subtle.importKey('jwk', v.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']) };
  return VAPID;
}
async function vapidHeader(env, endpoint, cache) {
  const aud = new URL(endpoint).origin;
  if (cache[aud]) return cache[aud];
  const v = await vapid(env), enc = o => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = enc({ typ: 'JWT', alg: 'ES256' }) + '.' + enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://keismey.github.io/' });
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.key, new TextEncoder().encode(unsigned)));
  return (cache[aud] = 'vapid t=' + unsigned + '.' + b64url(sig) + ', k=' + v.pub);
}

async function pushTick(env, now) {
  await setMeta(env, 'push_tick', new Date(now).toISOString());   // dernier passage du déclencheur Cron
  let job = await meta(env, 'push_job');
  const minute = Math.floor(now / 60000);
  if (!job && minute % 5 !== 0) return;   // au calme : on ne relit les annonces que toutes les 5 minutes
  if (!job) {
    const hub = env.HUB || 'https://keismey.github.io';
    const r = await fetch(hub + '/announcements.json?t=' + minute, { headers: { 'Cache-Control': 'no-cache' } });
    if (!r.ok) return;
    const list = await r.json();
    const last = Array.isArray(list) && list.length ? list[list.length - 1] : null;
    if (!last || !last.id) return;
    const done = await meta(env, 'push_last');
    if (done === last.id) return;
    await setMeta(env, 'push_last', last.id);
    if (done === null) return;            // tout premier passage : on retient l'annonce actuelle sans l'envoyer
    job = { id: last.id, after: '' };
  }
  const subs = (await env.DB.prepare('SELECT endpoint FROM push WHERE endpoint > ? ORDER BY endpoint LIMIT ?').bind(job.after, PUSH_BATCH).all()).results || [];
  const cache = {}, gone = [], log = { at: new Date(now).toISOString(), id: job.id, n: subs.length, status: {}, err: [] };
  await Promise.all(subs.map(async s => {
    const host = new URL(s.endpoint).hostname;
    try {
      const res = await fetch(s.endpoint, { method: 'POST', body: '', headers: {
        Authorization: await vapidHeader(env, s.endpoint, cache), TTL: '86400', Urgency: 'normal'
      } });
      log.status[host + ' ' + res.status] = (log.status[host + ' ' + res.status] || 0) + 1;
      if (res.status === 404 || res.status === 410) gone.push(s.endpoint);   // abonnement expiré ou retiré
      else if (res.status >= 400 && log.err.length < 3) log.err.push(host + ' ' + res.status + ' ' + (await res.text()).slice(0, 200));
    } catch (e) {
      log.status[host + ' erreur'] = (log.status[host + ' erreur'] || 0) + 1;
      if (log.err.length < 3) log.err.push(host + ' ' + String(e && e.message || e).slice(0, 200));
    }
  }));
  await setMeta(env, 'push_log', log);
  if (gone.length) await env.DB.batch(gone.map(ep => env.DB.prepare('DELETE FROM push WHERE endpoint = ?').bind(ep)));
  if (subs.length < PUSH_BATCH) await setMeta(env, 'push_job', null);
  else await setMeta(env, 'push_job', { id: job.id, after: subs[subs.length - 1].endpoint });
}

function allowedOrigin(origin, env) {
  if (origin === 'https://keismey.github.io') return true;
  const extra = String(env.ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return extra.includes(origin);
}

// Une sauvegarde = objet JSON { clé: texte ou null }, tel que le produit ks-studio.js
function validData(s) {
  if (typeof s !== 'string') return false;
  try {
    const d = JSON.parse(s);
    if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
    return Object.keys(d).length <= 20 && Object.values(d).every(v => v === null || typeof v === 'string');
  } catch (e) { return false; }
}

// ---------- sessions ----------

async function login(env, credential) {
  const sub = await verifyGoogle(env, credential);
  const uid = await sha('ks-google:' + sub);
  const now = Date.now();
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO users (uid, created) VALUES (?, ?)').bind(uid, now),
    env.DB.prepare('INSERT INTO sessions (th, uid, created, used) VALUES (?, ?, ?, ?)').bind(await sha(token), uid, now, now),
    env.DB.prepare('DELETE FROM sessions WHERE used < ?').bind(now - SESSION_IDLE)
  ]);
  return { token };
}

async function auth(env, t) {
  if (typeof t !== 'string' || t.length < 20 || t.length > 100) return null;
  const th = await sha(t);
  const row = await env.DB.prepare('SELECT uid, used FROM sessions WHERE th = ?').bind(th).first();
  if (!row) return null;
  const now = Date.now();
  if (now - row.used > 86400e3) await env.DB.prepare('UPDATE sessions SET used = ? WHERE th = ?').bind(now, th).run();
  return row.uid;
}

// ---------- vérification du jeton Google (JWT signé RS256) ----------

let JWKS = null, JWKS_UNTIL = 0;
async function keys(env) {
  if (JWKS && Date.now() < JWKS_UNTIL) return JWKS;
  const r = await fetch(env.JWKS_URL || GOOGLE_JWKS);
  if (!r.ok) throw { status: 502, code: 'jwks' };
  const m = /max-age=(\d+)/.exec(r.headers.get('Cache-Control') || '');
  JWKS = (await r.json()).keys || [];
  JWKS_UNTIL = Date.now() + Math.min(m ? +m[1] * 1000 : 3600e3, 6 * 3600e3);
  return JWKS;
}

async function verifyGoogle(env, jwt) {
  const bad = { status: 401, code: 'credential' };
  if (typeof jwt !== 'string' || jwt.length > 4096) throw bad;
  const parts = jwt.split('.');
  if (parts.length !== 3) throw bad;
  let head, claims;
  try { head = JSON.parse(unb64(parts[0])); claims = JSON.parse(unb64(parts[1])); } catch (e) { throw bad; }
  if (head.alg !== 'RS256') throw bad;
  let jwk = (await keys(env)).find(k => k.kid === head.kid);
  if (!jwk) { JWKS = null; jwk = (await keys(env)).find(k => k.kid === head.kid); }   // clés renouvelées
  if (!jwk) throw bad;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64bytes(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) throw bad;
  const now = Date.now() / 1000;
  if (!env.GOOGLE_CLIENT_ID || claims.aud !== env.GOOGLE_CLIENT_ID) throw bad;
  if (!GOOGLE_ISS.includes(claims.iss)) throw bad;
  if (!(claims.exp > now - 60) || (claims.iat && claims.iat > now + 300)) throw bad;
  if (typeof claims.sub !== 'string' || !claims.sub) throw bad;
  return claims.sub;
}

// ---------- outils ----------

async function sha(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function b64url(bytes) {
  let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64bytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function unb64(s) { return new TextDecoder().decode(unb64bytes(s)); }
