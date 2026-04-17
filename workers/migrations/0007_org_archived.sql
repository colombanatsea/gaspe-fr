-- GASPE D1 Migration 0007 — Add archived column to organizations
-- Apply: npx wrangler d1 execute gaspe-db --file workers/migrations/0007_org_archived.sql

ALTER TABLE organizations ADD COLUMN archived INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_organizations_archived ON organizations(archived);
