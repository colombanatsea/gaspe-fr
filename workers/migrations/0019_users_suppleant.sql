-- 0019_users_suppleant.sql
-- Le titulaire d'une compagnie (users.is_primary=1) désigne un suppléant
-- parmi les autres users de la même organisation. Le suppléant peut voter
-- en son nom (le titulaire peut écraser ce vote).
--
-- Stockage : nouvelle colonne `suppleant_user_id` sur la table `users`.
-- - Pour le titulaire : pointe vers l'id de son suppléant
-- - Pour le suppléant : NULL (pas de propre suppléant)
--
-- Cohérence : la valeur doit être un user existant de la même organization_id.
-- Ce check est fait côté Worker (handleSetSuppleant) plutôt qu'en FK SQLite
-- (FK self-référence + contrainte cross-table = lourd à maintenir).

ALTER TABLE users ADD COLUMN suppleant_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_suppleant ON users(suppleant_user_id) WHERE suppleant_user_id IS NOT NULL;
