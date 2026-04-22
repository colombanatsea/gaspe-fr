-- GASPE D1 Migration 0004 – Link existing users to organizations
-- Apply: npx wrangler d1 execute gaspe-db --file workers/migrations/0004_link_users_organizations.sql
--
-- This migration matches users.company (free text) to organizations.name
-- and sets organization_id + is_primary for the first adherent of each company.

-- ══════════════════════════════════════════════════════════
--  Step 1: Link adherent users to organizations by company name
-- ══════════════════════════════════════════════════════════

UPDATE users
SET organization_id = (
  SELECT o.id FROM organizations o
  WHERE LOWER(TRIM(o.name)) = LOWER(TRIM(users.company))
  LIMIT 1
)
WHERE role = 'adherent'
  AND organization_id IS NULL
  AND company IS NOT NULL
  AND company != ''
  AND EXISTS (
    SELECT 1 FROM organizations o
    WHERE LOWER(TRIM(o.name)) = LOWER(TRIM(users.company))
  );

-- ══════════════════════════════════════════════════════════
--  Step 2: Set is_primary for earliest adherent per organization
--  (the first approved user per org becomes the responsable)
-- ══════════════════════════════════════════════════════════

UPDATE users
SET is_primary = 1
WHERE id IN (
  SELECT u.id
  FROM users u
  WHERE u.role = 'adherent'
    AND u.organization_id IS NOT NULL
    AND u.approved = 1
    AND u.archived = 0
    AND u.id = (
      SELECT u2.id FROM users u2
      WHERE u2.organization_id = u.organization_id
        AND u2.role = 'adherent'
        AND u2.approved = 1
        AND u2.archived = 0
      ORDER BY u2.created_at ASC
      LIMIT 1
    )
);

-- ══════════════════════════════════════════════════════════
--  Step 3: Create default newsletter preferences for users who don't have them
-- ══════════════════════════════════════════════════════════

INSERT OR IGNORE INTO newsletter_preferences (user_id)
SELECT id FROM users
WHERE (role = 'adherent' OR role = 'candidat')
  AND approved = 1
  AND archived = 0;
