import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  USER_ROLES,
  isValidRole,
  extractSafeRole,
  isRouteAllowedForRole,
  ROLE_HOME_ROUTES,
} from '@/lib/auth/roles';
import { rbacService } from '@/services/rbac.service';
import type { User } from '@supabase/supabase-js';

describe('Role-Based Access Control (RBAC) System (TASK-004)', () => {
  describe('Role Model & Type Definitions', () => {
    it('defines exactly the three primary roles: student, company, admin', () => {
      expect(USER_ROLES).toEqual({
        STUDENT: 'student',
        COMPANY: 'company',
        ADMIN: 'admin',
      });
      expect(Object.keys(USER_ROLES)).toHaveLength(3);
    });

    it('isValidRole validates supported roles correctly', () => {
      expect(isValidRole('student')).toBe(true);
      expect(isValidRole('company')).toBe(true);
      expect(isValidRole('admin')).toBe(true);

      // Rejects case sensitivity or arbitrary strings
      expect(isValidRole('STUDENT')).toBe(false);
      expect(isValidRole('Student')).toBe(false);
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('guest')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
      expect(isValidRole(123)).toBe(false);
    });

    it('maps all roles to their designated home routes', () => {
      expect(ROLE_HOME_ROUTES.student).toBe('/student');
      expect(ROLE_HOME_ROUTES.company).toBe('/company');
      expect(ROLE_HOME_ROUTES.admin).toBe('/admin');
    });
  });

  describe('extractSafeRole & Security Boundaries', () => {
    it('returns app_metadata.role for verified administrator', () => {
      const adminUser = {
        id: 'admin-1',
        app_metadata: { role: 'admin' },
        user_metadata: {},
      } as unknown as User;

      expect(extractSafeRole(adminUser)).toBe(USER_ROLES.ADMIN);
    });

    it('returns app_metadata.role for verified student or company', () => {
      const studentUser = {
        id: 'stu-1',
        app_metadata: { role: 'student' },
      } as unknown as User;
      const compUser = {
        id: 'comp-1',
        app_metadata: { role: 'company' },
      } as unknown as User;

      expect(extractSafeRole(studentUser)).toBe(USER_ROLES.STUDENT);
      expect(extractSafeRole(compUser)).toBe(USER_ROLES.COMPANY);
    });

    it('allows student and company roles from user_metadata during registration', () => {
      const studentCandidate = {
        id: 'cand-1',
        app_metadata: {},
        user_metadata: { role: 'student' },
      } as unknown as User;

      const recruiter = {
        id: 'rec-1',
        app_metadata: {},
        user_metadata: { role: 'company' },
      } as unknown as User;

      expect(extractSafeRole(studentCandidate)).toBe(USER_ROLES.STUDENT);
      expect(extractSafeRole(recruiter)).toBe(USER_ROLES.COMPANY);
    });

    it('CRITICAL SECURITY: EXPLICITLY REJECTS self-promoted admin in user_metadata', () => {
      // Attacker attempts client-side tampering by placing { role: 'admin' } in user_metadata
      const maliciousUser = {
        id: 'attacker-1',
        app_metadata: {},
        user_metadata: { role: 'admin' },
      } as unknown as User;

      // Must return null, denying access to admin privileges
      expect(extractSafeRole(maliciousUser)).toBeNull();
    });

    it('returns null for null, undefined, or missing user', () => {
      expect(extractSafeRole(null)).toBeNull();
    });

    it('returns null for unrecognized role in metadata', () => {
      const unknownRoleUser = {
        id: 'unknown-1',
        app_metadata: {},
        user_metadata: { role: 'dean_of_placement' },
      } as unknown as User;

      expect(extractSafeRole(unknownRoleUser)).toBeNull();
    });
  });

  describe('isRouteAllowedForRole Policy Enforcement', () => {
    it('allows public routes regardless of role', () => {
      expect(isRouteAllowedForRole('/', null)).toBe(true);
      expect(isRouteAllowedForRole('/login', null)).toBe(true);
      expect(isRouteAllowedForRole('/register', null)).toBe(true);
      expect(isRouteAllowedForRole('/unauthorized', null)).toBe(true);
      expect(isRouteAllowedForRole('/', USER_ROLES.STUDENT)).toBe(true);
    });

    it('blocks unauthenticated access to protected areas', () => {
      expect(isRouteAllowedForRole('/student', null)).toBe(false);
      expect(isRouteAllowedForRole('/student/applications', null)).toBe(false);
      expect(isRouteAllowedForRole('/company', null)).toBe(false);
      expect(isRouteAllowedForRole('/company/jobs', null)).toBe(false);
      expect(isRouteAllowedForRole('/admin', null)).toBe(false);
      expect(isRouteAllowedForRole('/admin/users', null)).toBe(false);
    });

    it('enforces student route boundaries', () => {
      // Student -> Student route (allowed)
      expect(isRouteAllowedForRole('/student', USER_ROLES.STUDENT)).toBe(true);
      expect(isRouteAllowedForRole('/student/profile', USER_ROLES.STUDENT)).toBe(true);

      // Student -> Company or Admin route (denied)
      expect(isRouteAllowedForRole('/company', USER_ROLES.STUDENT)).toBe(false);
      expect(isRouteAllowedForRole('/company/jobs', USER_ROLES.STUDENT)).toBe(false);
      expect(isRouteAllowedForRole('/admin', USER_ROLES.STUDENT)).toBe(false);
      expect(isRouteAllowedForRole('/admin/audit', USER_ROLES.STUDENT)).toBe(false);
    });

    it('enforces company route boundaries', () => {
      // Company -> Company route (allowed)
      expect(isRouteAllowedForRole('/company', USER_ROLES.COMPANY)).toBe(true);
      expect(isRouteAllowedForRole('/company/drives', USER_ROLES.COMPANY)).toBe(true);

      // Company -> Student or Admin route (denied)
      expect(isRouteAllowedForRole('/student', USER_ROLES.COMPANY)).toBe(false);
      expect(isRouteAllowedForRole('/admin', USER_ROLES.COMPANY)).toBe(false);
    });

    it('enforces admin route boundaries', () => {
      // Admin -> Admin route (allowed)
      expect(isRouteAllowedForRole('/admin', USER_ROLES.ADMIN)).toBe(true);
      expect(isRouteAllowedForRole('/admin/settings', USER_ROLES.ADMIN)).toBe(true);

      // Admin -> Student or Company route (denied to maintain strict role separation)
      expect(isRouteAllowedForRole('/student', USER_ROLES.ADMIN)).toBe(false);
      expect(isRouteAllowedForRole('/company', USER_ROLES.ADMIN)).toBe(false);
    });
  });

  describe('rbacService Server-Side Methods', () => {
    it('getUserRole returns null when user is null', async () => {
      const role = await rbacService.getUserRole(null);
      expect(role).toBeNull();
    });

    it('getUserRole returns verified role from app_metadata', async () => {
      const adminUser = {
        id: 'admin-uuid',
        app_metadata: { role: 'admin' },
        user_metadata: {},
      } as unknown as User;

      const role = await rbacService.getUserRole(adminUser);
      expect(role).toBe(USER_ROLES.ADMIN);
    });

    it('getUserRole blocks self-promoted admin claim in user_metadata', async () => {
      const rogueUser = {
        id: 'rogue-uuid',
        app_metadata: {},
        user_metadata: { role: 'admin' },
      } as unknown as User;

      const role = await rbacService.getUserRole(rogueUser);
      expect(role).toBeNull();
    });
  });
});
