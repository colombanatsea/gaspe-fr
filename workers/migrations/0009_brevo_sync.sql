-- 0009_brevo_sync.sql
-- GASPE Session 29 : Brevo sync status
--
-- Permet de traquer quand un user a été synchronisé pour la dernière fois
-- avec son contact Brevo (listes newsletter, attributs PRENOM/NOM).
-- Utilisé par l'admin /admin/newsletter/abonnes pour afficher un indicateur
-- sync (synced / out-of-sync / pending).

ALTER TABLE users ADD COLUMN brevo_synced_at TEXT;

-- Index pour requêter les users désynchronisés (brevo_synced_at < preferences.updated_at).
CREATE INDEX IF NOT EXISTS idx_users_brevo_synced ON users(brevo_synced_at);
