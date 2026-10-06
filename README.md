# Keismey Studio

Le hub des jeux de Keismey Studio : https://keismey.github.io/

Une seule appli à installer sur le téléphone. Chaque jeu s'ouvre dedans, le geste retour ramène au hub.

## Ajouter un jeu

1. Le jeu doit être publié sur GitHub Pages depuis son dépôt (il sera alors à `https://keismey.github.io/<Nom-du-depot>/`).
2. Dans `games.js`, copier un bloc existant et remplir les champs (nom, chemin, couverture, couleurs).
3. Optionnel : ajouter un raccourci dans `manifest.webmanifest` (`shortcuts`), pour l'appui long sur l'icône.

## Fichiers

- `index.html` — la page du hub
- `games.js` — la liste des jeux et la lecture de leur progression
- `sw.js` — mode hors ligne du hub (ne touche pas aux jeux)
- `fonts/` — Alegreya et Alegreya Sans (licence SIL OFL, voir `fonts/OFL.txt`)
