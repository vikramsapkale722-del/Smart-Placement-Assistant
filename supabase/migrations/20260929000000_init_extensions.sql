-- ==============================================================================
-- SMART PLACEMENT PORTAL — DATABASE INITIALIZATION & EXTENSIONS
-- Migration: 20260929000000_init_extensions.sql
-- Description: Enables required PostgreSQL extensions and defines reusable
--              utility trigger functions for automated timestamp management.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define Reusable Timestamp Management Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Document Migration Foundation
COMMENT ON FUNCTION public.handle_updated_at() IS 
  'Trigger function automatically updating updated_at timestamp on entity mutation.';
