# Serveur de synchro des sauvegardes

Petit serveur Cloudflare (Worker + base D1) qui garde une copie des sauvegardes des joueurs connectés,
pour qu'ils retrouvent leurs parties sur tous leurs appareils. Le code des jeux et du hub est dans
`ks-studio.js` (section 6), le même fichier dans chaque jeu.

- `worker.js` : le serveur (à coller dans l'éditeur du Worker).
- `schema.sql` : les tables de la base (à coller une fois dans la console D1).

Ce dossier n'est pas utilisé par le site : il est là pour garder le code du serveur avec le reste.

## Ce qui est gardé

Pour chaque joueur : l'empreinte SHA-256 de son identifiant Google (ni nom, ni e-mail, ni photo),
une sauvegarde par jeu avec un numéro de révision, et l'empreinte du jeton de chaque appareil connecté.
Voir `confidentialite.html`.

## Mise en place (une fois)

1. **Base D1** : tableau de bord Cloudflare → Storage & Databases → D1 → Create, nom `ks-sync`.
   Onglet Console : coller `schema.sql`, exécuter, puis vérifier avec `/tables` (users, sessions, saves).
2. **Worker** : Workers & Pages → Create → Worker (« Hello World »), nom `ks-sync` → Deploy,
   puis Edit code : remplacer tout par `worker.js` copié depuis sa version brute (raw.githubusercontent.com) → Deploy.
3. **Liaison** (indispensable, sinon erreur 500) : le Worker → Settings → Bindings → Add → D1 database, nom de variable `DB`, base `ks-sync`.
4. **Variable** : Settings → Variables and Secrets → Add, type Text, nom `GOOGLE_CLIENT_ID`,
   valeur = l'identifiant client Google (…apps.googleusercontent.com).
5. Dans `ks-studio.js` (hub et jeux) : `SYNC_API = 'https://ks-sync.<sous-domaine>.workers.dev/v1/'`
   et `GOOGLE_ID = '<identifiant client>'`.

6. **Notifications push** : Settings → Triggers → Cron Triggers → Add → `* * * * *` (chaque minute).
   Les clés VAPID sont créées toutes seules au premier abonnement et restent dans la base.

## Mettre à jour le serveur

Edit code → coller la nouvelle version de `worker.js` (depuis sa version brute) → Deploy. Les données ne bougent pas.
Si `schema.sql` a changé, recoller sa dernière ligne dans la console D1 (`CREATE TABLE IF NOT EXISTS` : sans risque).

## Tester en local

Banc de test utilisé pendant le développement : faux jetons Google signés localement (variable
`JWKS_URL`), base en mémoire, deux profils de navigateur pour simuler deux appareils. Origines
de test autorisées avec la variable `ORIGINS` (jamais en production).
