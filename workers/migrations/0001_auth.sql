-- GASPE D1 Migration 0001 – Auth tables
-- Apply: npx wrangler d1 execute gaspe-db --file workers/migrations/0001_auth.sql

-- Users table with GASPE-specific fields
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'adherent', 'candidat')),
  company TEXT,
  phone TEXT,
  approved INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  company_role TEXT,
  company_description TEXT,
  company_logo TEXT,
  company_address TEXT,
  company_email TEXT,
  company_phone TEXT,
  current_position TEXT,
  desired_position TEXT,
  preferred_zone TEXT,
  experience TEXT,
  certifications TEXT,
  cv_filename TEXT,
  membership_status TEXT DEFAULT 'pending' CHECK (membership_status IN ('due', 'paid', 'pending')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Passwords stored separately (bcrypt hashes)
CREATE TABLE IF NOT EXISTS auth (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL
);

-- Sessions table for JWT refresh tracking
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Newsletter subscriptions
CREATE TABLE IF NOT EXISTS newsletter (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  societe TEXT,
  sujet TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Seed admin user (password: admin123, bcrypt hash)
-- Hash generated with bcryptjs.hashSync('admin123', 10)
INSERT OR IGNORE INTO users (id, email, name, role, approved, created_at, updated_at)
VALUES ('admin-001', 'admin@gaspe.fr', 'Administrateur GASPE', 'admin', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO auth (user_id, password_hash)
VALUES ('admin-001', '$2a$10$placeholder_replace_on_deploy');
