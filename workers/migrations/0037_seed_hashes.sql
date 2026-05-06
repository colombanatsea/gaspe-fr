-- 0037_seed_hashes.sql
-- Session 54+ — P2-1 du rapport docs/PRODUCTION-SAFETY-2026.md (lot G3).
--
-- Table de versionning des seeds critiques (members.ts, fleet-seed.ts,
-- ccn3228.ts, schools.ts, etc.). Permet de détecter qu'un seed a été
-- modifié dans le code source par rapport à la dernière fois où il a
-- été validé / déployé.
--
-- Usage :
--   1. À chaque release, l'admin lance `npx tsx scripts/compute-seed-hashes.ts`
--      qui calcule les SHA-256 des seeds et les affiche.
--   2. Si différents de la valeur en D1, l'admin valide le diff et POST
--      les nouveaux hashes via /api/admin/seed-hashes.
--   3. Au prochain run, le script alerte si un seed a changé localement
--      sans correspondance en D1.
--
-- Cas d'usage : drift detection, conformité changelog, validation
-- avant push main, audit légal des modifications de référentiel.

CREATE TABLE IF NOT EXISTS seed_hashes (
  seed_name TEXT PRIMARY KEY,            -- ex: 'members', 'fleet-seed', 'ccn3228'
  sha256 TEXT NOT NULL,                   -- hash hex SHA-256 du fichier
  byte_size INTEGER,                      -- taille en bytes
  recorded_by TEXT,                       -- user.id de l'admin qui a validé
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT                              -- ex: 'release v2.47.0', 'ajout 2 navires Jalilo'
);

CREATE INDEX IF NOT EXISTS idx_seed_hashes_recorded ON seed_hashes(recorded_at DESC);
