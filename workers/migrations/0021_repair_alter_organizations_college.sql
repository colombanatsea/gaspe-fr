-- 0021_repair_alter_organizations_college.sql
-- Session 40 — Repair partial migration 0016.
--
-- Smoke tests (26 avril 2026) ont révélé que les colonnes
-- `organizations.college` et `organizations.social3228` ne sont pas
-- exposées par /api/organizations en prod (toutes lignes à NULL),
-- malgré le claim "migration 0016 appliquée".
--
-- Cause probable : wrangler d1 execute --file s'arrête au 1er ALTER
-- en doublon ; les UPDATE en aval n'ont jamais tourné. Cette
-- migration ré-tente seulement les ALTER.
-- Si les colonnes existent déjà, ce fichier plante au 1er ALTER ;
-- le workflow deploy-worker.yml absorbe l'erreur via `||` et passe à
-- la migration suivante. Si elles n'existaient pas (rollback complet
-- de 0016), elles seront créées ici.
--
-- Le re-peuplement (UPDATE college/social3228) est dans 0025_repair_data.sql.

ALTER TABLE organizations ADD COLUMN college TEXT;
ALTER TABLE organizations ADD COLUMN social3228 INTEGER;
