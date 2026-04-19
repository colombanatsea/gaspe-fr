-- 0008_newsletter.sql
-- GASPE Newsletter v2 : drafts, sends, events, templates
-- Spec: docs/NEWSLETTER-SPEC.md

-- Drafts : editable newsletters in progress
CREATE TABLE IF NOT EXISTS nl_drafts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  preheader TEXT NOT NULL DEFAULT '',
  blocks_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent | archived
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_nl_drafts_status ON nl_drafts(status);
CREATE INDEX IF NOT EXISTS idx_nl_drafts_created_by ON nl_drafts(created_by);

-- Sends : history of sent newsletters
CREATE TABLE IF NOT EXISTS nl_sends (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  category TEXT NOT NULL, -- info_generales | ag | emploi | ...
  subject TEXT NOT NULL,
  preheader TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nl_sends_draft ON nl_sends(draft_id);
CREATE INDEX IF NOT EXISTS idx_nl_sends_category ON nl_sends(category);

-- Events : Brevo webhook ingestion (deliveries, opens, clicks, bounces, unsubs)
CREATE TABLE IF NOT EXISTS nl_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  send_id TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL, -- delivered | opened | clicked | bounced | unsubscribed | complaint
  event_at TEXT NOT NULL DEFAULT (datetime('now')),
  payload_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_nl_events_send ON nl_events(send_id);
CREATE INDEX IF NOT EXISTS idx_nl_events_email ON nl_events(email);
CREATE INDEX IF NOT EXISTS idx_nl_events_type ON nl_events(event_type);

-- Templates : pre-configured block layouts (phase 8)
CREATE TABLE IF NOT EXISTS nl_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  blocks_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
