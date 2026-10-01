-- ==============================================================================
-- SMART PLACEMENT PORTAL — JOBS FOUNDATION MIGRATION
-- Migration: 20260929000003_jobs_foundation.sql
-- Description: Establishes normalized jobs table with controlled status,
--              academic eligibility parameters, CTC/stipend constraints, and RLS policies.
-- ==============================================================================

-- 1. Create Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time', 'internship', 'internship_to_full_time')),
  location TEXT NOT NULL,
  workplace_type TEXT NOT NULL DEFAULT 'on_site'
    CHECK (workplace_type IN ('on_site', 'remote', 'hybrid')),

  -- Compensation details
  ctc_min NUMERIC(12, 2) CHECK (ctc_min >= 0),
  ctc_max NUMERIC(12, 2) CHECK (ctc_max >= ctc_min),
  ctc_display_text TEXT,
  stipend_monthly NUMERIC(12, 2) CHECK (stipend_monthly >= 0),
  is_salary_disclosed BOOLEAN NOT NULL DEFAULT TRUE,

  -- Academic Eligibility Requirements
  department TEXT,
  degree TEXT NOT NULL DEFAULT 'B.Tech / M.Tech / MCA',
  min_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
  allowed_departments TEXT[] NOT NULL DEFAULT '{}',
  max_active_backlogs INTEGER NOT NULL DEFAULT 0 CHECK (max_active_backlogs >= 0),
  eligible_batch_years INTEGER[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] NOT NULL DEFAULT '{}',

  -- Recruitment Process & Headcount
  number_of_openings INTEGER CHECK (number_of_openings > 0),
  selection_process TEXT,

  -- Controlled Status Life-Cycle
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  is_approved_by_admin BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps & Deadlines
  application_deadline TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 2. Row Level Security Policies for Jobs
-- SELECT Policy:
-- - Associated company recruiters can view all their jobs (including draft/closed/archived)
-- - Public / Students can only view published jobs with non-expired deadlines and admin approval
-- - Admins can view all jobs
CREATE POLICY "Recruiters can view jobs belonging to their company"
  ON public.jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = public.jobs.company_id
      AND cu.user_id = auth.uid()
    )
    OR (
      status = 'published'
      AND is_approved_by_admin = TRUE
      AND application_deadline > NOW()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- INSERT Policy:
-- Authenticated recruiters can only create jobs for their own company
CREATE POLICY "Recruiters can insert jobs for their own company"
  ON public.jobs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = public.jobs.company_id
      AND cu.user_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- UPDATE Policy:
-- Authenticated recruiters can only update jobs for their own company
CREATE POLICY "Recruiters can update jobs for their own company"
  ON public.jobs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = public.jobs.company_id
      AND cu.user_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- DELETE Policy:
-- Recruiters can only delete draft jobs belonging to their own company
CREATE POLICY "Recruiters can delete draft jobs for their own company"
  ON public.jobs
  FOR DELETE
  USING (
    status = 'draft'
    AND (
      EXISTS (
        SELECT 1 FROM public.company_users cu
        WHERE cu.company_id = public.jobs.company_id
        AND cu.user_id = auth.uid()
      )
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

-- 3. Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status_deadline ON public.jobs(status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_min_cgpa ON public.jobs(min_cgpa);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- 4. Trigger for automated updated_at
DROP TRIGGER IF EXISTS trg_jobs_updated_at ON public.jobs;
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
