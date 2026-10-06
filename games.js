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
  - progress: lit la sauvegarde du jeu (même adresse = même stockage) et renvoie
              une liste de petites infos à afficher, ou null s'il n'y a pas de partie.
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
    progress() {
      const s = JSON.parse(localStorage.getItem('ab_save') || 'null');
      if (!s) return null;
      const out = [];
      if (s.day) out.push('Jour ' + s.day);
      if (typeof s.gold === 'number') out.push(fmt(s.gold) + ' or');
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
    progress() {
      const s = JSON.parse(localStorage.getItem('grande-traque-v1') || 'null');
      if (!s) return null;
      const out = [];
      const hunts = s.cleared ? Object.values(s.cleared).reduce((a, n) => a + (Number(n) || 0), 0) : 0;
      out.push(hunts + (hunts > 1 ? ' chasses réussies' : ' chasse réussie'));
      if (typeof s.zenny === 'number') out.push(fmt(s.zenny) + ' z');
      return out;
    }
  }
];

function fmt(n) { return Number(n).toLocaleString('fr-FR'); }
