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
    genre: 'RPG de chasse au tour par tour',
    tagline: 'Traque des monstres au tour par tour, forge ton équipement avec leurs restes et monte en rang.',
    path: '/Les-Chasseurs-de-Brume-Haute/?lang=fr',
    repo: 'Les-Chasseurs-de-Brume-Haute',
    icon: '/Les-Chasseurs-de-Brume-Haute/icons/icon-192.png',
    // bannière du jeu, version jour ou nuit selon l'heure
    cover: () => {
      const h = new Date().getHours();
      return '/Les-Chasseurs-de-Brume-Haute/img/banniere-' + (h >= 7 && h < 20 ? 'jour' : 'nuit') + '.webp';
    },
    focus: '50% 60%',
    color: '#1d2a22',
    accent: '#a9c46a',
    // le jeu est bilingue : ?lang= choisit la langue (et la retient)
    extra: [{ label: 'Play in English', path: '/Les-Chasseurs-de-Brume-Haute/?lang=en' }],
    en: {
      name: 'The Hunters of Brume-Haute',
      genre: 'Turn-based hunting RPG',
      tagline: 'Track monsters turn by turn, forge your gear from their remains and climb the ranks.',
      path: '/Les-Chasseurs-de-Brume-Haute/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Les-Chasseurs-de-Brume-Haute/?lang=fr' }]
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
    accent: '#f05a4f',   // rouge du jeu (#b3261e) éclairci : lisible sur fond sombre (contraste 5,3)
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
  },
  {
    id: 'derniere-forge',
    name: 'La Dernière Forge',
    genre: 'Forge & aventure',
    tagline: 'Rallume la dernière forge, descends à la mine, chasse les créatures de la Rouille et brise la malédiction.',
    path: '/La-Derniere-Forge/?lang=fr',
    repo: 'La-Derniere-Forge',
    icon: '/La-Derniere-Forge/icons/icon-192.png',
    cover: '/La-Derniere-Forge/assets/img/decors/titre.webp',
    focus: '50% 40%',
    color: '#15110e',
    accent: '#ff7a2a',
    // le jeu est bilingue : ?lang= choisit la langue (et la retient)
    extra: [{ label: 'Play in English', path: '/La-Derniere-Forge/?lang=en' }],
    en: {
      name: 'The Last Forge',
      genre: 'Forge & adventure',
      tagline: 'Rekindle the last forge, delve into the mine, hunt the creatures of the Rust and break the curse.',
      path: '/La-Derniere-Forge/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/La-Derniere-Forge/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('derniere-forge-save-v1') || 'null');
      if (!s || !(s.introSeen >= 0)) return null;
      const en = lang === 'en', R = ['I', 'II', 'III', 'IV', 'V'];
      const out = [s.ended ? (en ? 'Epilogue' : 'Épilogue') : (en ? 'Chapter ' : 'Chapitre ') + (R[s.ch] || 'V')];
      if (typeof s.gold === 'number') out.push(fmt(s.gold, lang) + (en ? ' gold' : ' or'));
      return out;
    }
  },
  {
    id: 'pas-ce-soir',
    name: 'Pas ce soir',
    genre: 'Gestion & décisions de taverne',
    tagline: 'Trie les aventuriers à la porte, envoie les meilleurs en quête et rachète la taverne au vieux Gustave.',
    path: '/Pas-ce-soir/?lang=fr',
    repo: 'Pas-ce-soir',
    icon: '/Pas-ce-soir/icons/icon-192.png',
    cover: '/Pas-ce-soir/img/cover.webp',
    focus: '50% 55%',
    color: '#140b07',
    accent: '#e0a040',
    extra: [{ label: 'Play in English', path: '/Pas-ce-soir/?lang=en' }],
    en: {
      genre: 'Tavern management & choices',
      tagline: 'Sort adventurers at the door, send the best on quests and buy the tavern from old Gustave.',
      path: '/Pas-ce-soir/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Pas-ce-soir/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('pas-ce-soir-v1') || 'null');
      if (!s || !s.soiree) return null;
      const en = lang === 'en', out = [(en ? 'Night ' : 'Soirée ') + s.soiree];
      if (s.fini) { out.push(en ? 'Landlord' : 'Patron'); if (typeof s.caisse === 'number') out.push(fmt(s.caisse, lang) + (en ? ' gold' : ' or')); }
      else if (typeof s.epargne === 'number') out.push((en ? 'Savings ' : 'Épargne ') + fmt(s.epargne, lang) + ' / ' + fmt(1000, lang));
      return out;
    }
  },
  {
    id: 'last-loop',
    name: 'Last Loop',
    genre: 'Survie & gestion ferroviaire',
    tagline: 'Fais tourner le dernier train, garde tes survivants en vie et fais tomber le Roi des Rails.',
    path: '/Last-Loop/?lang=fr',
    repo: 'Last-Loop',
    icon: '/Last-Loop/assets/icons/icon-192.png',
    cover: '/Last-Loop/assets/img/title_keyart.webp',
    focus: '50% 45%',
    color: '#1f1e25',
    accent: '#e8a33d',
    // le jeu est bilingue : ?lang= choisit la langue (et la retient)
    extra: [{ label: 'Play in English', path: '/Last-Loop/?lang=en' }],
    en: {
      genre: 'Railway survival & management',
      tagline: 'Keep the last train running, keep your survivors alive and bring down the Rail King.',
      path: '/Last-Loop/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Last-Loop/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('loopexpress.save') || 'null');
      if (!s || !s.summary) return null;
      const en = lang === 'en', m = s.summary, out = [];
      out.push('Zone ' + (m.ring || 1) + ' · ' + (en ? 'Lap ' : 'Tour ') + (m.lap || 1));
      if (Array.isArray(s.crew)) { const n = s.crew.length; out.push(n + (en ? (n > 1 ? ' survivors' : ' survivor') : (n > 1 ? ' survivants' : ' survivant'))); }
      if (s.progress && s.progress.bossDown && s.progress.bossDown[1]) out.push(en ? 'Rail King defeated' : 'Roi des Rails vaincu');
      return out;
    }
  },
  {
    id: 'necromancien',
    name: 'Le Nécromancien de la Crypte',
    genre: 'Défense de crypte & couture de monstres',
    tagline: 'Recycle les héros tombés, couds des abominations avec leurs restes et défends ta crypte jusqu’à la cathédrale.',
    path: '/Le-Necromancien-de-la-Crypte/?lang=fr',
    repo: 'Le-Necromancien-de-la-Crypte',
    icon: '/Le-Necromancien-de-la-Crypte/icons/icon-192.png',
    cover: '/Le-Necromancien-de-la-Crypte/assets/cover.webp',
    focus: '50% 50%',
    color: '#140b1e',
    accent: '#7dff4a',
    // le jeu est bilingue : ?lang= choisit la langue
    extra: [{ label: 'Play in English', path: '/Le-Necromancien-de-la-Crypte/?lang=en' }],
    en: {
      name: 'The Necromancer of the Crypt',
      genre: 'Crypt defense & monster stitching',
      tagline: 'Recycle fallen heroes, stitch abominations from their remains and defend your crypt all the way to the cathedral.',
      path: '/Le-Necromancien-de-la-Crypte/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Le-Necromancien-de-la-Crypte/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('necro_crypte_save') || 'null');
      if (!s || !(s.tuto > 0 || s.cleared > 0)) return null;
      const en = lang === 'en', out = [];
      out.push(s.titan ? (en ? 'Bone Titan awakened' : 'Titan d’Os réveillé') : (en ? 'Night ' : 'Nuit ') + Math.min(10, (s.cleared || 0) + 1) + ' / 10');
      if (typeof s.souls === 'number') out.push(fmt(s.souls, lang) + (en ? ' souls' : ' âmes'));
      return out;
    }
  },
  {
    id: 'cartographe',
    name: 'Le Cartographe',
    genre: 'Déduction & cartographie',
    tagline: 'Dessine le monde d’après les témoignages des habitants : place les lieux, trace les routes et rends ta carte au roi.',
    path: '/Le-Cartographe/?lang=fr',
    repo: 'Le-Cartographe',
    icon: '/Le-Cartographe/icon-192.png',
    cover: '/Le-Cartographe/cover.webp',
    focus: '50% 50%',
    color: '#15242c',
    accent: '#d6b25a',
    // le jeu est bilingue : ?lang= choisit la langue
    extra: [{ label: 'Play in English', path: '/Le-Cartographe/?lang=en' }],
    en: {
      name: 'The Cartographer',
      genre: 'Deduction & mapmaking',
      tagline: 'Draw the world from the villagers’ testimonies: place the landmarks, trace the roads and hand your map to the king.',
      path: '/Le-Cartographe/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Le-Cartographe/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('keismey.cartographe.v1') || 'null');
      if (!s || !s.progress) return null;
      const en = lang === 'en', out = [];
      const ids = Object.keys(s.progress).filter(k => s.progress[k] && s.progress[k].stars >= 1);
      if (!ids.length && !Object.keys(s.inprogress || {}).length) return null;
      out.push((en ? 'Regions ' : 'Contrées ') + ids.length + '/8');
      const stars = ids.reduce((a, k) => a + (s.progress[k].stars || 0), 0);
      if (stars) out.push(stars + ' ★');
      return out;
    }
  },
  {
    id: 'lanterval',
    name: 'Lanterval',
    genre: 'RPG à l’aquarelle',
    tagline: 'Rallume la lanterne de ton village : quatre héros, quatre régions et une brume qui efface les souvenirs.',
    path: '/Lanterval/?lang=fr',
    repo: 'Lanterval',
    icon: '/Lanterval/icon-192.png',
    cover: '/Lanterval/couverture.webp',
    focus: '50% 50%',
    color: '#0b0d1a',
    accent: '#e9b949',
    // le jeu est bilingue : ?lang= choisit la langue (et la retient)
    extra: [{ label: 'Play in English', path: '/Lanterval/?lang=en' }],
    en: {
      genre: 'Watercolour RPG',
      tagline: 'Rekindle your village’s lantern: four heroes, four regions and a mist that wipes away memories.',
      path: '/Lanterval/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Lanterval/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('lanterval-v1') || 'null');
      if (!s || !s.v) return null;
      const en = lang === 'en', out = [], faites = s.etapes || [];
      if (s.finPartie || (s.finVue && !s.plus)) out.push(en ? 'The End' : 'Fin');
      else {
        // acte en cours : le premier dont toutes les étapes ne sont pas finies (10, 8, 10 et 10 étapes)
        const n = [10, 8, 10, 10];
        let a = 1;
        while (a < 4 && faites.filter(e => e.indexOf('a' + a + '.') === 0).length >= n[a - 1]) a++;
        out.push((en ? 'Act ' : 'Acte ') + a);
      }
      if (s.plus) out.push((en ? 'New game+ ' : 'Partie+ ') + s.plus);
      if (s.chars && s.chars.kael) out.push((en ? 'Level ' : 'Niveau ') + s.chars.kael.lvl);
      return out;
    }
  },
  {
    id: 'pico-clinic',
    name: 'Pico-Clinic',
    genre: 'Réparation de drones au doigt',
    tagline: 'Dévisse, soude et change les puces : soigne drones, insectes mécaniques et peluches robots, et reprends l’atelier de Maître Ohm.',
    path: '/Pico-Clinic/?lang=fr',
    repo: 'Pico-Clinic',
    icon: '/Pico-Clinic/icons/icon-192.png',
    cover: '/Pico-Clinic/couverture.webp',
    focus: '50% 45%',
    color: '#2a1e15',
    accent: '#3fd0bb',
    // le jeu est bilingue : ?lang= choisit la langue (et la retient)
    extra: [{ label: 'Play in English', path: '/Pico-Clinic/?lang=en' }],
    en: {
      genre: 'Fingertip drone repair',
      tagline: 'Unscrew, solder and swap chips: heal drones, mechanical insects and robot plushies, and take over Master Ohm’s workshop.',
      path: '/Pico-Clinic/?lang=en',
      extra: [{ label: 'Jouer en Français', path: '/Pico-Clinic/?lang=fr' }]
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('pico_save_v1') || 'null');
      if (!s || !s.orders || !Object.keys(s.orders).length) return null;
      const en = lang === 'en', out = [];
      out.push((en ? 'Rank ' : 'Rang ') + (s.rank || 1));
      const stars = Object.values(s.orders).reduce((n, o) => n + (o.stars || []).filter(Boolean).length, 0);
      out.push(fmt(stars, lang) + ' ★');
      if (typeof s.credits === 'number') out.push(fmt(s.credits, lang) + (en ? ' credits' : ' crédits'));
      return out;
    }
  }
];

function fmt(n, lang) { return Number(n).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR'); }
