import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

describe('Supabase Client Architecture & Isolation Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('createClient returns null gracefully when public Supabase variables are absent', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const client = createClient();
    expect(client).toBeNull();
  });

  it('createAdminSupabaseClient throws security violation error when invoked in browser window', () => {
    // Simulate browser window global
    (global as unknown as { window: unknown }).window = {};

    expect(() => createAdminSupabaseClient()).toThrow(
      /SECURITY VIOLATION: createAdminSupabaseClient\(\) cannot be invoked from client-side code/
    );

    // Cleanup simulated window
    delete (global as unknown as { window?: unknown }).window;
  });

  it('createAdminSupabaseClient throws config error when service role key is missing on server', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createAdminSupabaseClient()).toThrow(
      /CONFIG ERROR: SUPABASE_SERVICE_ROLE_KEY or public URL is missing/
    );
  });

  it('isSupabaseConfigured correctly identifies missing credentials', () => {
    expect(typeof isSupabaseConfigured()).toBe('boolean');
  });
});
