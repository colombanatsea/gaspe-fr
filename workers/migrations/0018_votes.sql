-- 0018_votes.sql
-- Système de votes adhérents (AG/AGE et NAO/mandats sociaux).
-- Spec session 38 (user) :
-- - Audience "ag_ab" : Collège A et B (gouvernance, AG, AGE)
-- - Audience "social_3228" : compagnies sous CCN 3228 (NAO, mandats sociaux)
-- - 1 vote par organisation (titulaire OU suppléant peuvent répondre)
-- - 5 types de vote : choix simple, multiple, texte, classement, dates
-- - Visibilité : admin + titulaire/suppléant concernés uniquement
-- - Clôture manuelle ou automatique (closes_at)

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  -- 'single_choice' | 'multiple_choice' | 'text' | 'ranking' | 'date_selection'
  type TEXT NOT NULL,
  -- 'ag_ab' (Collèges A+B, AG/AGE) | 'social_3228' (CCN 3228, NAO)
  audience TEXT NOT NULL,
  -- JSON array des options pour single/multiple/ranking ; ISO array pour dates ; NULL pour text
  options_json TEXT,
  -- 'draft' | 'open' | 'closed'
  status TEXT NOT NULL DEFAULT 'open',
  -- ISO timestamp de clôture automatique (optionnel)
  closes_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  closed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_votes_status ON votes(status);
CREATE INDEX IF NOT EXISTS idx_votes_audience ON votes(audience);
CREATE INDEX IF NOT EXISTS idx_votes_closes_at ON votes(closes_at) WHERE closes_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS vote_responses (
  id TEXT PRIMARY KEY,
  vote_id TEXT NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL,
  -- User qui a soumis (titulaire ou suppléant)
  submitted_by TEXT NOT NULL,
  -- JSON payload selon le type de vote :
  --   single_choice : "option-id"
  --   multiple_choice : ["opt1", "opt2"]
  --   text : "réponse libre"
  --   ranking : ["opt2", "opt1", "opt3"] (ordre = classement)
  --   date_selection : ["2026-05-12", "2026-05-13"]
  response_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- 1 vote par organisation, peut être écrasé par le titulaire
  UNIQUE(vote_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_responses_vote ON vote_responses(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_responses_org ON vote_responses(organization_id);
