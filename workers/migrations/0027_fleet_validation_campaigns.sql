-- 0027_fleet_validation_campaigns.sql
-- Session 45 – Validation annuelle des donnees adherents.
--
-- Une campagne represente le cycle annuel de validation des donnees declaratives
-- (profil organisation + flotte). 1 campagne par annee, ouverte manuellement par
-- l'admin et cloturee manuellement (PAS d'auto-fermeture, target_date est une
-- deadline molle pour relance + UI rouge).
--
-- Cycle : draft (admin prepare) -> open (visible adherents) -> closed (figee).
-- Voir docs/VALIDATION-ANNUELLE-FEATURE.md pour la spec complete.

CREATE TABLE IF NOT EXISTS fleet_validation_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Annee de reference (ex. 2027 pour la campagne lancee en fevrier 2027)
  target_year INTEGER NOT NULL UNIQUE,
  -- ISO timestamp de bascule en 'open' (distinct de created_at)
  opened_at TEXT NOT NULL,
  -- Deadline molle (ex. 2027-03-31). Sert au calcul d'urgence visuelle.
  target_date TEXT,
  -- ISO timestamp de cloture (set par l'admin)
  closed_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  -- Admin GASPE qui a cree la campagne
  created_by TEXT REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON fleet_validation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_year ON fleet_validation_campaigns(target_year);
