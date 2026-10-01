import { USER_ROLES, type UserRole, isValidRole } from '@/types';

export { USER_ROLES, type UserRole, isValidRole };

/**
 * Standard authorized destination routes for each role.
 */
export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  [USER_ROLES.STUDENT]: '/student',
  [USER_ROLES.COMPANY]: '/company',
  [USER_ROLES.ADMIN]: '/admin',
};

/**
 * Route protection mapping.
 * Defines which role is authorized for each route prefix.
 */
export const ROUTE_PERMISSIONS: { prefix: string; allowedRoles: UserRole[] }[] = [
  { prefix: '/student', allowedRoles: [USER_ROLES.STUDENT] },
  { prefix: '/company', allowedRoles: [USER_ROLES.COMPANY] },
  { prefix: '/admin', allowedRoles: [USER_ROLES.ADMIN] },
];

/**
 * Safely extracts role information from a Supabase User object.
 *
 * CRITICAL SECURITY GUARANTEES:
 * 1. Checks app_metadata.role first (tamper-proof, set only by backend Admin API).
 * 2. Falls back to user_metadata.role ONLY if role is 'student' or 'company'.
 * 3. EXPLICITLY DROPS user_metadata.role if claimed as 'admin'.
 *    A client cannot self-promote to 'admin' via sign-up metadata or client profile updates.
 */
export function extractSafeRole(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
} | null): UserRole | null {
  if (!user) return null;

  // 1. Authoritative app_metadata (set by Supabase Admin API / triggers)
  const appRole = user.app_metadata?.role;
  if (isValidRole(appRole)) {
    return appRole;
  }

  // 2. Safe user_metadata check for unprivileged user sign-ups
  const userMetaRole = user.user_metadata?.role;
  if (userMetaRole === USER_ROLES.STUDENT || userMetaRole === USER_ROLES.COMPANY) {
    return userMetaRole;
  }

  // Reject unauthorized 'admin' or invalid claims in user_metadata
  return null;
}

/**
 * Evaluates whether a given pathname is permitted for a user's role.
 *
 * Returns true if:
 * - The pathname is public (not in ROUTE_PERMISSIONS)
 * - The pathname belongs to a protected area and the role matches the allowedRoles.
 */
export function isRouteAllowedForRole(pathname: string, role: UserRole | null): boolean {
  const matchedRule = ROUTE_PERMISSIONS.find((rule) =>
    pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );

  // If path is not in protected routes, access is allowed by default
  if (!matchedRule) {
    return true;
  }

  // If path is protected, user must have a valid role matching the allowedRoles
  if (!role) {
    return false;
  }

  return matchedRule.allowedRoles.includes(role);
}
