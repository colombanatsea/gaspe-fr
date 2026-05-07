-- 0041_newsletter_subscriptions_seed.sql (MANUEL)
-- Session 56b — transposition newsletter_preferences (table 0003 legacy)
-- vers user_newsletter_subscriptions (table 0040). Le placement dans
-- _manual/ signifie qu'elle ne tourne PAS automatiquement au push : il
-- faut déclencher le workflow `deploy-worker.yml` via Run workflow avec
-- input `apply_manual_migrations=true`.
--
-- Cette migration est isolée car le schéma legacy newsletter_preferences
-- peut varier d'une prod à l'autre (la colonne veille_data a été ajoutée
-- en session 26 ; certaines prods peuvent avoir l'ancien
-- communication_marque). Si une colonne référencée est absente, la
-- migration entière rollback côté D1 — le mettre en _manual permet à
-- l'admin de la jouer après vérification du schéma cible.
--
-- Pré-requis : exécuter 0040 d'abord (CREATE TABLE
-- user_newsletter_subscriptions).
--
-- Idempotente : INSERT OR IGNORE sur la PK composite (user_id,
-- category_key). Re-jouer la migration ne crée pas de doublons.

-- Si certaines colonnes n'existent pas en prod, l'admin peut les ajouter
-- au préalable via :
--   ALTER TABLE newsletter_preferences ADD COLUMN <col> INTEGER DEFAULT 0;
-- ou commenter les INSERT correspondants dans ce fichier avant de jouer.

INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'info_generales', 'legacy'       FROM newsletter_preferences WHERE info_generales = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'ag', 'legacy'                    FROM newsletter_preferences WHERE ag = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'emploi', 'legacy'                FROM newsletter_preferences WHERE emploi = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'formation_opco', 'legacy'        FROM newsletter_preferences WHERE formation_opco = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'veille_juridique', 'legacy'      FROM newsletter_preferences WHERE veille_juridique = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'veille_sociale', 'legacy'        FROM newsletter_preferences WHERE veille_sociale = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'veille_surete', 'legacy'         FROM newsletter_preferences WHERE veille_surete = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'veille_data', 'legacy'           FROM newsletter_preferences WHERE veille_data = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'veille_environnement', 'legacy'  FROM newsletter_preferences WHERE veille_environnement = 1;
INSERT OR IGNORE INTO user_newsletter_subscriptions (user_id, category_key, source)
  SELECT user_id, 'actualites_gaspe', 'legacy'      FROM newsletter_preferences WHERE actualites_gaspe = 1;
