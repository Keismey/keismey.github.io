-- Keismey Studio — base de la synchro des sauvegardes (Cloudflare D1).
-- À coller une fois dans la console de la base (onglet « Console » de D1).

-- Un joueur = l'empreinte de son identifiant Google. Ni nom, ni e-mail, ni photo.
CREATE TABLE IF NOT EXISTS users (
  uid      TEXT PRIMARY KEY,
  created  INTEGER NOT NULL
);

-- Une ligne par appareil connecté. On ne garde que l'empreinte du jeton, jamais le jeton lui-même.
CREATE TABLE IF NOT EXISTS sessions (
  th       TEXT PRIMARY KEY,
  uid      TEXT NOT NULL,
  created  INTEGER NOT NULL,
  used     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_uid ON sessions (uid);

-- Une sauvegarde par joueur et par jeu. rev augmente à chaque envoi : c'est ce qui détecte les conflits.
CREATE TABLE IF NOT EXISTS saves (
  uid      TEXT NOT NULL,
  jeu      TEXT NOT NULL,
  rev      INTEGER NOT NULL,
  updated  INTEGER NOT NULL,
  data     TEXT NOT NULL,
  PRIMARY KEY (uid, jeu)
);
