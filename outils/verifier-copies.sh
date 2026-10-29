#!/usr/bin/env bash
# Keismey Studio : vérifie que chaque jeu a bien la même copie de ks-back.js et ks-studio.js que le hub.
#   bash outils/verifier-copies.sh
# Lancé tout seul par GitHub chaque lundi et à chaque changement de ces fichiers dans le hub
# (.github/workflows/copies-communes.yml). En cas d'écart, GitHub envoie un e-mail.
# Pour un nouveau jeu : ajouter une ligne « Dépôt dossier/ » (dossier où sont les deux fichiers).
set -u
cd "$(dirname "$0")/.."
JEUX="
Abysses
Les-Chasseurs-de-Brume-Haute
legion-eternelle
Oxyblox src/
Baffus-Maximus
Paper-Sniper src/
La-Derniere-Forge
Pas-ce-soir
Last-Loop js/
Le-Necromancien-de-la-Crypte js/
Le-Cartographe src/
Lanterval commun/
Pico-Clinic commun/
"
ecarts=0
while read -r depot dossier; do
  [ -z "$depot" ] && continue
  for f in ks-back.js ks-studio.js; do
    url="https://raw.githubusercontent.com/Keismey/$depot/main/${dossier:-}$f"
    if ! copie=$(curl -fsSL "$url"); then
      echo "✗ $depot : ${dossier:-}$f introuvable ($url)"; ecarts=$((ecarts + 1)); continue
    fi
    if [ "$(printf '%s' "$copie" | sha256sum)" = "$(printf '%s' "$(cat "$f")" | sha256sum)" ]; then
      echo "✓ $depot : $f"
    else
      echo "✗ $depot : ${dossier:-}$f n'est pas la même que celle du hub"; ecarts=$((ecarts + 1))
    fi
  done
done <<< "$JEUX"
if [ "$ecarts" -gt 0 ]; then
  echo
  echo "$ecarts copie(s) à remettre à jour : recopier le fichier du hub dans le jeu, tel quel."
  exit 1
fi
echo "Toutes les copies sont identiques à celles du hub."
