-- 0028_alter_validation_status.sql
-- Session 45 – Cache projete `last_validated_*` sur les tables existantes.
--
-- Pourquoi denormaliser : la requete "ce navire est-il valide pour 2027 ?"
-- est dans le chemin chaud (rendu fiche /nos-adherents/[slug], dashboard admin,
-- banner adherent). Stocker last_validated_year directement sur la ligne evite
-- un LEFT JOIN sur validation_history a chaque rendu. La source de verite
-- canonique reste validation_history.
--
-- ALTER ADD COLUMN ne supporte pas IF NOT EXISTS en SQLite : un re-run produira
-- "duplicate column name" -- attendu, le workflow GitHub deploy-worker.yml
-- l'absorbe en ::warning::.

ALTER TABLE organizations ADD COLUMN last_validated_year INTEGER;
ALTER TABLE organizations ADD COLUMN last_validated_at TEXT;
ALTER TABLE organizations ADD COLUMN last_validated_by TEXT;

ALTER TABLE organization_vessels ADD COLUMN last_validated_year INTEGER;
ALTER TABLE organization_vessels ADD COLUMN last_validated_at TEXT;
ALTER TABLE organization_vessels ADD COLUMN last_validated_by TEXT;

CREATE INDEX IF NOT EXISTS idx_orgs_last_validated_year ON organizations(last_validated_year);
CREATE INDEX IF NOT EXISTS idx_vessels_last_validated_year ON organization_vessels(last_validated_year);
