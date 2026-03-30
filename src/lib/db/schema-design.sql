-- ═══════════════════════════════════════════════════════════
--  GASPE D1 Database Schema — Migration Plan
--  Target: Cloudflare D1 (SQLite-compatible)
--  Replaces: localStorage-based auth + CMS
-- ═══════════════════════════════════════════════════════════

-- ── USERS ──
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'adherent', 'candidat')),
  company TEXT,
  phone TEXT,
  approved INTEGER DEFAULT 0,          -- 0 = pending, 1 = approved
  current_position TEXT,               -- candidat: current job
  desired_position TEXT,               -- candidat: desired job
  experience TEXT,                     -- candidat: experience summary
  certifications TEXT,                 -- candidat: maritime certs
  cv_filename TEXT,                    -- candidat: uploaded CV name
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── AUTH (passwords stored separately, hashed) ──
CREATE TABLE IF NOT EXISTS auth (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL           -- bcrypt hash
);

-- ── JOBS ──
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_slug TEXT NOT NULL,
  location TEXT NOT NULL,
  zone TEXT NOT NULL,                   -- normandie, bretagne, nouvelle-aquitaine, etc.
  contract_type TEXT NOT NULL CHECK (contract_type IN ('CDI', 'CDD', 'Saisonnier')),
  category TEXT NOT NULL,               -- Pont, Machine, Technique
  brevet TEXT,                          -- required maritime certification
  description TEXT NOT NULL,
  profile TEXT NOT NULL,
  conditions TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  salary_range TEXT,
  salary_min INTEGER,                   -- monthly gross in EUR
  published INTEGER DEFAULT 1,
  owner_id TEXT REFERENCES users(id),   -- NULL for static/admin-created
  published_at TEXT NOT NULL DEFAULT (date('now')),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── FORMATIONS ──
CREATE TABLE IF NOT EXISTS formations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organizer TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  location TEXT NOT NULL,
  duration TEXT,
  capacity INTEGER DEFAULT 0,
  enrolled INTEGER DEFAULT 0,
  target_audience TEXT,
  prerequisites TEXT,
  price TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'full')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── FORMATION ENROLLMENTS ──
CREATE TABLE IF NOT EXISTS formation_enrollments (
  id TEXT PRIMARY KEY,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(formation_id, user_id)
);

-- ── POSITIONS & PRESS ──
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Position', 'Communiqué de presse', 'Actualité')),
  date TEXT NOT NULL,
  cover_image_url TEXT,
  published INTEGER DEFAULT 0,
  tags TEXT,                            -- JSON array stored as text
  attachment_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── AGENDA EVENTS ──
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  location TEXT NOT NULL,
  event_url TEXT,
  published INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── DOCUMENTS ──
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT DEFAULT '#',
  upload_date TEXT NOT NULL DEFAULT (date('now')),
  is_public INTEGER DEFAULT 0,         -- 0 = adherents only, 1 = public
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── CANDIDATURES (job applications) ──
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_id, user_id)
);

-- ── SAVED OFFERS ──
CREATE TABLE IF NOT EXISTS saved_offers (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, job_id)
);

-- ── NEWSLETTER SUBSCRIPTIONS ──
CREATE TABLE IF NOT EXISTS newsletter (
  email TEXT PRIMARY KEY,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── CONTACT MESSAGES ──
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  societe TEXT,
  sujet TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read INTEGER DEFAULT 0
);

-- ── SITE SETTINGS ──
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════
--  INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_jobs_zone ON jobs(zone);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_published ON jobs(published);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_formations_status ON formations(status);
CREATE INDEX IF NOT EXISTS idx_positions_category ON positions(category);
CREATE INDEX IF NOT EXISTS idx_positions_published ON positions(published);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);

-- ═══════════════════════════════════════════════════════════
--  MIGRATION NOTES
-- ═══════════════════════════════════════════════════════════
--
-- Migration from localStorage to D1:
-- 1. gaspe_users → users table
-- 2. gaspe_passwords → auth table (re-hash with bcrypt)
-- 3. Static jobs (src/data/jobs.ts) → jobs table (one-time seed)
-- 4. gaspe_admin_offers + gaspe_adherent_offers → jobs table
-- 5. gaspe_formations → formations table
-- 6. gaspe_positions → positions table
-- 7. gaspe_agenda → events table
-- 8. gaspe_documents → documents table
-- 9. gaspe_settings → settings table (key-value pairs)
-- 10. gaspe_newsletter → newsletter table
-- 11. gaspe_contact_messages → contact_messages table
--
-- Auth migration path:
-- localStorage AuthContext → NextAuth.js v5 + D1 adapter
-- Drizzle ORM already in dependencies (unused)
--
-- API routes needed (Cloudflare Workers):
-- POST /api/auth/login
-- POST /api/auth/register
-- GET/POST /api/jobs
-- GET/POST /api/formations
-- GET/POST /api/positions
-- GET/POST /api/events
-- GET/POST /api/documents
-- POST /api/contact
-- POST /api/newsletter
