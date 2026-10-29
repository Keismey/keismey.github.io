/* Keismey Studio — bouton retour du téléphone (même fichier dans chaque jeu du hub).

   Le jeu appelle KSBack.init({ back, lang }) :
   - back() est appelé à chaque retour (bouton ou geste retour du téléphone, touche Échap).
     Il ferme la fenêtre ouverte, revient à l'écran précédent, met en pause ou ouvre une
     confirmation. Il renvoie 'hub' quand le joueur doit quitter le jeu pour le hub.
   - lang() renvoie 'fr' ou 'en' : la langue du hub qui s'ouvre.
   - title() (facultatif) renvoie true quand l'écran titre est affiché : un bouton « Hub » apparaît
     alors en haut à gauche (hubCorner: 'tr' pour le mettre à droite). C'est la seule sortie sur
     iPhone quand le hub est installé : il n'y a ni bouton ni geste retour.
   KSBack.toHub() quitte vers le hub (par exemple après une confirmation du joueur).

   Le navigateur ne connaît que l'historique de l'onglet. À chaque toucher, on empile
   quelques entrées « tampon » sur la page du jeu (Chrome ignore celles créées sans action
   du joueur) ; chaque retour en consomme une et le jeu décide quoi faire.
   Pour quitter : si on vient du hub, on y revient comme avec un retour normal (position
   de défilement gardée) ; sinon le hub remplace le jeu dans l'historique, et un retour de
   plus ramène là d'où le joueur venait. */
(function () {
  'use strict';
  var N = 10;             // retours d'affilée possibles sans toucher l'écran
  var cfg = null, idx = 0, fromHub = false, leaving = false, resetting = false, timer = 0;

  function state() { try { return history.state; } catch (e) { return null; } }
  function depth(s) { return s && typeof s.ksb === 'number' ? s.ksb : 0; }
  function refIsHub() {
    try {
      var r = new URL(document.referrer);
      return r.origin === location.origin && (r.pathname === '/' || r.pathname === '/index.html');
    } catch (e) { return false; }
  }
  function mark(k) { var s = {}, o = state(); if (o && typeof o === 'object') for (var p in o) s[p] = o[p]; s.ksb = k; s.ksh = fromHub ? 1 : 0; return s; }

  // changement de langue ou rechargement par le jeu : on se souvient qu'on venait du hub
  var dir = location.pathname.split('/')[1] || '';
  function sameGameRef() {
    try { var r = new URL(document.referrer); return r.origin === location.origin && r.pathname.split('/')[1] === dir; } catch (e) { return false; }
  }
  function memo(v) { try { if (v === undefined) return sessionStorage.getItem('ks-hub:' + dir) === '1'; sessionStorage.setItem('ks-hub:' + dir, v ? '1' : '0'); } catch (e) { return false; } }

  (function boot() {
    var s = state();
    fromHub = !!(s && s.ksh) || refIsHub() || (sameGameRef() && memo());
    memo(fromHub);
    idx = depth(s);
    if (idx > 0) {
      // page rechargée (mise à jour, glisser pour actualiser) sur une entrée tampon :
      // on redescend à l'entrée de base pour repartir proprement.
      resetting = true;
      try { history.go(-idx); } catch (e) { resetting = false; }
      return;
    }
    try { history.replaceState(mark(0), ''); } catch (e) {}
  })();

  function topUp(e) {
    if (!cfg || leaving || resetting) return;
    // seulement un vrai geste du joueur : un clic simulé par le jeu (button.click()) créerait des
    // entrées sans action du joueur, que Chrome saute ensuite au retour… et le joueur sortirait du jeu.
    if (e && e.isTrusted === false) return;
    try { if (navigator.userActivation && !navigator.userActivation.isActive) return; } catch (err) {}
    idx = depth(state());
    try { while (idx < N) { idx++; history.pushState(mark(idx), ''); } } catch (e) {}
  }

  function finish() {
    var url = '/' + (cfg && cfg.lang && cfg.lang() === 'en' ? '?lang=en' : '');
    if (fromHub) {
      history.back();
      // filet de sécurité si aucune page ne précède le jeu
      timer = setTimeout(function () { location.replace(url); }, 700);
    } else {
      location.replace(url);
    }
  }

  function toHub() {
    if (leaving) return;
    leaving = true;
    var k = depth(state());
    if (k > 0) history.go(-k); else finish();
  }

  function back(fromKey) {
    var r;
    if (window.KS && window.KS.closeDialog && window.KS.closeDialog()) return;   // fenêtre « Sauvegarde » commune
    try { r = cfg.back(); } catch (e) { r = null; if (window.console) console.error(e); }
    if (r === 'hub' && !fromKey) toHub();
  }

  window.addEventListener('popstate', function (e) {
    var k = depth(e.state);
    if (resetting) { if (k === 0) { resetting = false; idx = 0; } return; }
    if (leaving) { if (k === 0) finish(); return; }
    if (!cfg) { idx = k; return; }
    if (k >= idx) { idx = k; return; }   // bouton « suivant » : rien à faire
    idx = k;
    back(false);
  });

  // chaque action du joueur réarme les entrées tampon
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(function (t) {
    window.addEventListener(t, topUp, true);
  });

  // touche Échap sur ordinateur : même effet, sauf quitter le jeu
  window.addEventListener('keydown', function (e) {
    if (!cfg || e.key !== 'Escape' || e.repeat || e.defaultPrevented) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    back(true);
  });

  // bouton « Hub » de l'écran titre
  var btn = null, btnLang = '';
  function hubButton() {
    var on = false;
    try { on = !!cfg.title() && !leaving; } catch (e) {}
    if (!btn) {
      if (!on || !document.body) return;
      var css = document.createElement('style');
      css.textContent = '.ks-hub{position:fixed;z-index:2147483000;top:calc(env(safe-area-inset-top,0px) + 10px);left:calc(env(safe-area-inset-left,0px) + 10px);' +
        'display:flex;align-items:center;gap:6px;min-width:44px;min-height:44px;margin:0;padding:0 14px 0 12px;box-sizing:border-box;' +
        'border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(10,12,16,.66);color:#fff;' +
        'font:600 15px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:0;text-transform:none;' +
        '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
        '.ks-hub.tr{left:auto;right:calc(env(safe-area-inset-right,0px) + 10px)}.ks-hub[hidden]{display:none}' +
        '.ks-hub:focus-visible{outline:3px solid #fff;outline-offset:2px}.ks-hub svg{width:18px;height:18px;flex:none}';
      document.head.appendChild(css);
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ks-hub' + (cfg.hubCorner === 'tr' ? ' tr' : '');
      btn.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true"><rect x="2" y="2" width="6" height="6" rx="1.5" fill="currentColor"/>' +
        '<rect x="10" y="2" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="2" y="10" width="6" height="6" rx="1.5" fill="currentColor"/>' +
        '<rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor"/></svg><span>Hub</span>';
      // le toucher ne doit pas atteindre l'écran titre (« Touche pour commencer »)
      ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(function (t) {
        btn.addEventListener(t, function (e) { e.stopPropagation(); });
      });
      btn.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); toHub(); });
      document.body.appendChild(btn);
    }
    var l = cfg.lang && cfg.lang() === 'en' ? 'en' : 'fr';
    if (l !== btnLang) {
      btnLang = l;
      btn.title = l === 'en' ? 'Go to the Keismey Studio hub' : 'Aller au hub de Keismey Studio';
      btn.setAttribute('aria-label', btn.title);
    }
    if (btn.hidden === on) btn.hidden = !on;
  }

  window.addEventListener('pagehide', function () { clearTimeout(timer); });
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;            // page revenue depuis le cache du navigateur
    clearTimeout(timer); leaving = false; resetting = false; idx = depth(state());
  });

  window.KSBack = {
    init: function (o) {
      cfg = o;
      if (o && typeof o.title === 'function') { hubButton(); setInterval(function () { if (!document.hidden) hubButton(); }, 300); }
    },
    toHub: toHub,
    fromHub: function () { return fromHub; }
  };
})();
