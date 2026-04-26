-- 0016_organization_college.sql
-- Ajoute le classement par collège ACF (A/B/C) et le flag CCN 3228 sur
-- chaque organisation. Source : dispatch ACF (cf. simulation cotisations
-- + screenshots transmis par le client).
--
-- - Collège A : Opérateurs publics (SEM, régies, syndicats mixtes,
--   services départementaux). Vote AG + NAO si social3228=1.
-- - Collège B : Opérateurs privés (SAS, SA). Idem droits de vote.
-- - Collège C : Experts (avocats, courtiers) & collectivités. Vote AG
--   uniquement (pas de NAO car hors champ CCN 3228).
--
-- Idempotence : ALTER ADD COLUMN ne supporte pas IF NOT EXISTS en SQLite,
-- mais cette migration est appliquée une seule fois via le runner D1.
-- Les UPDATE sont idempotents (ré-exécutables sans effet).

ALTER TABLE organizations ADD COLUMN college TEXT;
ALTER TABLE organizations ADD COLUMN social3228 INTEGER;

-- Collège A (opérateurs publics)
UPDATE organizations SET college = 'A', social3228 = 1 WHERE slug IN (
  'blue-lines',
  'breizhgo-ile-darz',
  'breizhgo-oceane',
  'breizhgo-penn-ar-bed',
  'compagnie-bacs-de-loire',
  'compagnie-maritime-transport-cmt',
  'compagnie-maritime-tlv',
  'compagnie-yeu-continent',
  'direction-infrastructures-manche',
  'direction-ports-bacs-seine-maritime',
  'direction-transports-maritimes-gironde',
  'karu-ferry',
  'keolis-maritime-fouras-aix',
  'morlenn-express',
  'ratp-dev-toulon',
  'spm-ferries',
  'stm-mayotte',
  'snc-transrades',
  'smtdr',
  'transdev-maritime-la-rochelle',
  'zephyr-boree-tao',
  'manche-iles-express',
  'splmna'
);

-- Collège B (opérateurs privés)
UPDATE organizations SET college = 'B', social3228 = 1 WHERE slug IN (
  'compagnie-vendeenne',
  'jalilo',
  'ld-tide',
  'transport-maritime-cotier'
);

-- Collège C (experts & collectivités)
UPDATE organizations SET college = 'C', social3228 = 0 WHERE slug IN (
  'capstan-avocats',
  'filhet-allard-maritime',
  'howden'
);

-- Index pour requêtes de filtrage par collège (votes, listings)
CREATE INDEX IF NOT EXISTS idx_organizations_college ON organizations(college);
CREATE INDEX IF NOT EXISTS idx_organizations_social3228 ON organizations(social3228);
