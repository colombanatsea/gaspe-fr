-- ---------------------------------------------------------------
-- Migration 0044 — Multi-admin avec master admin transferable (C9)
--
-- Ajoute le flag `is_master_admin` sur users. Un seul master admin à
-- la fois (contrainte applicative — vérifiée côté Worker). Le master
-- peut :
--   - promouvoir d'autres comptes en admin secondaire
--   - rétrograder les admins secondaires
--   - transférer son rôle master à un autre admin (action irréversible
--     pour lui — il devient admin secondaire)
--
-- Les autres admins ne peuvent pas modifier ces flags.
--
-- Seed : le 1er admin existant (par ordre de création) devient master.
-- Si aucun admin n'existe encore, l'UPDATE est no-op et le 1er compte
-- promu admin via l'UI deviendra automatiquement master.
-- ---------------------------------------------------------------

ALTER TABLE users ADD COLUMN is_master_admin INTEGER NOT NULL DEFAULT 0;

UPDATE users SET is_master_admin = 1
WHERE id = (
  SELECT id FROM users
  WHERE role = 'admin' AND COALESCE(archived, 0) = 0
  ORDER BY created_at ASC LIMIT 1
);

CREATE INDEX IF NOT EXISTS idx_users_master_admin
  ON users(is_master_admin) WHERE is_master_admin = 1;
