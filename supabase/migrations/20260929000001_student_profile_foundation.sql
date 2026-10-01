-- ==============================================================================
-- SMART PLACEMENT PORTAL — STUDENT PROFILE FOUNDATION MIGRATION
-- Migration: 20260929000001_student_profile_foundation.sql
-- Description: Establishes users, student_profiles, student_skills,
--              student_projects, student_certifications, and student_achievements
--              tables with strict relational integrity, checks, and RLS policies.
-- ==============================================================================

-- 1. Create Public Users Table (Mapped 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'company', 'admin')),
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record or admin"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can update own record or admin"
  ON public.users
  FOR UPDATE
  USING (
    auth.uid() = id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can insert own record"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Create Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL DEFAULT 'Engineering & Technology College',
  degree TEXT NOT NULL DEFAULT 'B.Tech',
  roll_number TEXT NOT NULL,
  department TEXT NOT NULL,
  batch_year INTEGER NOT NULL CHECK (batch_year >= 2000 AND batch_year <= 2100),
  cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (cgpa >= 0.0 AND cgpa <= 10.0),
  tenth_percentage NUMERIC(5,2) CHECK (tenth_percentage >= 0.0 AND tenth_percentage <= 100.0),
  twelfth_percentage NUMERIC(5,2) CHECK (twelfth_percentage >= 0.0 AND twelfth_percentage <= 100.0),
  active_backlogs INTEGER NOT NULL DEFAULT 0 CHECK (active_backlogs >= 0),
  total_backlogs_cleared INTEGER NOT NULL DEFAULT 0 CHECK (total_backlogs_cleared >= 0),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  is_academically_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on student_profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own profile or admin"
  ON public.student_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Students can insert own profile"
  ON public.student_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own profile"
  ON public.student_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Indexes for student_profiles
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_dept_batch ON public.student_profiles(department, batch_year);
CREATE INDEX IF NOT EXISTS idx_student_profiles_cgpa ON public.student_profiles(cgpa);

-- 3. Create Student Skills Table
CREATE TABLE IF NOT EXISTS public.student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical' CHECK (category IN ('technical', 'soft', 'tool', 'language', 'other')),
  proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_skill UNIQUE (student_id, name)
);

ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own skills"
  ON public.student_skills
  FOR ALL
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON public.student_skills(student_id);

-- 4. Create Student Projects Table
CREATE TABLE IF NOT EXISTS public.student_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  project_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own projects"
  ON public.student_projects
  FOR ALL
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_student_projects_student_id ON public.student_projects(student_id);

-- 5. Create Student Certifications Table
CREATE TABLE IF NOT EXISTS public.student_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE,
  credential_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own certifications"
  ON public.student_certifications
  FOR ALL
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_student_certifications_student_id ON public.student_certifications(student_id);

-- 6. Create Student Achievements Table
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own achievements"
  ON public.student_achievements
  FOR ALL
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id ON public.student_achievements(student_id);

-- 7. Automated Updated At Triggers
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_student_projects_updated_at ON public.student_projects;
CREATE TRIGGER trg_student_projects_updated_at
  BEFORE UPDATE ON public.student_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_student_certifications_updated_at ON public.student_certifications;
CREATE TRIGGER trg_student_certifications_updated_at
  BEFORE UPDATE ON public.student_certifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_student_achievements_updated_at ON public.student_achievements;
CREATE TRIGGER trg_student_achievements_updated_at
  BEFORE UPDATE ON public.student_achievements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
