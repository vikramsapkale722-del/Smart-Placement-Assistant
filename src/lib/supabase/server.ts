import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env, isSupabaseConfigured } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Creates a server-side Supabase client for Server Components, Server Actions,
 * and Route Handlers with secure cookie session forwarding.
 *
 * Returns null if Supabase environment variables are not yet configured.
 */
export function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient<Database>(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Invoking setAll from a Server Component throws an error.
            // This is caught and handled safely as session refreshing occurs in middleware.
          }
        },
      },
    }
  );
}
