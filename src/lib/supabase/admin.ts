import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Creates a privileged administrative Supabase client using the Service Role Key.
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * 1. This client MUST NEVER be executed or bundled into the browser client.
 * 2. It bypasses Row Level Security (RLS) and is intended strictly for administrative
 *    tasks, automated cron workflows, or background worker jobs.
 * 3. Throws a defensive error if invoked in browser contexts or if the service role key is absent.
 */
export function createAdminSupabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: createAdminSupabaseClient() cannot be invoked from client-side code.');
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isSupabaseConfigured() || !serviceRoleKey) {
    throw new Error('CONFIG ERROR: SUPABASE_SERVICE_ROLE_KEY or public URL is missing.');
  }

  return createClient<Database>(env.supabase.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
