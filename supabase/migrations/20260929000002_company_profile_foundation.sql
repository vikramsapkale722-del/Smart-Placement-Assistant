-- ==============================================================================
-- SMART PLACEMENT PORTAL — COMPANY PROFILE FOUNDATION MIGRATION
-- Migration: 20260929000002_company_profile_foundation.sql
-- Description: Establishes companies and company_users tables with strict
--              relational integrity, checks, updated_at triggers, and RLS policies.
-- ==============================================================================

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  company_email TEXT,
  company_phone TEXT,
  location TEXT,
  company_size TEXT,
  founded_year INTEGER CHECK (founded_year >= 1800 AND founded_year <= 2100),
  linkedin_url TEXT,
  company_type TEXT DEFAULT 'Product',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Create Company Users Association Table (Relates auth users to companies)
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'recruiter' CHECK (role IN ('owner', 'recruiter', 'hiring_manager', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_company_users_user_id UNIQUE (user_id),
  CONSTRAINT uq_company_users_company_user UNIQUE (company_id, user_id)
);

-- Enable RLS on company_users
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for Companies
CREATE POLICY "Company recruiters can view their own company"
  ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = public.companies.id
      AND cu.user_id = auth.uid()
    )
    OR is_verified = TRUE
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Authenticated company users can insert company"
  ON public.companies
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Company recruiters can update their own company"
  ON public.companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = public.companies.id
      AND cu.user_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 4. Row Level Security Policies for Company Users
CREATE POLICY "Users can view own company association"
  ON public.company_users
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can insert own company association"
  ON public.company_users
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Users can update own company association"
  ON public.company_users
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_is_verified ON public.companies(is_verified);

-- 6. Trigger for automated updated_at
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
