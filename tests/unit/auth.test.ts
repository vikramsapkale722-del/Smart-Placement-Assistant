import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginSchema, registerSchema } from '@/features/auth/schemas';
import { authService } from '@/services/auth.service';

describe('Authentication Validation & Service Tests (TASK-003)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loginSchema validation', () => {
    it('accepts valid email and password (>= 6 chars)', () => {
      const result = loginSchema.safeParse({
        email: 'student@college.edu',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty email and password', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === 'Email is required')).toBe(true);
        expect(result.error.issues.some((i) => i.message === 'Password is required')).toBe(true);
      }
    });

    it('rejects malformed email address', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('rejects passwords shorter than 6 characters', () => {
      const result = loginSchema.safeParse({
        email: 'student@college.edu',
        password: '12345',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });
  });

  describe('registerSchema validation', () => {
    it('accepts valid student registration input with matching password', () => {
      const result = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@college.edu',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
        role: 'student',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid company recruiter registration input', () => {
      const result = registerSchema.safeParse({
        fullName: 'John Recruiter',
        email: 'recruiter@enterprise.com',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
        role: 'company',
      });
      expect(result.success).toBe(true);
    });

    it('rejects password mismatch between password and confirmPassword', () => {
      const result = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@college.edu',
        password: 'securePassword123',
        confirmPassword: 'differentPassword999',
        role: 'student',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchIssue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(mismatchIssue).toBeDefined();
        expect(mismatchIssue?.message).toBe('Passwords do not match');
      }
    });

    it('rejects missing confirmPassword field', () => {
      const result = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@college.edu',
        password: 'securePassword123',
        confirmPassword: '',
        role: 'student',
      });
      expect(result.success).toBe(false);
    });

    it('rejects registration with invalid role', () => {
      const result = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@college.edu',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
        role: 'superuser',
      });
      expect(result.success).toBe(false);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'jane@college.edu',
        password: 'short7',
        confirmPassword: 'short7',
        role: 'student',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('rejects empty fullName', () => {
      const result = registerSchema.safeParse({
        fullName: '',
        email: 'jane@college.edu',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
        role: 'student',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('authService behavior & security isolation', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    });

    it('requireAuth throws unauthorized error if unauthenticated', async () => {
      await expect(authService.requireAuth()).rejects.toThrow(
        /UNAUTHORIZED: Authentication required to access this resource/
      );
    });

    it('signIn returns graceful error if Supabase credentials are missing', async () => {
      const result = await authService.signIn({
        email: 'student@college.edu',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication service is not configured');
    });

    it('signUp returns graceful error if Supabase credentials are missing', async () => {
      const result = await authService.signUp({
        fullName: 'Test User',
        email: 'test@college.edu',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'student',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication service is not configured');
    });

    it('signOut handles missing client safely without throwing', async () => {
      const result = await authService.signOut();
      expect(result.success).toBe(true);
    });
  });
});
