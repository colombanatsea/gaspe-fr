-- 0040_newsletter_categories_dynamic.sql
-- Session 56b — Refonte newsletter dynamique.
--
-- Avant : 10 catégories hard-codées dans 3 endroits (table 0003
-- newsletter_preferences en colonnes, NEWSLETTER_CATEGORIES en TS,
-- CATEGORY_TO_LIST_ENV + 10 secrets BREVO_LIST_*).
--
-- Après : 1 source de vérité D1, gérable depuis /admin/newsletter/categories.
-- L'admin peut créer une catégorie publique → le Worker crée la liste Brevo
-- correspondante avec préfixe « [SITE] » et stocke l'ID dans D1. Plus de
-- secret par liste.
--
-- 2 nouvelles tables :
--   - newsletter_categories : métadata (libellé, description, audience, ID Brevo)
--   - user_newsletter_subscriptions : 1 ligne par (user, category) abonnée
--
-- L'ancienne table newsletter_preferences est conservée en lecture seule pour
-- rétro-compat éventuelle. Le seed initial transpose les 10 colonnes existantes
-- vers user_newsletter_subscriptions de manière idempotente.

-- ══════════════════════════════════════════════════════════
--  Table : newsletter_categories
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS newsletter_categories (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  brevo_list_id INTEGER,
  -- Filtre d'audience appliqué côté UI (catégories visibles à l'adhérent) ET
  -- côté API (refus du PATCH si l'user n'est pas éligible) :
  --   'all'            : toutes les audiences
  --   'adherent_only'  : compte role=adherent ET approved=1
  --   'social_3228'    : adhérent dont l'organisation a social3228=true
  --   'college_a'      : adhérent collège A (opérateurs publics)
  --   'college_b'      : adhérent collège B (privés)
  --   'college_c'      : adhérent collège C (experts/collectivités)
  audience_filter TEXT NOT NULL DEFAULT 'all',
  -- Catégorie exposée dans l'UI publique (préférences) ?
  is_public INTEGER NOT NULL DEFAULT 1,
  -- Catégorie créée par le système (préfixe [SITE] côté Brevo) ?
  -- Permet de distinguer dans le dashboard Brevo des listes manuelles
  -- créées hors site (Médias, Prospects experts, etc.).
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 100,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_categories_archived
  ON newsletter_categories (archived, is_public, sort_order);

-- ══════════════════════════════════════════════════════════
--  Table : user_newsletter_subscriptions
-- ══════════════════════════════════════════════════════════
-- Modèle key-value flexible : 1 ligne par (user, category) abonnée
-- uniquement (absence = pas abonné). Plus simple à requêter et à étendre
-- qu'une matrice booléenne avec autant de colonnes que de catégories.

CREATE TABLE IF NOT EXISTS user_newsletter_subscriptions (
  user_id TEXT NOT NULL,
  category_key TEXT NOT NULL,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT,  -- 'site' (préférences user) | 'admin' (push admin) | 'brevo' (sync inverse)
  PRIMARY KEY (user_id, category_key),
  FOREIGN KEY (category_key) REFERENCES newsletter_categories (key) ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_newsletter_subscriptions_category
  ON user_newsletter_subscriptions (category_key);

-- ══════════════════════════════════════════════════════════
--  Seed initial des 11 catégories (10 existantes + CC3228)
-- ══════════════════════════════════════════════════════════
-- INSERT OR IGNORE → idempotent. Les Brevo list IDs sont ceux fournis par
-- l'admin GASPE le 7 mai 2026 (voir docs/POST-LAUNCH-FEEDBACK-2026.md
-- § Session 56b). Les 2 IDs NULL correspondent aux listes « Emploi » et
-- « Communication et Image » qui seront créées via l'UI admin
-- /admin/newsletter/categories (création auto avec préfixe [SITE]).

INSERT OR IGNORE INTO newsletter_categories
  (key, label, description, brevo_list_id, audience_filter, is_public, is_system, sort_order)
VALUES
  ('info_generales',       'Informations générales',         'Communications GASPE de portée générale, accessible à tout adhérent.', 6,    'adherent_only',   1, 1, 10),
  ('ag',                   'Assemblée Générale (AG / AGE)',  'Convocations, ordres du jour, comptes rendus AG et AGE.',              19,   'adherent_only',   1, 1, 20),
  ('emploi',               'Emploi (CV et offres)',          'Offres d''emploi de nos compagnies adhérentes.',                       NULL, 'all',             1, 1, 30),
  ('formation_opco',       'Formation et OPCO',              'Plan de formation, financements OPCO Mobilités.',                      18,   'all',             1, 1, 40),
  ('veille_juridique',     'Veille juridique ADF',           'Actualités réglementaires et institutionnelles, partenariat ADF.',     14,   'adherent_only',   1, 1, 50),
  ('veille_sociale',       'Veille sociale ADF',             'Actualités sociales, conventions, ENIM, partenariat ADF.',             13,   'adherent_only',   1, 1, 60),
  ('veille_surete',        'Veille sûreté et sécurité ADF',  'Sécurité maritime, ISPS, cybersécurité, partenariat ADF.',             15,   'adherent_only',   1, 1, 70),
  ('veille_data',          'Veille data ADF',                'Données et indicateurs sectoriels, partenariat ADF.',                  16,   'adherent_only',   1, 1, 80),
  ('veille_environnement', 'Veille environnement ADF',       'Décarbonation, EU ETS, FuelEU, partenariat ADF.',                      17,   'adherent_only',   1, 1, 90),
  ('actualites_gaspe',     'Communication et image',         'Communication GASPE, presse, image du secteur, valorisation métiers.', NULL, 'all',             1, 1, 100),
  ('cc3228',               'Veille CC 3228',                 'Veille spécifique CCN 3228 et NAO, réservée au collège social.',        27,   'social_3228',     1, 1, 110);

-- ══════════════════════════════════════════════════════════
--  Note : transposition des préférences existantes
-- ══════════════════════════════════════════════════════════
-- La transposition depuis newsletter_preferences (table 0003) vers
-- user_newsletter_subscriptions est isolée dans la migration suivante
-- (0041) car elle dépend de l'état exact du schéma legacy en prod (la
-- colonne veille_data peut avoir été ajoutée tardivement). En cas
-- d'échec de 0041, le code Worker bascule en mode lecture cascade :
-- si un user n'a aucune entrée user_newsletter_subscriptions mais
-- existe dans newsletter_preferences, la lecture lit le fallback legacy
-- automatiquement.
