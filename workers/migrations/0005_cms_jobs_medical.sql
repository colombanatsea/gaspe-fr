-- Migration 0005: CMS pages, job offers, medical visits
-- Replaces localStorage for multi-admin support

-- CMS page content (admin-edited sections)
CREATE TABLE IF NOT EXISTS cms_pages (
  page_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  section_label TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'richtext',
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT REFERENCES users(id),
  PRIMARY KEY (page_id, section_id)
);

-- Job offers created by admin or adherents
CREATE TABLE IF NOT EXISTS job_offers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_slug TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  contract_type TEXT NOT NULL DEFAULT 'CDI',
  category TEXT NOT NULL DEFAULT 'pont',
  zone TEXT NOT NULL DEFAULT 'normandie',
  brevet TEXT,
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT,
  salary_range TEXT,
  salary_min INTEGER,
  slug TEXT NOT NULL UNIQUE,
  published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  application_url TEXT,
  reference TEXT,
  start_date TEXT,
  contact_phone TEXT,
  handi_accessible INTEGER NOT NULL DEFAULT 0,
  hydros_offer_id TEXT,
  hydros_offer_url TEXT,
  created_by TEXT REFERENCES users(id),
  created_by_role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Medical visits tracking (adherent: crew aptitude monitoring)
CREATE TABLE IF NOT EXISTS medical_visits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  organization_id TEXT REFERENCES organizations(id),
  crew_member_name TEXT NOT NULL,
  crew_member_role TEXT,
  visit_type TEXT NOT NULL DEFAULT 'aptitude',
  visit_date TEXT NOT NULL,
  expiry_date TEXT,
  result TEXT NOT NULL DEFAULT 'pending',
  doctor_name TEXT,
  center_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Media library metadata (files stored in R2)
CREATE TABLE IF NOT EXISTS media_library (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  uploaded_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_offers_published ON job_offers(published, published_at);
CREATE INDEX IF NOT EXISTS idx_job_offers_slug ON job_offers(slug);
CREATE INDEX IF NOT EXISTS idx_job_offers_created_by ON job_offers(created_by);
CREATE INDEX IF NOT EXISTS idx_medical_visits_user ON medical_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_visits_org ON medical_visits(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
