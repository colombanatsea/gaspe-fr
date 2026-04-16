-- Migration 0005: CMS pages, jobs, medical visits, media files
-- Session 23: Backend tables for frontend API stores

-- CMS page content (replaces localStorage gaspe_page_content)
CREATE TABLE IF NOT EXISTS cms_pages (
  page_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (page_id, section_id)
);

-- Job offers (replaces localStorage gaspe_admin_offers + gaspe_adherent_offers)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_slug TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT 'normandie',
  contract_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Autre',
  brevet TEXT,
  description TEXT NOT NULL DEFAULT '',
  profile TEXT,
  conditions TEXT,
  contact_email TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  application_url TEXT,
  reference TEXT,
  start_date TEXT,
  salary_range TEXT,
  salary_min INTEGER,
  handi_accessible INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL DEFAULT (date('now')),
  expires_at TEXT,
  source TEXT NOT NULL DEFAULT 'admin',
  created_by TEXT,
  hydros_offer_url TEXT,
  hydros_offer_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_published ON jobs(published);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);

-- Medical visits (replaces localStorage gaspe_medical_visits)
CREATE TABLE IF NOT EXISTS medical_visits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sailor_name TEXT NOT NULL,
  sailor_role TEXT,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  expiry_date TEXT,
  center_id TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  certificate_ref TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_medical_visits_user ON medical_visits(user_id);

-- Media files metadata (actual files stored in R2, replaces localStorage gaspe_media_library)
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  alt TEXT,
  uploaded_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
