/* Keismey Studio — base de la synchro des sauvegardes (Cloudflare D1).
   À coller une fois dans la console de la base (onglet « Console » de D1) : la console met tout
   sur une ligne, d'où les commentaires entre barres-étoiles et la dernière ligne qui contient tout.
   users : un joueur = l'empreinte de son identifiant Google (ni nom, ni e-mail, ni photo).
   sessions : une ligne par appareil connecté, avec l'empreinte du jeton (jamais le jeton).
   saves : une sauvegarde par joueur et par jeu ; rev augmente à chaque envoi (détecte les conflits). */
CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, created INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS sessions (th TEXT PRIMARY KEY, uid TEXT NOT NULL, created INTEGER NOT NULL, used INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS sessions_uid ON sessions (uid); CREATE TABLE IF NOT EXISTS saves (uid TEXT NOT NULL, jeu TEXT NOT NULL, rev INTEGER NOT NULL, updated INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (uid, jeu));
