-- GASPE D1 Migration 0003 – Organizations + Newsletter Preferences + Invitations
-- Apply: npx wrangler d1 execute gaspe-db --file workers/migrations/0003_organizations.sql

-- ══════════════════════════════════════════════════════════
--  Table: organizations (centralize company data)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('titulaire', 'associe')),
  territory TEXT CHECK (territory IN ('metropole', 'dom-tom')),
  region TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  logo_url TEXT,
  website_url TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  description TEXT,
  employee_count INTEGER,
  ship_count INTEGER,
  membership_status TEXT DEFAULT 'pending' CHECK (membership_status IN ('due', 'paid', 'pending')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ══════════════════════════════════════════════════════════
--  Modify users: add organization link + primary flag
-- ══════════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN organization_id TEXT REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN is_primary INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN invited_by TEXT;

-- ══════════════════════════════════════════════════════════
--  Table: newsletter_preferences (per-user, per-category)
--  10 categories from GASPE "Contacts et Listes de Diffusion"
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS newsletter_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  info_generales INTEGER DEFAULT 0,
  ag INTEGER DEFAULT 0,
  emploi INTEGER DEFAULT 0,
  formation_opco INTEGER DEFAULT 0,
  veille_juridique INTEGER DEFAULT 0,
  veille_sociale INTEGER DEFAULT 0,
  veille_surete INTEGER DEFAULT 0,
  veille_data INTEGER DEFAULT 0,
  veille_environnement INTEGER DEFAULT 0,
  actualites_gaspe INTEGER DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ══════════════════════════════════════════════════════════
--  Table: invitations (responsable invites team members)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  name TEXT,
  org_role TEXT,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  accepted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ══════════════════════════════════════════════════════════
--  Indexes
-- ══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_primary ON users(organization_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_prefs_user ON newsletter_preferences(user_id);

-- ══════════════════════════════════════════════════════════
--  Seed: 31 GASPE member organizations
--  Source: src/data/members.ts (21 titulaires + 10 associés)
-- ══════════════════════════════════════════════════════════

INSERT OR IGNORE INTO organizations (id, slug, name, category, territory, region, city, latitude, longitude, logo_url, website_url, employee_count, ship_count) VALUES
  ('org-blue-lines', 'blue-lines', 'Blue Lines', 'titulaire', 'dom-tom', 'Martinique', 'Fort-de-France', 14.601, -61.072, 'https://www.gaspe.fr/wp-content/uploads/2025/09/LOGO-OFFICIEL-DE-BLUE-LINES.avif', 'https://www.bluelines.mq/', NULL, 3),
  ('org-breizhgo-ile-darz', 'breizhgo-ile-darz', 'BreizhGo Ile D''Arz', 'titulaire', 'metropole', 'Bretagne', 'Vannes', 47.638, -2.762, 'https://www.gaspe.fr/wp-content/uploads/2025/10/BrestGO-Ile-Darz.png', 'https://www.ile-arz.fr/', NULL, NULL),
  ('org-breizhgo-oceane', 'breizhgo-oceane', 'BreizhGo Océane', 'titulaire', 'metropole', 'Bretagne', 'Lorient', 47.742, -3.353, 'https://www.gaspe.fr/wp-content/uploads/2025/10/BreizhGO-Oceane.png', 'https://oceane.breizhgo.bzh/', NULL, 7),
  ('org-breizhgo-penn-ar-bed', 'breizhgo-penn-ar-bed', 'BreizhGo Penn Ar Bed', 'titulaire', 'metropole', 'Bretagne', 'Brest', 48.384, -4.487, 'https://www.gaspe.fr/wp-content/uploads/2025/10/logos_BzhGo_PaB_2024.jpg', 'https://pennarbed.fr/', 91, 6),
  ('org-compagnie-bacs-de-loire', 'compagnie-bacs-de-loire', 'Compagnie des Bacs de Loire', 'titulaire', 'metropole', 'Pays de la Loire', 'Indre', 47.198, -1.674, 'https://www.gaspe.fr/wp-content/uploads/2024/11/Logo_Bacs-de-Loire-fond-transparent.png', NULL, 28, 3),
  ('org-compagnie-maritime-transport-cmt', 'compagnie-maritime-transport-cmt', 'Compagnie Maritime de Transport (CMT)', 'titulaire', 'metropole', 'Pays de la Loire', 'Les Sables-d''Olonne', 46.504, -1.794, NULL, NULL, NULL, 5),
  ('org-compagnie-maritime-tlv', 'compagnie-maritime-tlv', 'Compagnie Maritime TLV', 'titulaire', 'metropole', 'Provence-Alpes-Côte d''Azur', 'Giens', 43.005, 6.200, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image14.png', 'http://www.tlv-tvm.com/', 49, 12),
  ('org-compagnie-yeu-continent', 'compagnie-yeu-continent', 'Compagnie Yeu Continent', 'titulaire', 'metropole', 'Pays de la Loire', 'La Barre-de-Monts', 46.893, -2.139, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image11.png', 'https://www.yeu-continent.fr/', 100, 3),
  ('org-direction-infrastructures-manche', 'direction-infrastructures-manche', 'Direction des Infrastructures de la Manche', 'titulaire', 'metropole', 'Normandie', 'Saint-Lô', 49.587, -1.262, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image6.png', 'https://tatihou.manche.fr/', 5, 1),
  ('org-direction-ports-bacs-seine-maritime', 'direction-ports-bacs-seine-maritime', 'Direction des Ports, Bacs et Voies vertes de la Seine-Maritime', 'titulaire', 'metropole', 'Normandie', 'Rouen', 49.482, 0.877, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image8.png', 'https://www.seinemaritime.fr/mon-cadre-de-vie/routes-bacs/bacs-de-seine.html', 130, 11),
  ('org-direction-transports-maritimes-gironde', 'direction-transports-maritimes-gironde', 'Direction des Transports Maritimes de la Gironde', 'titulaire', 'metropole', 'Nouvelle-Aquitaine', 'Le Verdon-sur-Mer', 45.125, -0.664, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image16.png', 'https://www.gironde.fr/deplacements/les-bacs-girondins-ferries', 145, 3),
  ('org-karu-ferry', 'karu-ferry', 'Karu''Ferry', 'titulaire', 'dom-tom', 'Guadeloupe', 'Petit-Bourg', 15.979, -61.642, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image3.png', 'https://www.karuferry.com/', 6, 1),
  ('org-keolis-maritime-fouras-aix', 'keolis-maritime-fouras-aix', 'Kéolis Maritime Fouras Aix', 'titulaire', 'metropole', 'Nouvelle-Aquitaine', 'Île d''Aix', 46.01, -1.174, 'https://www.gaspe.fr/wp-content/uploads/2025/10/Logo-Fouras-Aix.jpg', 'https://www.service-maritime-iledaix.com/', 18, 2),
  ('org-morlenn-express', 'morlenn-express', 'Morlenn Express', 'titulaire', 'metropole', 'Bretagne', 'Brest', 48.381, -4.505, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image17.png', 'http://morlenn-express.com/', 35, 6),
  ('org-ratp-dev-toulon', 'ratp-dev-toulon', 'RATP Dev Toulon Provence Méditerranée', 'titulaire', 'metropole', 'Provence-Alpes-Côte d''Azur', 'Toulon', 43.12, 5.931, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image18.png', 'https://www.reseaumistral.com/', NULL, 12),
  ('org-spm-ferries', 'spm-ferries', 'Saint-Pierre et Miquelon Ferries (SPM Ferries)', 'titulaire', 'dom-tom', 'Saint-Pierre-et-Miquelon', 'Saint-Pierre', 46.78, -56.17, 'https://www.gaspe.fr/wp-content/uploads/2024/10/image-spm-petite.jpg', 'https://www.spm-ferries.fr/', 50, 3),
  ('org-stm-mayotte', 'stm-mayotte', 'Services des Transports Maritimes (STM)', 'titulaire', 'dom-tom', 'Mayotte', 'Dzaoudzi-Labattoir', -12.777, 45.233, NULL, 'https://www.mayotte.fr/le-conseil-departemental/institution/services-administratifs/dtm', 321, 10),
  ('org-snc-transrades', 'snc-transrades', 'SNC Transrades', 'titulaire', 'metropole', 'Provence-Alpes-Côte d''Azur', 'Marseille', 43.293, 5.364, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image13.png', 'https://www.lamanage.coop/nos-filiales/transrades', 140, 7),
  ('org-smtdr', 'smtdr', 'Syndicat Mixte des Traversées du Delta du Rhône (SMTDR)', 'titulaire', 'metropole', 'Provence-Alpes-Côte d''Azur', 'Arles', 43.676, 4.627, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image7.png', 'http://smtdr.fr/', 41, 3),
  ('org-transdev-maritime-la-rochelle', 'transdev-maritime-la-rochelle', 'Transdev Maritime La Rochelle', 'titulaire', 'metropole', 'Nouvelle-Aquitaine', 'La Rochelle', 46.159, -1.151, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image15.png', 'https://www.transdev.com/fr/reseaux/yelo/', 5, 5),
  ('org-zephyr-boree-tao', 'zephyr-boree-tao', 'Zéphyr & Borée – Treizhadenn An Oriant (TAO)', 'titulaire', 'metropole', 'Bretagne', 'Lorient', 47.742, -3.353, 'https://www.gaspe.fr/wp-content/uploads/2024/12/Zephyr-et-Boree-TAO.png', 'https://zephyretboree.com/', NULL, NULL),
  ('org-capstan-avocats', 'capstan-avocats', 'Capstan Avocats', 'associe', 'metropole', 'Île-de-France', 'Paris', 48.870, 2.337, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image12.png', NULL, NULL, NULL),
  ('org-manche-iles-express', 'manche-iles-express', 'Compagnie Maritime DNO (Manche Iles Express)', 'associe', 'metropole', 'Normandie', 'Granville', 48.833, -1.603, NULL, 'https://www.manche-iles.com/fr/', NULL, 2),
  ('org-compagnie-vendeenne', 'compagnie-vendeenne', 'Compagnie Vendéenne', 'associe', 'metropole', 'Nouvelle-Aquitaine', 'La Rochelle', 46.159, -1.155, NULL, 'https://www.compagnie-vendeenne.com/', NULL, 3),
  ('org-filhet-allard-maritime', 'filhet-allard-maritime', 'Filhet Allard Maritime', 'associe', 'metropole', 'Nouvelle-Aquitaine', 'Mérignac', 44.830, -0.640, 'https://www.gaspe.fr/wp-content/uploads/2025/01/LOGO-FAM.png', NULL, NULL, NULL),
  ('org-howden', 'howden', 'Howden', 'associe', 'metropole', 'Pays de la Loire', 'Nantes', 47.218, -1.556, 'https://www.gaspe.fr/wp-content/uploads/2025/09/Howden.png', 'https://www.howdengroup.com/fr-fr', NULL, NULL),
  ('org-jalilo', 'jalilo', 'Jalilo', 'associe', 'metropole', 'Nouvelle-Aquitaine', 'Arcachon', 44.663, -1.169, 'https://www.gaspe.fr/wp-content/uploads/2024/10/jalilo-petit.jpg', 'https://www.jalilo.fr/', NULL, 1),
  ('org-keolis-bordeaux-metropole', 'keolis-bordeaux-metropole', 'Kéolis Bordeaux métropole', 'associe', 'metropole', 'Nouvelle-Aquitaine', 'Bordeaux', 44.851, -0.557, 'https://www.gaspe.fr/wp-content/uploads/2024/10/k-olis-bordeaux.jpg', 'https://www.kb2m.fr/', NULL, NULL),
  ('org-ld-tide', 'ld-tide', 'LD Tide', 'associe', 'metropole', 'Île-de-France', 'Suresnes', 48.891, 2.237, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image10.png', 'http://www.lda.fr/', NULL, NULL),
  ('org-splmna', 'splmna', 'Syndicat Professionnel Lamanage des ports de la Manche et de l''Atlantique (SPLMNA)', 'associe', 'metropole', 'Pays de la Loire', 'Donges', 47.315, -2.067, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image2.png', 'https://lamanage-syndicatpro.fr/', 323, 84),
  ('org-transport-maritime-cotier', 'transport-maritime-cotier', 'Transport Maritime Côtier (TMC)', 'associe', 'metropole', 'Bretagne', 'Vannes', 47.639, -2.762, 'https://www.gaspe.fr/wp-content/uploads/2024/11/image9.png', 'https://www.transport-maritime-cotier-bretagne.fr/', NULL, 3);
