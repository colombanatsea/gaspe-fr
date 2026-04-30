-- 0030_validation_email_sent.sql
-- Session 51 - Tracking idempotent des emails de notification campagne.
--
-- Le Cloudflare Workers Cron Trigger tourne quotidiennement et envoie des
-- emails aux titulaires en retard. Sans cette table, un re-run du cron (ou
-- un PATCH draft->open->draft->open) enverrait des doublons. UNIQUE(
-- campaign_id, notification_type) garantit qu'un type de notification n'est
-- envoye qu'une fois par campagne.
--
-- Types couverts :
-- - 'opened' : email J+0 ouverture campagne (PATCH draft->open ou POST avec
--   status='open' direct, session 49)
-- - 'due_soon' : email J-14 deadline approche (cron quotidien, session 51)
-- - 'overdue' : email J+0 deadline atteinte (cron quotidien, session 51)
--
-- Pas de notification J+14 relance manuelle : deja gere par le bouton mailto
-- BCC du dashboard (action humaine, pas automatisee).

CREATE TABLE IF NOT EXISTS validation_email_sent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES fleet_validation_campaigns(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('opened', 'due_soon', 'overdue')),
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  recipients_count INTEGER NOT NULL DEFAULT 0,
  recipients_skipped INTEGER NOT NULL DEFAULT 0,
  UNIQUE(campaign_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_email_sent_campaign ON validation_email_sent(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sent_type ON validation_email_sent(notification_type);
