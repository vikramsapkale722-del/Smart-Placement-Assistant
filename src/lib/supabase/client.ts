import { createBrowserClient } from '@supabase/ssr';
import { env, isSupabaseConfigured } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Creates a browser-side Supabase client using cookie authentication.
 * Returns null if Supabase environment variables have not been configured yet.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient<Database>(env.supabase.url, env.supabase.anonKey);
}
