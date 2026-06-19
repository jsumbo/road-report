-- ============================================================
-- NRF Road Report — Complete Supabase Setup
-- Run once in your Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run: all statements use IF NOT EXISTS guards
-- ============================================================


-- ============================================================
-- 1. ROAD REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS road_reports (
  id                BIGSERIAL PRIMARY KEY,
  reference_number  TEXT UNIQUE,                          -- e.g. NRF-2025-000001
  title             TEXT NOT NULL,
  county            TEXT NOT NULL,
  community         TEXT NOT NULL,
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  ip_address        TEXT,
  condition_type    TEXT NOT NULL
                      CHECK (condition_type IN (
                        'pothole', 'flooding', 'bridge_damage', 'road_erosion',
                        'missing_guardrail', 'landslide', 'damaged_culvert', 'other'
                      )),
  severity          TEXT NOT NULL
                      CHECK (severity IN ('low', 'medium', 'high', 'critical')),
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

-- Safe backfill for deployments that used the old schema
ALTER TABLE road_reports ADD COLUMN IF NOT EXISTS title TEXT;

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_road_reports_updated_at ON road_reports;
CREATE TRIGGER trg_road_reports_updated_at
  BEFORE UPDATE ON road_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 2. REPORT PHOTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS road_report_photos (
  id            BIGSERIAL PRIMARY KEY,
  report_id     BIGINT NOT NULL REFERENCES road_reports(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,   -- path inside the Supabase storage bucket
  public_url    TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. ADMIN USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS road_report_admins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,   -- bcrypt hash only — never store plaintext
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'reviewer'
                   CHECK (role IN ('reviewer', 'manager', 'admin')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. CITIZEN SURVEYS
-- Collected via the 3 survey steps embedded in the report form.
-- report_reference links back to the road report submitted first.
-- ============================================================

CREATE TABLE IF NOT EXISTS citizen_surveys (
  id                  BIGSERIAL PRIMARY KEY,
  reference_number    TEXT UNIQUE NOT NULL,             -- e.g. NRF-S-2025-00001
  report_reference    TEXT REFERENCES road_reports(reference_number) ON DELETE SET NULL,

  -- Location (pre-filled from the road report)
  county              TEXT NOT NULL,
  community           TEXT NOT NULL,

  -- Step 3: Road condition & safety  (1 = worst, 5 = best)
  road_rating         INT  NOT NULL CHECK (road_rating   BETWEEN 1 AND 5),
  safety_rating       INT  NOT NULL CHECK (safety_rating BETWEEN 1 AND 5),
  road_problems       TEXT[] NOT NULL DEFAULT '{}',
  -- possible values: Potholes, Uneven surface, Flooding, No lighting,
  --                  Damaged bridges, Poor drainage, Road erosion, Other

  -- Step 4: Maintenance & impact
  maintenance_done    TEXT NOT NULL CHECK (maintenance_done IN ('yes', 'no', 'unsure')),
  maint_satisfaction  INT  CHECK (maint_satisfaction BETWEEN 1 AND 5),
  maint_delivered     TEXT CHECK (maint_delivered IN ('yes', 'partially', 'no')),
  impact_areas        TEXT[] NOT NULL DEFAULT '{}',
  -- possible values: Markets, Health facilities, Schools, Workplaces, No significant impact
  transport_cost      TEXT NOT NULL CHECK (transport_cost IN ('increased', 'same', 'decreased')),

  -- Step 5: NRF awareness & feedback
  nrf_aware           BOOLEAN NOT NULL,
  nrf_satisfaction    INT  CHECK (nrf_satisfaction BETWEEN 1 AND 5),
  feedback            TEXT,   -- optional free-text, max 500 chars

  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add report_reference to existing citizen_surveys tables
ALTER TABLE citizen_surveys
  ADD COLUMN IF NOT EXISTS report_reference TEXT REFERENCES road_reports(reference_number) ON DELETE SET NULL;


-- ============================================================
-- 5. INDEXES
-- ============================================================

-- road_reports
CREATE INDEX IF NOT EXISTS idx_road_reports_county     ON road_reports (county);
CREATE INDEX IF NOT EXISTS idx_road_reports_status     ON road_reports (status);
CREATE INDEX IF NOT EXISTS idx_road_reports_severity   ON road_reports (severity);
CREATE INDEX IF NOT EXISTS idx_road_reports_submitted  ON road_reports (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_road_reports_condition  ON road_reports (condition_type);

-- road_report_photos
CREATE INDEX IF NOT EXISTS idx_photos_report_id        ON road_report_photos (report_id);

-- citizen_surveys
CREATE INDEX IF NOT EXISTS idx_surveys_county          ON citizen_surveys (county);
CREATE INDEX IF NOT EXISTS idx_surveys_submitted       ON citizen_surveys (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_road_rating     ON citizen_surveys (road_rating);
CREATE INDEX IF NOT EXISTS idx_surveys_nrf_aware       ON citizen_surveys (nrf_aware);
CREATE INDEX IF NOT EXISTS idx_surveys_report_ref      ON citizen_surveys (report_reference);


-- ============================================================
-- 6. ROW-LEVEL SECURITY
-- The app uses the service role key (bypasses RLS by default).
-- Enable these if you ever expose the anon key to the browser.
-- ============================================================

-- ALTER TABLE road_reports        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE road_report_photos  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE road_report_admins  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE citizen_surveys     ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "service_role_all" ON road_reports       USING (true) WITH CHECK (true);
-- CREATE POLICY "service_role_all" ON road_report_photos USING (true) WITH CHECK (true);
-- CREATE POLICY "service_role_all" ON road_report_admins USING (true) WITH CHECK (true);
-- CREATE POLICY "service_role_all" ON citizen_surveys    USING (true) WITH CHECK (true);


-- ============================================================
-- 7. STORAGE BUCKET  (create via Supabase Dashboard)
-- Dashboard → Storage → New bucket
--   Name:   road-report-photos
--   Public: true  (photos are served via public CDN URLs)
-- ============================================================
