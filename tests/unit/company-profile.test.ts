import { describe, it, expect } from 'vitest';
import {
  companyProfileSchema,
  validateCompanyLogo,
  MAX_LOGO_SIZE_BYTES,
} from '@/features/company/schemas';
import { companyService } from '@/services/company.service';

describe('Company Profile Validation & Service Tests (TASK-007)', () => {
  const validCompanyData = {
    name: 'Acme Cloud Technologies',
    industry: 'Information Technology & Cloud Solutions',
    description: 'Leading provider of enterprise cloud orchestration systems.',
    website: 'https://acme-cloud.example.com',
    companyEmail: 'campus-recruiting@acme-cloud.example.com',
    companyPhone: '+1 555 123 4567',
    location: 'Bengaluru, India',
    companySize: '51-200 employees',
    foundedYear: 2018,
    linkedinUrl: 'https://linkedin.com/company/acme-cloud',
    companyType: 'Product',
    logoUrl: 'https://acme-cloud.example.com/assets/logo.png',
  };

  describe('companyProfileSchema Validation', () => {
    it('accepts complete, valid company profile data', () => {
      const result = companyProfileSchema.safeParse(validCompanyData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Acme Cloud Technologies');
        expect(result.data.foundedYear).toBe(2018);
      }
    });

    it('accepts minimal required profile data with optional fields omitted or null', () => {
      const minimalData = {
        name: 'Globex Corp',
        industry: 'Consulting Services',
      };
      const result = companyProfileSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('rejects company name shorter than 2 characters or blank', () => {
      const result = companyProfileSchema.safeParse({
        ...validCompanyData,
        name: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/at least 2 characters/i);
      }
    });

    it('rejects company name exceeding 120 characters', () => {
      const result = companyProfileSchema.safeParse({
        ...validCompanyData,
        name: 'A'.repeat(125),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/cannot exceed 120 characters/i);
      }
    });

    it('rejects missing or blank industry', () => {
      const result = companyProfileSchema.safeParse({
        ...validCompanyData,
        industry: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/industry is required/i);
      }
    });

    it('rejects description exceeding 2000 characters', () => {
      const result = companyProfileSchema.safeParse({
        ...validCompanyData,
        description: 'X'.repeat(2005),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/cannot exceed 2000 characters/i);
      }
    });

    it('rejects invalid website URLs not adhering to HTTP or HTTPS', () => {
      const invalidUrls = ['not-a-url', 'ftp://acme.org', 'javascript:alert(1)'];
      for (const url of invalidUrls) {
        const result = companyProfileSchema.safeParse({
          ...validCompanyData,
          website: url,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = ['invalid-email', 'recruiting@', '@domain.com'];
      for (const email of invalidEmails) {
        const result = companyProfileSchema.safeParse({
          ...validCompanyData,
          companyEmail: email,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects invalid phone numbers', () => {
      const invalidPhones = ['123', 'abc-def-ghij', '12345678901234567890'];
      for (const phone of invalidPhones) {
        const result = companyProfileSchema.safeParse({
          ...validCompanyData,
          companyPhone: phone,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects founded year outside realistic boundary (1800 - 2100)', () => {
      const pastResult = companyProfileSchema.safeParse({
        ...validCompanyData,
        foundedYear: 1750,
      });
      expect(pastResult.success).toBe(false);

      const futureResult = companyProfileSchema.safeParse({
        ...validCompanyData,
        foundedYear: 2150,
      });
      expect(futureResult.success).toBe(false);
    });

    it('rejects invalid LinkedIn URLs', () => {
      const result = companyProfileSchema.safeParse({
        ...validCompanyData,
        linkedinUrl: 'not_a_valid_url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateCompanyLogo', () => {
    it('accepts JPEG, PNG, and WebP images within 2 MB', () => {
      const validPng = validateCompanyLogo({ size: 1024 * 500, type: 'image/png' });
      expect(validPng.valid).toBe(true);

      const validJpeg = validateCompanyLogo({ size: 1024 * 1024, type: 'image/jpeg' });
      expect(validJpeg.valid).toBe(true);

      const validWebp = validateCompanyLogo({ size: 1024 * 800, type: 'image/webp' });
      expect(validWebp.valid).toBe(true);
    });

    it('rejects file sizes exceeding 2 MB', () => {
      const oversized = validateCompanyLogo({
        size: MAX_LOGO_SIZE_BYTES + 1024,
        type: 'image/png',
      });
      expect(oversized.valid).toBe(false);
      expect(oversized.error).toMatch(/exceeds 2 MB limit/i);
    });

    it('rejects unsupported MIME types such as PDF or GIF', () => {
      const pdf = validateCompanyLogo({ size: 1024 * 100, type: 'application/pdf' });
      expect(pdf.valid).toBe(false);
      expect(pdf.error).toMatch(/only jpeg, png, and webp/i);

      const gif = validateCompanyLogo({ size: 1024 * 100, type: 'image/gif' });
      expect(gif.valid).toBe(false);
    });
  });

  describe('companyService Integration & Operations', () => {
    const testUserId = 'test-recruiter-uuid-007';

    it('returns null when querying non-existent company profile', async () => {
      const profile = await companyService.getProfile('unregistered-user-999');
      expect(profile).toBeNull();
    });

    it('creates a new company profile and persists data across subsequent queries', async () => {
      const createRes = await companyService.upsertProfile(testUserId, validCompanyData);
      expect(createRes.success).toBe(true);
      expect(createRes.data).toBeDefined();
      expect(createRes.data?.name).toBe('Acme Cloud Technologies');
      expect(createRes.data?.industry).toBe('Information Technology & Cloud Solutions');

      // Subsequent query must retrieve the saved profile
      const retrieved = await companyService.getProfile(testUserId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Acme Cloud Technologies');
      expect(retrieved?.location).toBe('Bengaluru, India');
      expect(retrieved?.isVerified).toBe(false);
    });

    it('updates existing company profile without duplicate records', async () => {
      const updatedPayload = {
        ...validCompanyData,
        name: 'Acme Cloud Technologies Global',
        location: 'Hyderabad, India',
        companySize: '201-500 employees',
      };

      const updateRes = await companyService.upsertProfile(testUserId, updatedPayload);
      expect(updateRes.success).toBe(true);
      expect(updateRes.data?.name).toBe('Acme Cloud Technologies Global');
      expect(updateRes.data?.location).toBe('Hyderabad, India');
      expect(updateRes.data?.companySize).toBe('201-500 employees');

      const retrieved = await companyService.getProfile(testUserId);
      expect(retrieved?.name).toBe('Acme Cloud Technologies Global');
      expect(retrieved?.location).toBe('Hyderabad, India');
    });

    it('rejects invalid input at service boundary with descriptive error', async () => {
      const invalidPayload = {
        name: 'X', // too short
        industry: '', // missing
      };

      const failRes = await companyService.upsertProfile(testUserId, invalidPayload);
      expect(failRes.success).toBe(false);
      expect(failRes.error).toBeDefined();
    });

    it('guarantees tenant isolation: user A cannot access user B company data', async () => {
      const userAId = 'recruiter-tenant-a';
      const userBId = 'recruiter-tenant-b';

      await companyService.upsertProfile(userAId, {
        name: 'Company Alpha',
        industry: 'Fintech',
      });

      await companyService.upsertProfile(userBId, {
        name: 'Company Beta',
        industry: 'Healthcare',
      });

      const profileA = await companyService.getProfile(userAId);
      const profileB = await companyService.getProfile(userBId);

      expect(profileA?.name).toBe('Company Alpha');
      expect(profileB?.name).toBe('Company Beta');
      expect(profileA?.id).not.toBe(profileB?.id);
    });
  });
});
