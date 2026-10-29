# Keismey Studio

Le hub des jeux de Keismey Studio : https://keismey.github.io/

Une seule appli à installer sur le téléphone. Chaque jeu s'ouvre dedans.

## Bouton retour du téléphone

Chaque jeu embarque `ks-back.js` (le même fichier partout ; la copie de référence est celle du hub) : le bouton ou geste retour revient au menu
précédent du jeu, demande confirmation avant l'écran titre, et depuis l'écran titre propose d'aller au hub, même pour
un joueur arrivé d'ailleurs (lien partagé, recherche). Si le joueur vient du hub, il y revient comme avec un
retour normal ; sinon le hub remplace le jeu dans l'historique. Ce que fait le retour sur chaque écran est
décidé par le jeu (fonction passée à `KSBack.init`). Pour un nouveau jeu : copier `ks-back.js`, le charger
avant le jeu, l'ajouter au cache hors ligne du jeu et appeler `KSBack.init({ back, lang, title })`.

`title()` renvoie `true` quand l'écran titre est affiché (et qu'aucune fenêtre n'est ouverte) : `ks-back.js` y
montre alors un bouton « Hub » en haut à gauche (`hubCorner: 'tr'` pour le mettre à droite). C'est la seule
sortie sur iPhone quand le hub est installé, car l'appli n'a ni bouton ni geste retour.

## Mode hors ligne d'un jeu : règle commune

Le hub et tous les jeux sont sur la même adresse (keismey.github.io) : ils partagent le même Cache Storage.
Le service worker d'un jeu ne doit supprimer **que ses propres caches** (ceux qui commencent par le nom du jeu),
jamais tous les caches qui ne sont pas les siens : sinon il efface le mode hors ligne du hub et des autres jeux,
et le réglage « Me prévenir » du hub.
Le module n'empile ses entrées d'historique que sur un vrai geste du joueur (jamais sur un `button.click()`
lancé par le code) : Chrome saute au retour les entrées créées sans geste.

## Ajouter un jeu

1. Le jeu doit être publié sur GitHub Pages depuis son dépôt (il sera alors à `https://keismey.github.io/<Nom-du-depot>/`).
2. Dans `games.js`, copier un bloc existant et remplir les champs (nom, chemin, couverture, couleurs).
3. Lancer `python3 outils/vignettes.py` : il fabrique la couverture et l'icône du hub (`vignettes/`, `vignettes.js`).
   Sans ça, le hub affiche les images d'origine du jeu, plus lourdes. À relancer aussi si une couverture change.
4. Ajouter le jeu dans `sitemap.xml` (une ligne) et dans `outils/verifier-copies.sh` (dépôt et dossier des fichiers communs).
5. Optionnel : ajouter un raccourci dans `manifest.webmanifest` (`shortcuts`), pour l'appui long sur l'icône.

Lien direct vers la fiche d'un jeu dans le hub : `https://keismey.github.io/#<id>` (l'`id` de `games.js`, par exemple `#abysses`).

## Fichiers communs aux jeux

`ks-back.js` et `ks-studio.js` sont recopiés tels quels dans chaque jeu. On les modifie ici, dans le hub, puis on
recopie. Chaque lundi, GitHub vérifie que les 13 copies sont identiques à celles du hub
(`outils/verifier-copies.sh`) et envoie un e-mail si l'une a changé.

## Fichiers

- `index.html` — la page du hub
- `games.js` — la liste des jeux et la lecture de leur progression
- `vignettes/`, `vignettes.js` — couvertures et icônes allégées pour le hub (faites par `outils/vignettes.py`)
- `sw.js` — mode hors ligne du hub (ne touche pas aux jeux) ; changer `VERSION` à chaque mise en ligne qui touche
  les polices ou les icônes
- `404.html` — page « introuvable » de tout le site : un nom de jeu mal écrit (`/abysses`) renvoie vers le bon jeu
- `robots.txt`, `sitemap.xml` — pour les moteurs de recherche
- `ks-back.js`, `ks-studio.js` — fichiers communs aux jeux (copies de référence)
- `fonts/` — Alegreya et Alegreya Sans en .woff2 (licence SIL OFL, voir `fonts/OFL.txt`)

## Prévenir les joueurs (alertes)

Les joueurs qui ont touché « Me prévenir » reçoivent une notification pour chaque nouvelle entrée
de `announcements.json`. Ajouter une entrée **à la fin** de la liste, avec un `id` unique :

```json
{
  "id": "2026-11-02-abysses-1-1",
  "date": "2026-11-02",
  "url": "/Abysses/",
  "fr": { "title": "Abysses 1.1", "body": "Nouvelle zone : …" },
  "en": { "title": "Abysses 1.1", "body": "New area: …" }
}
```

Pas de serveur : le hub vérifie en arrière-plan (hub installé, Android/Chrome, environ une fois par jour)
et à chaque ouverture. Seules les annonces publiées après l'activation sont notifiées, 3 au plus d'un coup.

## Quoi de neuf ? (sans notification)

La carte « Quoi de neuf ? » en haut du hub affiche la nouvelle la plus récente (moins de 45 jours) lue dans
`announcements.json` **et** dans `news.json`. Même format dans les deux fichiers.
- `announcements.json` : affichée **et** notifiée aux personnes qui ont activé « Me prévenir ».
- `news.json` : affichée seulement, aucune notification. À utiliser pour les nouvelles qui ne méritent pas une alerte.
