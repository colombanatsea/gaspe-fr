-- 0029_validation_history.sql
-- Session 45 – Trace canonique immuable des validations annuelles.
--
-- 1 ligne par item valide (profile = organisation entiere, vessel = 1 navire).
-- snapshot_json fige l'etat au moment de la validation pour audits ulterieurs
-- et diffs Y-o-Y (compare snapshot 2026 vs snapshot 2027).
--
-- campaign_id est NULLable : un adherent peut valider hors campagne (ex. apres
-- la cloture, sans relance UI). La validation reste tracee, juste sans
-- contexte de campagne.
--
-- is_unchanged : 1 si l'adherent a coche "inchange depuis l'an dernier" sans
-- modifier les champs. Permet a l'admin de filtrer rapidement les vraies
-- mises a jour vs les confirmations passives.

CREATE TABLE IF NOT EXISTS validation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- 'profile' (organisation entiere) ou 'vessel' (1 navire)
  item_type TEXT NOT NULL CHECK (item_type IN ('profile','vessel')),
  -- NULL si item_type='profile', sinon organization_vessels.id
  item_id TEXT,
  -- Annee de reference de la validation (= campaign.target_year si campagne ouverte)
  target_year INTEGER NOT NULL,
  validated_at TEXT NOT NULL,
  validated_by_user_id TEXT NOT NULL REFERENCES users(id),
  -- JSON serialise de l'etat de l'item au moment de la validation
  snapshot_json TEXT NOT NULL,
  -- 1 si validation passive (pas de modif vs annee precedente)
  is_unchanged INTEGER NOT NULL DEFAULT 0,
  campaign_id INTEGER REFERENCES fleet_validation_campaigns(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_history_org_year ON validation_history(organization_id, target_year);
CREATE INDEX IF NOT EXISTS idx_history_item ON validation_history(item_type, item_id, target_year);
CREATE INDEX IF NOT EXISTS idx_history_campaign ON validation_history(campaign_id);
