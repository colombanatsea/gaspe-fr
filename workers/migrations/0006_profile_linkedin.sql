-- Migration 0006: Add profile photo, LinkedIn URL, and company LinkedIn URL
-- Session 23: Profile enhancements for candidats and adherents

ALTER TABLE users ADD COLUMN profile_photo TEXT;
ALTER TABLE users ADD COLUMN linkedin_url TEXT;
ALTER TABLE users ADD COLUMN company_linkedin_url TEXT;
