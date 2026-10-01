-- ==============================================================================
-- SMART PLACEMENT PORTAL — JOB APPLICATIONS FOUNDATION MIGRATION
-- Migration: 20260929000004_job_applications_foundation.sql
-- Description: Establishes normalized job_applications and application_status_history
--              tables with strict duplicate constraints, status checks, and RLS policies.
-- ==============================================================================

-- 1. Create Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE RESTRICT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'withdrawn', 'shortlisted', 'in_review', 'offered', 'rejected')),
  cover_note TEXT,
  eligibility_snapshot JSONB,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Database-level duplicate prevention constraint
  CONSTRAINT uq_job_applications_job_student UNIQUE (job_id, student_id)
);

-- 2. Create Application Status History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON public.job_applications(job_id, status);
CREATE INDEX IF NOT EXISTS idx_app_history_app_id ON public.application_status_history(application_id);

-- 4. Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies for Job Applications
-- SELECT Policy:
-- - Students can view their own applications
-- - Company recruiters can view applications for jobs belonging to their company
-- - Admins can view all applications
CREATE POLICY "Students and recruiters can view applications"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.company_users cu ON j.company_id = cu.company_id
      WHERE j.id = job_applications.job_id
      AND cu.user_id = auth.uid()
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- INSERT Policy:
-- - Students can only insert applications under their own verified student profile
CREATE POLICY "Students can submit applications"
  ON public.job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
  );

-- UPDATE Policy:
-- - Students can withdraw their own application
-- - Company recruiters can update status of applications for their company's jobs
-- - Admins can update any application
CREATE POLICY "Authorized users can update applications"
  ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (
    student_id = (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.company_users cu ON j.company_id = cu.company_id
      WHERE j.id = job_applications.job_id
      AND cu.user_id = auth.uid()
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 6. Row Level Security Policies for Application Status History
-- SELECT Policy:
CREATE POLICY "Authorized users can view application history"
  ON public.application_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = application_status_history.application_id
      AND (
        ja.student_id = (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.company_users cu ON j.company_id = cu.company_id
          WHERE j.id = ja.job_id
          AND cu.user_id = auth.uid()
        )
        OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
      )
    )
  );

-- INSERT Policy:
CREATE POLICY "Authorized users can insert application history"
  ON public.application_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = application_status_history.application_id
      AND (
        ja.student_id = (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.company_users cu ON j.company_id = cu.company_id
          WHERE j.id = ja.job_id
          AND cu.user_id = auth.uid()
        )
        OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
      )
    )
  );
