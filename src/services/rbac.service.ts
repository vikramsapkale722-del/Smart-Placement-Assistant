import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { authService } from '@/services/auth.service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  USER_ROLES,
  type UserRole,
  isValidRole,
  extractSafeRole,
} from '@/lib/auth/roles';

export interface AuthorizedSession {
  user: User;
  role: UserRole;
}

/**
 * Role-Based Access Control (RBAC) Service
 * Server-side authoritative validation of user roles and route authorization.
 */
export const rbacService = {
  /**
   * Resolves the authoritative role of a user.
   *
   * SECURITY ENFORCEMENT HIERARCHY:
   * 1. Evaluates user.app_metadata.role (tamper-proof, set via Admin API).
   * 2. Queries public.users database table for the verified role.
   * 3. Falls back to user.user_metadata.role ONLY for 'student' or 'company'.
   *    ATTEMPTED SELF-PROMOTION TO 'admin' VIA USER_METADATA IS EXPLICITLY BLOCKED.
   */
  async getUserRole(user: User | null): Promise<UserRole | null> {
    if (!user) return null;

    // 1. Authoritative check on app_metadata
    const appRole = user.app_metadata?.role;
    if (isValidRole(appRole)) {
      return appRole;
    }

    // 2. Query public.users database table
    try {
      const supabase = createServerSupabaseClient();
      if (supabase) {
        const query = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const roleRecord = query.data as { role?: string } | null;
        if (!query.error && roleRecord && isValidRole(roleRecord.role)) {
          return roleRecord.role;
        }
      }
    } catch {
      // Database query failed or unconfigured; proceed to fallback check
    }

    // 3. Fallback to safe user_metadata extraction (rejects self-assigned admin)
    return extractSafeRole(user);
  },

  /**
   * Asserts that a user is authenticated.
   * Redirects to /login if unauthenticated.
   */
  async requireAuthenticatedUser(): Promise<User> {
    const user = await authService.getCurrentUser();
    if (!user) {
      redirect('/login');
    }
    return user;
  },

  /**
   * Asserts that the authenticated user possesses one of the allowed roles.
   * Redirects to /login if unauthenticated, or to /unauthorized if role is unauthorized.
   */
  async requireRole(allowedRoles: UserRole | UserRole[]): Promise<AuthorizedSession> {
    const user = await this.requireAuthenticatedUser();
    const role = await this.getUserRole(user);

    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!role || !rolesArray.includes(role)) {
      redirect('/unauthorized');
    }

    return { user, role };
  },

  /**
   * Alias for requireRole accepting an array of roles.
   */
  async requireAnyRole(allowedRoles: UserRole[]): Promise<AuthorizedSession> {
    return this.requireRole(allowedRoles);
  },

  /**
   * Asserts that the authenticated user possesses the STUDENT role.
   */
  async requireStudent(): Promise<AuthorizedSession> {
    return this.requireRole([USER_ROLES.STUDENT]);
  },

  /**
   * Asserts that the authenticated user possesses the COMPANY role.
   */
  async requireCompany(): Promise<AuthorizedSession> {
    return this.requireRole([USER_ROLES.COMPANY]);
  },

  /**
   * Asserts that the authenticated user possesses the ADMIN role.
   */
  async requireAdmin(): Promise<AuthorizedSession> {
    return this.requireRole([USER_ROLES.ADMIN]);
  },
};
