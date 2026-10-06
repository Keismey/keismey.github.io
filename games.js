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
    en: {
      genre: 'Idle RPG',
      tagline: 'Your legion fights even while you sleep. Gear it up, save your ultimates for the bosses and push back the wall.',
      path: '/legion-eternelle/?lang=en'
    },
    progress(lang) {
      const s = JSON.parse(localStorage.getItem('legionEternelle_v2') || 'null');
      if (!s) return null;
      const en = lang === 'en', out = [];
      if (s.bestLevel) out.push((en ? 'Best level ' : 'Record niveau ') + s.bestLevel);
      if (s.awakenings) out.push(s.awakenings + (en ? (s.awakenings > 1 ? ' awakenings' : ' awakening') : (s.awakenings > 1 ? ' Éveils' : ' Éveil')));
      return out;
    }
  }
];

function fmt(n, lang) { return Number(n).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR'); }
