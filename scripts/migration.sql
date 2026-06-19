-- ============================================================
-- NRF Road Report — Supabase Migration
-- Run this in your Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS guards)
-- ============================================================

-- Road reports table
CREATE TABLE IF NOT EXISTS road_reports (
  id                BIGSERIAL PRIMARY KEY,
  reference_number  TEXT UNIQUE,
  title             TEXT,
  county            TEXT NOT NULL,
  community         TEXT NOT NULL,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  ip_address        TEXT,
  condition_type    TEXT NOT NULL,
  severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'closed')),
  contact_name      TEXT,
  contact_phone     TEXT,
  contact_email     TEXT,
  admin_notes       TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ
);

-- Add title column to existing table (safe no-op if already exists)
ALTER TABLE road_reports ADD COLUMN IF NOT EXISTS title TEXT;

-- Photos table
CREATE TABLE IF NOT EXISTS road_report_photos (
  id            BIGSERIAL PRIMARY KEY,
  report_id     BIGINT NOT NULL REFERENCES road_reports(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS road_report_admins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'reviewer'
                   CHECK (role IN ('reviewer', 'manager', 'admin')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_road_reports_county    ON road_reports (county);
CREATE INDEX IF NOT EXISTS idx_road_reports_status    ON road_reports (status);
CREATE INDEX IF NOT EXISTS idx_road_reports_severity  ON road_reports (severity);
CREATE INDEX IF NOT EXISTS idx_road_reports_submitted ON road_reports (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_road_report_photos_report_id ON road_report_photos (report_id);

-- ============================================================
-- RLS: disable for service role (Supabase default)
-- Run after migration if you enable RLS:
--   ALTER TABLE road_reports ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "service_role_all" ON road_reports USING (true);
-- ============================================================

-- ============================================================
-- Storage bucket: create via Supabase dashboard
-- Name: road-report-photos  |  Public: true
-- ============================================================
