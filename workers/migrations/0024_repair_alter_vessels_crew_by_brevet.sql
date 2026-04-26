-- 0024_repair_alter_vessels_crew_by_brevet.sql
-- Session 40 — Repair partial migration 0017.
--
-- Pas de symptôme directement observable côté API (table
-- `organization_vessels` vide en prod, donc impossible de tester si la
-- colonne existe). Par cohérence avec 0021/0022/0023, on re-tente
-- l'ALTER. Si la colonne existe déjà, le fichier plante et le workflow
-- continue.

ALTER TABLE organization_vessels ADD COLUMN crew_by_brevet TEXT;
