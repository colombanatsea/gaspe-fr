-- 0034_migrations_applied.sql
-- Session 54 (G2) — P1-1 du rapport docs/PRODUCTION-SAFETY-2026.md
--
-- Table de tracking des migrations D1 déjà appliquées avec succès.
-- Permet à `.github/workflows/deploy-worker.yml` (phase 1) de SKIP les
-- migrations déjà jouées plutôt que de les re-exécuter à chaque push main
-- en comptant sur l'idempotence de chaque statement.
--
-- Avantages :
--   1. Zéro re-tentative de statements déjà passés (perf + clarté logs).
--   2. Détection des migrations qui « disparaissent » (renames, retraits)
--      via comparaison filename ↔ table.
--   3. Durcissement possible du workflow : exit 1 sur toute erreur
--      inattendue (au lieu du `::warning::` actuel qui swallow).
--
-- Filename est la PRIMARY KEY pour idempotence native (REPLACE INTO
-- safe). applied_at est l'ISO 8601 SQLite default (datetime('now')).
-- sha256 optionnel pour détecter une modification du contenu d'une
-- migration déjà appliquée (drift control, alerte au prochain run).
--
-- Le workflow inscrit cette migration ELLE-MÊME en première position au
-- premier run réussi.

CREATE TABLE IF NOT EXISTS _migrations_applied (
  filename TEXT PRIMARY KEY,         -- ex: '0031_formations.sql'
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  sha256 TEXT,                       -- optionnel : drift control
  notes TEXT                         -- optionnel : info debug
);

CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON _migrations_applied(applied_at DESC);

-- Bootstrap : marque toutes les migrations actuellement présentes en
-- prod comme déjà appliquées. La date est approximative (fixée à
-- 2026-04-30 = date du fix token Cloudflare session 40 + bumps suivants).
-- À l'avenir, le workflow inscrit lui-même chaque migration au moment
-- de son exécution réussie.
INSERT OR IGNORE INTO _migrations_applied (filename, applied_at, notes) VALUES
  ('0001_auth.sql',                                  '2026-03-01 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0002_password_reset.sql',                        '2026-03-01 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0003_organizations.sql',                         '2026-03-01 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0004_link_users_organizations.sql',              '2026-03-01 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0005_cms_jobs_medical_media.sql',                '2026-03-15 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0006_profile_linkedin.sql',                      '2026-03-15 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0007_org_archived.sql',                          '2026-03-15 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0008_newsletter.sql',                            '2026-03-20 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0009_brevo_sync.sql',                            '2026-03-20 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0010_cms_documents.sql',                         '2026-04-01 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0011_cms_revisions.sql',                         '2026-04-01 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0012_organization_vessels.sql',                  '2026-04-10 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0013_seed_organization_vessels.sql',             '2026-04-26 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0015_seed_jalilo.sql',                           '2026-04-26 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0017_organization_vessels_crew_by_brevet.sql',   '2026-04-15 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0018_votes.sql',                                 '2026-04-15 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0019_users_suppleant.sql',                       '2026-04-15 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0020_users_staff_permissions.sql',               '2026-04-20 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0021_repair_alter_organizations_college.sql',    '2026-04-26 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0022_repair_alter_users_suppleant.sql',          '2026-04-26 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0023_repair_alter_users_staff_permissions.sql',  '2026-04-26 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0024_repair_alter_vessels_crew_by_brevet.sql',   '2026-04-26 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0026_repair_alter_jobs_created_by.sql',          '2026-04-26 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0027_fleet_validation_campaigns.sql',            '2026-04-28 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0028_alter_validation_status.sql',               '2026-04-28 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0029_validation_history.sql',                    '2026-04-28 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0030_validation_email_sent.sql',                 '2026-04-29 00:00:00', 'Bootstrap rétroactif (session 54)'),
  ('0031_formations.sql',                            '2026-04-30 00:00:00', 'Bootstrap rétroactif (session 54, P0-1)'),
  ('0032_positions.sql',                             '2026-04-30 00:00:00', 'Bootstrap rétroactif (session 54, P0-2)'),
  ('0033_jobs_application_deadline.sql',             '2026-04-30 00:00:00', 'Bootstrap rétroactif (session 54, P0-4)');
