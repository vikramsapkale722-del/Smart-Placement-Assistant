import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { LoginInput, RegisterInput } from '@/features/auth/schemas';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Authentication Service
 * Centralizes all Supabase Auth interactions on the server.
 */
export const authService = {
  /**
   * Retrieves the current authenticated user from verified JWT.
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = createServerSupabaseClient();
    if (!supabase) return null;

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Retrieves the active session if available.
   */
  async getSession(): Promise<Session | null> {
    const supabase = createServerSupabaseClient();
    if (!supabase) return null;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Asserts that a user is authenticated. Throws an error if unauthenticated.
   */
  async requireAuth(): Promise<User> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('UNAUTHORIZED: Authentication required to access this resource.');
    }
    return user;
  },

  /**
   * Authenticates user with email and password.
   */
  async signIn(input: LoginInput): Promise<AuthResult<{ user: User; session: Session | null }>> {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Authentication service is not configured. Please check environment variables.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      // Map Supabase auth error to user-friendly safe message without leaking internal details
      let message = 'Invalid email or password. Please try again.';
      if (error.message.includes('Email not confirmed')) {
        message = 'Please verify your email address before logging in.';
      }
      return { success: false, error: message };
    }

    if (!data.user) {
      return { success: false, error: 'Unable to authenticate. Please verify your credentials.' };
    }

    return {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };
  },

  /**
   * Registers a new user account with metadata for future role tracking.
   */
  async signUp(input: RegisterInput): Promise<AuthResult<{ user: User | null; requiresEmailConfirmation: boolean }>> {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Authentication service is not configured. Please check environment variables.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          role: input.role,
        },
      },
    });

    if (error) {
      let message = error.message;
      if (error.message.includes('User already registered')) {
        message = 'An account with this email already exists. Please sign in instead.';
      }
      return { success: false, error: message };
    }

    // Supabase returns a user with empty identities if user already exists in some configs
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
    }

    const requiresEmailConfirmation = !data.session;

    return {
      success: true,
      data: {
        user: data.user,
        requiresEmailConfirmation,
      },
    };
  },

  /**
   * Terminates the current session and clears cookies.
   */
  async signOut(): Promise<AuthResult> {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return { success: true };
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
