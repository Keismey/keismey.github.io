/* Keismey Studio — outils communs aux jeux du hub (même fichier dans chaque jeu).

   KS.support()                      ouvre la page de soutien (Ko-fi) dans un nouvel onglet
   KS.bug(jeu, lang)                 ouvre le formulaire du hub, type « Bug », titre prérempli avec le nom du jeu
   KS.saveDialog({ jeu, keys, lang })
                                     fenêtre « Sauvegarde » : exporter (code à copier ou fichier) et importer.
                                     keys = clés localStorage de la partie ; la première est la sauvegarde principale.
   Au premier toucher, le jeu demande au navigateur de garder ses données (stockage persistant).
   KS.account                        compte du hub (connexion Google) : le jeu se synchronise tout seul
                                     quand le joueur est connecté ; le hub s'en sert pour l'encart Compte (section 6).

   Import : le code est rangé, la page se recharge, et ce fichier l'écrit dans le stockage AVANT
   que le jeu ne démarre (le jeu ne peut donc pas l'écraser en sauvegardant au moment de quitter). */
(function () {
  'use strict';
  var DIR = location.pathname.split('/')[1] || '';
  var PENDING = 'ks-import:' + DIR;

  // 1. import en attente : appliqué avant le jeu
  try {
    var p = sessionStorage.getItem(PENDING);
    if (p) {
      sessionStorage.removeItem(PENDING);
      var d = JSON.parse(p);
      Object.keys(d).forEach(function (k) {
        if (d[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, d[k]);
      });
    }
  } catch (e) {}

  // 2. stockage persistant, demandé une fois au premier geste du joueur
  var asked = false;
  function persist(e) {
    if (asked || (e && e.isTrusted === false)) return;
    asked = true;
    try {
      if (navigator.storage && navigator.storage.persist && navigator.storage.persisted)
        navigator.storage.persisted().then(function (ok) { if (!ok) navigator.storage.persist().catch(function () {}); }).catch(function () {});
    } catch (err) {}
  }
  window.addEventListener('pointerup', persist, true);
  window.addEventListener('keydown', persist, true);

  // 3. textes
  var TX = {
    fr: { title: 'Sauvegarde', intro: 'Garde ce code ou le fichier en lieu sûr : il permet de retrouver ta partie sur un autre appareil ou après avoir effacé les données du navigateur.',
      copy: 'Copier le code', copied: 'Code copié', file: 'Télécharger le fichier', load: 'Charger une partie',
      paste: 'Colle un code de sauvegarde, ou choisis un fichier.', pick: 'Choisir un fichier', go: 'Charger',
      confirm: 'Remplacer ta partie actuelle par celle-ci ? Ta partie actuelle sera perdue.', yes: 'Oui, remplacer', no: 'Annuler',
      bad: 'Code invalide, ou code d’un autre jeu.', close: 'Fermer', empty: 'Aucune partie à sauvegarder pour l’instant.' },
    en: { title: 'Save', intro: 'Keep this code or the file somewhere safe: it lets you get your game back on another device or after clearing your browser data.',
      copy: 'Copy the code', copied: 'Code copied', file: 'Download the file', load: 'Load a game',
      paste: 'Paste a save code, or choose a file.', pick: 'Choose a file', go: 'Load',
      confirm: 'Replace your current game with this one? Your current game will be lost.', yes: 'Yes, replace', no: 'Cancel',
      bad: 'Invalid code, or a code from another game.', close: 'Close', empty: 'No game to save yet.' }
  };

  // 4. code de sauvegarde : KS1.<jeu>.<base64 du JSON>
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s) { return decodeURIComponent(escape(atob(s))); }
  function makeCode(keys) {
    var d = {}, any = false;
    keys.forEach(function (k) { var v = null; try { v = localStorage.getItem(k); } catch (e) {} d[k] = v; if (v !== null) any = true; });
    return any ? 'KS1.' + DIR + '.' + b64e(JSON.stringify(d)) : '';
  }
  function readCode(txt, keys) {
    try {
      var m = String(txt || '').replace(/\s+/g, '').match(/^KS1\.([^.]*)\.(.+)$/);
      if (!m || m[1] !== DIR) return null;
      var d = JSON.parse(b64d(m[2]));
      if (!d || typeof d !== 'object' || typeof d[keys[0]] !== 'string') return null;
      var out = {};
      keys.forEach(function (k) { out[k] = typeof d[k] === 'string' ? d[k] : null; });
      return out;
    } catch (e) { return null; }
  }

  // 5. fenêtre commune (neutre, sur fond sombre ; la police est celle du jeu)
  var CSS = '#ks-dlg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.66);font:inherit;color:#f3ecdf}' +
    '#ks-dlg .kb{width:min(100%,380px);max-height:calc(100% - 32px);overflow:auto;background:#1d1a22;border:2px solid var(--ks-accent,#c9a45c);border-radius:14px;padding:16px;box-shadow:0 10px 40px rgba(0,0,0,.5)}' +
    '#ks-dlg h2{margin:0 0 8px;font-size:20px}#ks-dlg p{margin:0 0 10px;font-size:14px;line-height:1.4;opacity:.9}' +
    '#ks-dlg textarea{width:100%;box-sizing:border-box;height:84px;margin:0 0 8px;background:#0f0d12;color:#f3ecdf;border:1px solid #4a4452;border-radius:8px;padding:8px;font:12px/1.3 monospace;resize:none}' +
    '#ks-dlg button{display:block;width:100%;margin:0 0 8px;padding:11px 10px;border-radius:10px;border:0;font:inherit;font-weight:700;font-size:15px;background:#3a3442;color:#f3ecdf;cursor:pointer}' +
    '#ks-dlg button.ks-main{background:var(--ks-accent,#c9a45c);color:#16121a}#ks-dlg hr{border:0;border-top:1px solid #3a3442;margin:12px 0}' +
    '#ks-dlg .ks-err{color:#ff8f7a}';

  function saveDialog(o) {
    var L = TX[o.lang === 'en' ? 'en' : 'fr'], keys = o.keys;
    if (document.getElementById('ks-dlg')) return;
    if (!document.getElementById('ks-css')) { var st = document.createElement('style'); st.id = 'ks-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (o.save) try { o.save(); } catch (e) {}
    var code = makeCode(keys);
    var d = document.createElement('div'); d.id = 'ks-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    if (o.accent) d.style.setProperty('--ks-accent', o.accent);
    d.innerHTML = '<div class="kb"><h2>' + L.title + '</h2>' +
      (code ? '<p>' + L.intro + '</p><textarea readonly id="ks-out"></textarea><button class="ks-main" id="ks-copy">' + L.copy + '</button><button id="ks-file">' + L.file + '</button>' : '<p>' + L.empty + '</p>') +
      '<hr><h2>' + L.load + '</h2><p>' + L.paste + '</p><textarea id="ks-in" autocomplete="off" spellcheck="false" placeholder="KS1…"></textarea>' +
      '<button id="ks-pick">' + L.pick + '</button><button class="ks-main" id="ks-go">' + L.go + '</button><p class="ks-err" id="ks-msg" hidden></p>' +
      '<hr><button id="ks-close">' + L.close + '</button><input type="file" id="ks-f" accept=".txt,text/plain" hidden></div>';
    document.body.appendChild(d);
    var $ = function (id) { return d.querySelector('#' + id); };
    var close = function () { d.remove(); };
    if (code) {
      $('ks-out').value = code;
      $('ks-copy').onclick = function () {
        var done = function () { $('ks-copy').textContent = L.copied; };
        try { navigator.clipboard.writeText(code).then(done, function () { $('ks-out').select(); document.execCommand('copy'); done(); }); }
        catch (e) { $('ks-out').select(); try { document.execCommand('copy'); done(); } catch (err) {} }
      };
      $('ks-file').onclick = function () {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
        a.download = (o.file || DIR) + '-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      };
    }
    $('ks-pick').onclick = function () { $('ks-f').click(); };
    $('ks-f').onchange = function () {
      var f = $('ks-f').files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { $('ks-in').value = String(r.result).trim(); }; r.readAsText(f);
    };
    $('ks-go').onclick = function () {
      var data = readCode($('ks-in').value, keys), msg = $('ks-msg');
      if (!data) { msg.textContent = L.bad; msg.hidden = false; return; }
      if ($('ks-go').dataset.sure !== '1') {
        msg.textContent = L.confirm; msg.hidden = false;
        $('ks-go').textContent = L.yes; $('ks-go').dataset.sure = '1';
        return;
      }
      try { sessionStorage.setItem(PENDING, JSON.stringify(data)); } catch (e) { return; }
      location.reload();
    };
    $('ks-close').onclick = close;
    d.addEventListener('pointerdown', function (e) { if (e.target === d) close(); });
    d.ksClose = close;
  }

  // 6. compte et synchro des sauvegardes ---------------------------------------------------------
  //
  //  Le joueur se connecte une fois sur le hub (même adresse que les jeux, donc même stockage) :
  //  chaque jeu est alors synchronisé tout seul. Le jeton est dans localStorage « ks-account »,
  //  l'état de chaque jeu dans « ks-sync.<dossier> » ({ rev, h, lt } : révision en ligne connue,
  //  empreinte de la partie à ce moment-là, dernière modification vue sur cet appareil).
  //
  //  Dans un jeu : à l'ouverture, on compare avec la version en ligne AVANT que le jeu n'ait pu
  //  écrire ; plus récente en ligne et rien de neuf ici → elle est appliquée (rechargement) ; les deux
  //  ont changé → le joueur choisit. Ensuite, envoi toutes les minutes, au passage en arrière-plan et
  //  à la fermeture, seulement si la partie a changé. Sans réseau, le jeu marche comme avant.
  //  Sur le hub : connexion, rapprochement de tous les jeux, choix en cas de conflit (voir KS.account).
  var SYNC_API = 'https://ks-sync.keismeystudio.workers.dev/v1/';   // adresse du Worker ; vide = synchro coupée
  var GOOGLE_ID = '1040718435129-qdccld83hipf8bek5nehb0n8ecmqec9a.apps.googleusercontent.com';  // identifiant client Google (public)
  var PUBLIC = true;   // false = encart Compte du hub visible seulement sur les appareils de test (adresse du hub avec ?compte=test une fois)
  var SAVES = {        // clés de sauvegarde de chaque jeu (dossier → clés), les mêmes que l'export
    'Abysses': ['ab_save', 'ab_rec'],
    'Les-Chasseurs-de-Brume-Haute': ['grande-traque-v1', 'grande-traque-chasse'],
    'legion-eternelle': ['legionEternelle_v2'],
    'Oxyblox': ['keismey-epave-stellaire-v2'],
    'Baffus-Maximus': ['dpdb_save_v1'],
    'Paper-Sniper': ['coupe-papier.v2'],
    'La-Derniere-Forge': ['derniere-forge-save-v1'],
    'Pas-ce-soir': ['pas-ce-soir-v1'],
    'Last-Loop': ['loopexpress.save', 'loopexpress.save.bak'],
    'Le-Necromancien-de-la-Crypte': ['necro_crypte_save'],
    'Le-Cartographe': ['keismey.cartographe.v1', 'keismey.cartographe.v1.bak'],
    'Lanterval': ['lanterval-v1', 'lanterval-v1.bak'],
    'Pico-Clinic': ['pico_save_v1']
  };
  try {   // appareil de test : ?compte=test (active) ou ?compte=off (désactive), retenu sur l'appareil
    var qb = new URLSearchParams(location.search).get('compte');
    if (qb === 'test') localStorage.setItem('ks-beta', '1'); else if (qb === 'off') localStorage.removeItem('ks-beta');
  } catch (e) {}
  var ON = !!SYNC_API, ACC = 'ks-account', STK = 'ks-sync.', APPLIED = 'ks-sync-applied:' + DIR;
  var MAX = 1000000, BEACON = 60000, EVERY = 60000;

  var TS = {
    fr: { got: 'Partie plus récente trouvée sur ton compte, chargement…', ctitle: 'Deux parties différentes',
      cintro: 'La partie de cet appareil et celle de ton compte ont avancé chacune de leur côté. Laquelle veux-tu garder ? L’autre sera remplacée.',
      here: 'Sur cet appareil', online: 'Sur ton compte', keep: 'Garder celle-ci', mod: 'modifiée le ', nosum: 'Partie en cours', later: 'Choisir plus tard' },
    en: { got: 'A newer game was found on your account, loading…', ctitle: 'Two different games',
      cintro: 'The game on this device and the one on your account have each moved on separately. Which one do you want to keep? The other will be replaced.',
      here: 'On this device', online: 'On your account', keep: 'Keep this one', mod: 'changed ', nosum: 'Game in progress', later: 'Decide later' }
  };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function jget(k) { try { return JSON.parse(lsGet(k) || 'null'); } catch (e) { return null; } }
  function token() { var a = jget(ACC); return a && a.t || null; }
  function readSave(jeu) {
    var d = {}, any = false;
    SAVES[jeu].forEach(function (k) { var v = lsGet(k); d[k] = v; if (v !== null) any = true; });
    return { s: JSON.stringify(d), any: any };
  }
  function writeSave(jeu, s) {
    var d = JSON.parse(s);
    SAVES[jeu].forEach(function (k) { lsSet(k, typeof d[k] === 'string' ? d[k] : null); });
  }
  function hash(s) {   // cyrb53 : empreinte rapide, sert seulement à voir si la partie a changé
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, c; i < s.length; i++) { c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
  }
  function getState(jeu) { return jget(STK + jeu); }
  function setState(jeu, o) { lsSet(STK + jeu, JSON.stringify(o)); }
  function clearAll() {
    lsSet(ACC, null);
    Object.keys(SAVES).forEach(function (j) { lsSet(STK + j, null); });
  }
  function api(action, body, keepalive) {
    return fetch(SYNC_API + action, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body),
      keepalive: !!keepalive, credentials: 'omit', cache: 'no-store'
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, json: j }; }, function () { return { status: r.status, json: {} }; });
    });
  }
  function langNow() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'fr') return q;
    } catch (e) {}
    if (/\/en\.html$/.test(location.pathname)) return 'en';
    return (document.documentElement.lang || '').slice(0, 2) === 'en' ? 'en' : 'fr';
  }
  function fmtDate(t, lang) {
    try { return new Date(t).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  // Résumé d'une partie (grade, rang, chapitre…) avec la fonction progress() de la liste des jeux du hub.
  var gamesP = null;
  function gamesList() {
    if (window.GAMES) return Promise.resolve(window.GAMES);
    if (!gamesP) gamesP = fetch('/games.js', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (src) {
      return new Function('window', src + '\n;return window.GAMES;')({});
    }).catch(function () { gamesP = null; return []; });
    return gamesP;
  }
  function summary(jeu, s, lang) {
    return gamesList().then(function (list) {
      var g = (list || []).filter(function (x) { return x.path && x.path.indexOf('/' + jeu + '/') === 0; })[0];
      if (!g || typeof g.progress !== 'function') return null;
      var d; try { d = JSON.parse(s); } catch (e) { return null; }
      // progress() lit localStorage : on lui présente la partie à résumer le temps de l'appel
      var proto = Storage.prototype, orig = proto.getItem, out = null;
      proto.getItem = function (k) { return this === window.localStorage && Object.prototype.hasOwnProperty.call(d, k) ? d[k] : orig.call(this, k); };
      try { out = g.progress(lang); } catch (e) { out = null; } finally { proto.getItem = orig; }
      return out && out.length ? out : null;
    });
  }

  // Fenêtre de choix en cas de conflit (dans un jeu, ou sur le hub pour chaque jeu concerné)
  function conflictDialog(o) {
    var L = TS[o.lang] || TS.fr;
    if (!document.getElementById('ks-css')) { var st = document.createElement('style'); st.id = 'ks-css'; st.textContent = CSS; document.head.appendChild(st); }
    var old = document.getElementById('ks-dlg'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'ks-dlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    if (o.accent) d.style.setProperty('--ks-accent', o.accent);
    var box = function (id, title, when) {
      return '<div style="border:1px solid #4a4452;border-radius:10px;padding:10px 12px 2px;margin:0 0 10px">' +
        '<p style="margin:0 0 4px;font-weight:700;opacity:1">' + title + '</p>' +
        '<p id="ks-sum-' + id + '" style="margin:0 0 4px">' + L.nosum + '</p>' +
        (when ? '<p style="margin:0 0 8px;font-size:13px;opacity:.7">' + L.mod + fmtDate(when, o.lang) + '</p>' : '') +
        '<button class="ks-main" id="ks-keep-' + id + '">' + L.keep + '</button></div>';
    };
    d.innerHTML = '<div class="kb"><h2>' + (o.name ? o.name + ' · ' : '') + L.ctitle + '</h2><p>' + L.cintro + '</p>' +
      box('here', L.here, o.localTime) + box('online', L.online, o.remoteTime) +
      (o.canLater ? '<button id="ks-later">' + L.later + '</button>' : '') + '</div>';
    document.body.appendChild(d);
    summary(o.jeu, o.localData, o.lang).then(function (s) { var p = d.querySelector('#ks-sum-here'); if (s && p) p.textContent = s.join(' · '); });
    summary(o.jeu, o.remoteData, o.lang).then(function (s) { var p = d.querySelector('#ks-sum-online'); if (s && p) p.textContent = s.join(' · '); });
    var done = function (c) { d.remove(); o.onChoice(c); };
    d.querySelector('#ks-keep-here').onclick = function () { done('local'); };
    d.querySelector('#ks-keep-online').onclick = function () { done('remote'); };
    if (o.canLater) d.querySelector('#ks-later').onclick = function () { done(null); };
    d.ksClose = function () { done(null); };
    return d;
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483001;max-width:calc(100% - 32px);padding:10px 16px;border-radius:10px;background:#1d1a22;color:#f3ecdf;font:inherit;font-size:14px;box-shadow:0 6px 24px rgba(0,0,0,.5)';
    document.body.appendChild(t);
  }

  // ---- dans un jeu ----
  function gameSync(jeu) {
    var first = true, ready = false, busy = false, applying = false, open = false, lastCheck = 0;
    try {
      var ap = sessionStorage.getItem(APPLIED);
      if (ap !== null) { sessionStorage.removeItem(APPLIED); setState(jeu, { rev: +ap, h: hash(readSave(jeu).s), lt: Date.now() }); }
    } catch (e) {}
    var snap = readSave(jeu), lastH = hash(snap.s);   // la partie telle qu'elle était avant que le jeu ne démarre

    function noteChange() {   // retient l'heure de la dernière modification vue ici (affichée en cas de conflit)
      var h = hash(readSave(jeu).s);
      if (h !== lastH) { lastH = h; var st = getState(jeu) || { rev: 0, h: '' }; st.lt = Date.now(); setState(jeu, st); }
    }
    function applyRemote(rem) {
      applying = true;
      try { sessionStorage.setItem(PENDING, rem.data); sessionStorage.setItem(APPLIED, String(rem.rev)); } catch (e) { applying = false; return; }
      toast((TS[langNow()] || TS.fr).got);
      setTimeout(function () { location.reload(); }, 700);
    }
    function lost() { clearAll(); ready = false; }
    function check() {
      if (!token() || busy || applying || open || navigator.onLine === false) return;
      busy = true; lastCheck = Date.now();
      var st = getState(jeu);
      api('get', { t: token(), jeu: jeu, have: st ? st.rev : -1 }).then(function (r) {
        busy = false;
        if (r.status === 401) return lost();
        if (r.status !== 200) return;
        var rem = r.json, base = first ? snap : readSave(jeu), cur = readSave(jeu), curH = hash(cur.s);
        var known = st || { rev: 0, h: '' };
        var changedHere = base.any && hash(base.s) !== known.h;
        first = false;
        if (rem.rev <= known.rev) {   // rien de neuf en ligne (ou compte vidé) : on envoie ce qui a changé ici
          if (rem.rev < known.rev) setState(jeu, { rev: rem.rev, h: '', lt: known.lt });
          ready = true; push(false); return;
        }
        if (hash(rem.data) === curH) { setState(jeu, { rev: rem.rev, h: curH, lt: known.lt }); ready = true; return; }
        if (!changedHere || !cur.any) return applyRemote(rem);
        open = true;   // les deux ont changé : le joueur choisit
        conflictDialog({ jeu: jeu, lang: langNow(), localData: cur.s, remoteData: rem.data, localTime: known.lt, remoteTime: rem.updated,
          canLater: true, onChoice: function (c) {
            open = false;
            if (c === 'remote') return applyRemote(rem);
            if (c !== 'local') return;   // plus tard : on redemandera
            var now = readSave(jeu);
            busy = true;
            api('put', { t: token(), jeu: jeu, base: rem.rev, data: now.s }).then(function (p) {
              busy = false;
              if (p.status === 200) { setState(jeu, { rev: p.json.rev, h: hash(now.s), lt: Date.now() }); ready = true; }
              else if (p.status === 401) lost();
              else check();
            }, function () { busy = false; });
          } });
      }, function () { busy = false; });
    }
    function push(leaving) {
      if (!ready || busy || applying || open || !token()) return;
      var cur = readSave(jeu);
      if (!cur.any || cur.s.length > MAX) return;
      var h = hash(cur.s), st = getState(jeu) || { rev: 0, h: '' };
      if (h === st.h) return;
      busy = true;
      api('put', { t: token(), jeu: jeu, base: st.rev, data: cur.s }, leaving && cur.s.length < BEACON).then(function (r) {
        busy = false;
        if (r.status === 200) setState(jeu, { rev: r.json.rev, h: h, lt: st.lt || Date.now() });
        else if (r.status === 409) { ready = false; check(); }   // un autre appareil a envoyé entre-temps
        else if (r.status === 401) lost();
      }, function () { busy = false; });
    }
    function tick(leaving) {
      if (applying) return;
      noteChange();
      if (!ready) check(); else push(leaving);
    }
    check();
    setInterval(function () { tick(false); }, EVERY);
    // Écouteurs de sortie posés APRÈS ceux du jeu (une fois la page chargée) : beaucoup de jeux
    // sauvegardent en passant en arrière-plan ; on envoie ainsi leur toute dernière sauvegarde.
    function bindLeave() {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') tick(true);
        else if (ready && Date.now() - lastCheck > 10000) { ready = false; check(); }   // retour sur le jeu : un autre appareil a peut-être joué
      });
      window.addEventListener('pagehide', function () { tick(true); });
    }
    if (document.readyState === 'complete') bindLeave();
    else window.addEventListener('load', function () { setTimeout(bindLeave, 0); });
    window.addEventListener('online', function () { tick(false); });
  }
  if (ON && SAVES[DIR] && typeof fetch === 'function') gameSync(DIR);

  // ---- sur le hub ----
  var account = {
    enabled: ON && !!GOOGLE_ID && (PUBLIC || !!token() || lsGet('ks-beta') === '1'),
    clientId: GOOGLE_ID,
    games: Object.keys(SAVES),
    signedIn: function () { return !!token(); },
    lastSync: function () { var a = jget(ACC); return a && a.sync || 0; },
    // credential : jeton renvoyé par le bouton « Se connecter avec Google »
    login: function (credential) {
      return api('login', { credential: credential }).then(function (r) {
        if (r.status !== 200 || !r.json.token) throw new Error('login');
        clearAll();
        lsSet(ACC, JSON.stringify({ t: r.json.token, at: Date.now() }));
        return account.reconcile();
      });
    },
    // Rapproche les parties de cet appareil et celles du compte, jeu par jeu.
    // Renvoie { changed, conflicts: [{ jeu, local, remote, rev, updated, lt }] } : les conflits attendent un choix.
    reconcile: function () {
      if (!token()) return Promise.resolve({ changed: false, conflicts: [] });
      return api('list', { t: token(), full: true }).then(function (r) {
        if (r.status === 401) { clearAll(); throw new Error('session'); }
        if (r.status !== 200) throw new Error('list');
        var remote = {}, out = { changed: false, conflicts: [] };
        (r.json.saves || []).forEach(function (s) { remote[s.jeu] = s; });
        var chain = Promise.resolve();
        Object.keys(SAVES).forEach(function (jeu) {
          chain = chain.then(function () {
            var loc = readSave(jeu), lh = hash(loc.s), st = getState(jeu), rem = remote[jeu];
            if (!loc.any && !rem) return;
            if (!rem) return account._put(jeu, loc.s, 0, st, out);
            if (!loc.any) { writeSave(jeu, rem.data); setState(jeu, { rev: rem.rev, h: hash(rem.data) }); out.changed = true; return; }
            if (hash(rem.data) === lh) { setState(jeu, { rev: rem.rev, h: lh, lt: st && st.lt }); return; }
            if (st && st.rev === rem.rev) return account._put(jeu, loc.s, rem.rev, st, out);   // seul cet appareil a avancé
            if (st && st.h === lh) { writeSave(jeu, rem.data); setState(jeu, { rev: rem.rev, h: hash(rem.data) }); out.changed = true; return; }   // seul le compte a avancé
            out.conflicts.push({ jeu: jeu, local: loc.s, remote: rem.data, rev: rem.rev, updated: rem.updated, lt: st && st.lt });
          });
        });
        return chain.then(function () {
          var a = jget(ACC); if (a) { a.sync = Date.now(); lsSet(ACC, JSON.stringify(a)); }
          return out;
        });
      });
    },
    _put: function (jeu, s, base, st, out) {
      if (s.length > MAX) return;
      return api('put', { t: token(), jeu: jeu, base: base, data: s }).then(function (p) {
        if (p.status === 200) setState(jeu, { rev: p.json.rev, h: hash(s), lt: st && st.lt });
      }, function () {});
    },
    // Choix du joueur pour un conflit : 'local' (cette partie part en ligne) ou 'remote' (la partie en ligne arrive ici)
    resolve: function (c, choice) {
      if (choice === 'remote') { writeSave(c.jeu, c.remote); setState(c.jeu, { rev: c.rev, h: hash(c.remote) }); return Promise.resolve(true); }
      return api('put', { t: token(), jeu: c.jeu, base: c.rev, data: c.local }).then(function (p) {
        if (p.status === 200) { setState(c.jeu, { rev: p.json.rev, h: hash(c.local), lt: c.lt }); return true; }
        return false;
      });
    },
    conflictDialog: conflictDialog,
    summary: summary,
    logout: function () {
      var t = token(); clearAll();
      return t ? api('logout', { t: t }).catch(function () {}) : Promise.resolve();
    },
    // Supprime le compte et toutes les sauvegardes en ligne (les parties de cet appareil restent)
    remove: function () {
      return api('delete', { t: token() }).then(function (r) {
        if (r.status !== 200 && r.status !== 401) throw new Error('delete');
        clearAll();
      });
    }
  };

  window.KS = {
    account: account,
    SUPPORT_URL: 'https://ko-fi.com/keismey',
    support: function () { window.open('https://ko-fi.com/keismey', '_blank', 'noopener'); },
    bugUrl: function (jeu, lang) { return '/?contact=bug&jeu=' + encodeURIComponent(jeu || '') + (lang === 'en' ? '&lang=en' : '&lang=fr'); },
    bug: function (jeu, lang) { location.assign(window.KS.bugUrl(jeu, lang)); },
    saveDialog: saveDialog,
    // pour le bouton retour : la fenêtre « Sauvegarde » est-elle ouverte ? la ferme si oui.
    closeDialog: function () { var d = document.getElementById('ks-dlg'); if (!d) return false; if (d.ksClose) d.ksClose(); else d.remove(); return true; }
  };
})();
