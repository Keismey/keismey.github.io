/*
  Keismey Studio — liste des jeux du hub.

  Pour ajouter un jeu : copier un bloc, changer les champs, pousser.
  - path    : adresse du jeu sur keismey.github.io (= nom du dépôt GitHub)
  - repo    : nom du dépôt, pour afficher la date de mise à jour
  - cover   : image de couverture (n'importe quelle image du jeu, format paysage idéal)
  - focus   : point de cadrage de la couverture (object-position CSS)
  - color   : couleur de fond quand le jeu est à l'écran
  - accent  : couleur du bouton « Jouer »
  - extra   : liens secondaires (autre langue, etc.)
  - en      : ce qui change quand le hub est en anglais (genre, tagline, path, extra…).
              Sans path anglais, le jeu s'ouvre dans sa version française (frOnly: true l'indique).
  - progress: lit la sauvegarde du jeu (même adresse = même stockage) et renvoie
              une liste de petites infos à afficher, ou null s'il n'y a pas de partie.
              Reçoit la langue du hub ('fr' ou 'en'). Lecture seule : le hub n'écrit jamais
              dans les sauvegardes des jeux.
*/
window.GAMES = [
  {
    id: 'abysses',
    name: 'Abysses',
    genre: 'Pêche nocturne',
    tagline: 'Pêche de nuit, vends ta prise au village et perce les secrets des abysses.',
    path: '/Abysses/',
    repo: 'Abysses',
    cover: '/Abysses/a/75e83e3367e3.webp',
    focus: '50% 46%',
    color: '#05232b',
    accent: '#46c9b4',
    extra: [{ label: 'Play in English', path: '/Abysses/en.html' }],
    en: {
      genre: 'Night fishing',
      tagline: 'Fish by night, sell your catch in the village and uncover the secrets of the abyss.',
      path: '/Abysses/en.html',
      extra: [{ label: 'Jouer en Français', path: '/Abysses/' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('ab_save') || 'null');
      if (!s) return null;
      const en = lang === 'en', out = [];
      if (s.day) out.push((en ? 'Day ' : 'Jour ') + s.day);
      if (typeof s.gold === 'number') out.push(fmt(s.gold, lang) + (en ? ' gold' : ' or'));
      return out;
    }
  },
  {
    id: 'brume-haute',
    name: 'Les Chasseurs de Brume-Haute',
    genre: 'Chasse au tour par tour',
    tagline: 'Traque des monstres au tour par tour, forge ton équipement avec leurs restes et monte en rang.',
    path: '/Les-Chasseurs-de-Brume-Haute/',
    repo: 'Les-Chasseurs-de-Brume-Haute',
    // bannière du jeu, version jour ou nuit selon l'heure
    cover: () => {
      const h = new Date().getHours();
      return '/Les-Chasseurs-de-Brume-Haute/img/banniere-' + (h >= 7 && h < 20 ? 'jour' : 'nuit') + '.webp';
    },
    focus: '50% 60%',
    color: '#1d2a22',
    accent: '#a9c46a',
    // pas encore de version anglaise : le jeu s'ouvre en français
    en: {
      genre: 'Turn-based hunting',
      tagline: 'Track monsters turn by turn, forge your gear from their remains and climb the ranks.',
      frOnly: true
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('grande-traque-v1') || 'null');
      if (!s) return null;
      const en = lang === 'en', out = [];
      const hunts = s.cleared ? Object.values(s.cleared).reduce((a, n) => a + (Number(n) || 0), 0) : 0;
      out.push(hunts + (en ? (hunts === 1 ? ' successful hunt' : ' successful hunts') : (hunts > 1 ? ' chasses réussies' : ' chasse réussie')));
      if (typeof s.zenny === 'number') out.push(fmt(s.zenny, lang) + ' z');
      return out;
    }
  },
  {
    id: 'legion-eternelle',
    name: 'Légion Éternelle',
    genre: 'Idle RPG',
    tagline: 'Ta légion se bat même quand tu dors. Équipe-la, garde tes ultimes pour les boss et repousse le mur.',
    path: '/legion-eternelle/?lang=fr',
    repo: 'legion-eternelle',
    icon: '/legion-eternelle/assets/icon-192.png',
    cover: '/legion-eternelle/assets/title-bg.webp',
    focus: '50% 78%',
    color: '#0b0b10',
    accent: '#f2c94c',
    // le jeu est bilingue : ?lang= choisit la langue d'une nouvelle partie
    extra: [{ label: 'Play in English', path: '/legion-eternelle/?lang=en' }],
    en: {
      genre: 'Idle RPG',
      tagline: 'Your legion fights even while you sleep. Gear it up, save your ultimates for the bosses and push back the wall.',
      path: '/legion-eternelle/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/legion-eternelle/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('legionEternelle_v2') || 'null');
      if (!s) return null;
      const en = lang === 'en', out = [];
      if (s.bestLevel) out.push((en ? 'Best level ' : 'Record niveau ') + s.bestLevel);
      if (s.awakenings) out.push(s.awakenings + (en ? (s.awakenings > 1 ? ' awakenings' : ' awakening') : (s.awakenings > 1 ? ' Éveils' : ' Éveil')));
      return out;
    }
  },
  {
    id: 'oxyblox',
    name: 'Oxyblox',
    genre: 'Shoot’em up & gestion',
    tagline: 'Construis ton vaisseau bloc par bloc, fais revivre une planète morte et affronte ses gardiens.',
    path: '/Oxyblox/?lang=fr',
    repo: 'Oxyblox',
    icon: '/Oxyblox/icons/icon-192.png',
    cover: '/Oxyblox/a/title.webp',
    focus: '50% 64%',
    color: '#05070d',
    accent: '#f2a43a',
    // le jeu est bilingue : ?lang= choisit la langue
    extra: [{ label: 'Play in English', path: '/Oxyblox/?lang=en' }],
    en: {
      genre: 'Shoot ’em up & management',
      tagline: 'Build your ship block by block, bring a dead planet back to life and take on its guardians.',
      path: '/Oxyblox/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Oxyblox/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('keismey-epave-stellaire-v2') || 'null');
      if (!s) return null;
      const en = lang === 'en', out = [];
      const n = s.cleared ? Object.keys(s.cleared).filter(k => s.cleared[k]).length : 0;
      out.push((en ? 'Sectors ' : 'Secteurs ') + n + '/5');
      const best = s.arena ? Math.max(s.arena.bestC || 0, s.arena.bestA || 0, s.arena.best || 0) : 0;
      if (best) out.push((en ? 'Record ' : 'Record ') + fmt(best, lang));
      return out;
    }
  },
  {
    id: 'baffus-maximus',
    name: 'Baffus Maximus',
    genre: 'Gestion de gladiateur',
    tagline: 'Entraîne ton gladiateur à coups de mini-jeux, envoie-le dans l’arène et fonde une dynastie de champions.',
    path: '/Baffus-Maximus/?lang=fr',
    repo: 'Baffus-Maximus',
    icon: '/Baffus-Maximus/icons/icon-192.png',
    cover: '/Baffus-Maximus/a/titre.webp',
    focus: '50% 62%',
    color: '#24101A',
    accent: '#E9A93A',
    // le jeu est bilingue : ?lang= choisit la langue
    extra: [{ label: 'Play in English', path: '/Baffus-Maximus/?lang=en' }],
    en: {
      genre: 'Gladiator management',
      tagline: 'Train your gladiator with mini-games, send him into the arena and found a dynasty of champions.',
      path: '/Baffus-Maximus/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Baffus-Maximus/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('dpdb_save_v1') || 'null');
      if (!s || !s.fam) return null;
      const en = lang === 'en', out = [];
      out.push((en ? 'House ' : 'Famille ') + s.fam.nom + (s.fam.gen ? (en ? ', gen. ' : ', gén. ') + s.fam.gen : ''));
      const won = (s.fam.won || []).filter(Boolean).length;
      out.push((en ? 'Leagues ' : 'Ligues ') + won + '/5');
      return out;
    }
  },
  {
    id: 'paper-sniper',
    name: 'Paper Sniper',
    genre: 'Enquête & tir de précision',
    tagline: 'Identifie ta cible dans une ville en papier, démasque ses sosies et n’aie droit qu’à un seul tir depuis les toits.',
    path: '/Paper-Sniper/?lang=fr',
    repo: 'Paper-Sniper',
    icon: '/Paper-Sniper/icons/icon-192.png',
    cover: '/Paper-Sniper/a/cover.webp',
    focus: '50% 48%',
    color: '#151726',
    accent: '#b3261e',
    // le jeu est bilingue : ?lang= choisit la langue
    extra: [{ label: 'Play in English', path: '/Paper-Sniper/?lang=en' }],
    en: {
      genre: 'Investigation & sniping',
      tagline: 'Identify your target in a paper town, unmask the doubles and take one single shot from the rooftops.',
      path: '/Paper-Sniper/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Paper-Sniper/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('coupe-papier.v2') || 'null');
      if (!s || !s.contrats) return null;
      const en = lang === 'en', out = [];
      const n = s.reussis || 0;
      out.push(n + (en ? (n === 1 ? ' contract completed' : ' contracts completed') : (n > 1 ? ' contrats exécutés' : ' contrat exécuté')));
      if (typeof s.francs === 'number') out.push(fmt(s.francs, lang) + ' F');
      return out;
    }
  }
];

function fmt(n, lang) { return Number(n).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR'); }
