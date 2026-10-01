import { describe, it, expect } from 'vitest';
import { calculateCompanyProfileCompletion } from '@/features/company/utils/profile-completion';
import type { CompanyProfile } from '@/features/company/types';

describe('Company Dashboard Foundation & Profile Completion Tests (TASK-009)', () => {
  const baseCompanyProfile: CompanyProfile = {
    id: 'comp-uuid-1',
    name: 'Acme Cloud Technologies',
    industry: 'Software & Technology',
    description: null,
    website: null,
    logoUrl: null,
    companyEmail: null,
    companyPhone: null,
    location: null,
    companySize: null,
    foundedYear: null,
    linkedinUrl: null,
    companyType: 'Product',
    isVerified: false,
    verifiedAt: null,
  };

  describe('calculateCompanyProfileCompletion', () => {
    it('returns 0% and lists all sections incomplete for null or undefined company profile', () => {
      const resNull = calculateCompanyProfileCompletion(null);
      expect(resNull.percentage).toBe(0);
      expect(resNull.completedCount).toBe(0);
      expect(resNull.incompleteSections).toHaveLength(7);
      expect(resNull.isReadyForHiring).toBe(false);

      const resUndef = calculateCompanyProfileCompletion(undefined);
      expect(resUndef.percentage).toBe(0);
      expect(resUndef.isReadyForHiring).toBe(false);
    });

    it('calculates partial completion with company identity only (20%)', () => {
      const res = calculateCompanyProfileCompletion(baseCompanyProfile);
      expect(res.percentage).toBe(20);
      expect(res.completedCount).toBe(1);
      expect(res.isReadyForHiring).toBe(false);
    });

    it('requires a substantive description (>= 20 characters)', () => {
      const shortDescProfile: CompanyProfile = {
        ...baseCompanyProfile,
        description: 'Too short',
      };
      const resShort = calculateCompanyProfileCompletion(shortDescProfile);
      expect(resShort.percentage).toBe(20); // Description not counted

      const goodDescProfile: CompanyProfile = {
        ...baseCompanyProfile,
        description: 'Building next-generation distributed enterprise cloud infrastructure systems.',
      };
      const resGood = calculateCompanyProfileCompletion(goodDescProfile);
      expect(resGood.percentage).toBe(40); // Identity (20) + Description (20)
    });

    it('calculates score with recruiter contact and headquarters location', () => {
      const profileWithContactAndLocation: CompanyProfile = {
        ...baseCompanyProfile,
        description: 'Enterprise AI and placement workflow automation platform for universities.',
        companyEmail: 'recruiting@acmecloud.com',
        location: 'San Francisco, CA',
      };

      // Identity (20%) + Description (20%) + Contact (15%) + Location (15%) = 70%
      const res = calculateCompanyProfileCompletion(profileWithContactAndLocation);
      expect(res.percentage).toBe(70);
      expect(res.completedCount).toBe(4);
      expect(res.isReadyForHiring).toBe(true); // Has identity, contact, location, description and >= 60%
    });

    it('calculates 100% when all 7 profile sections are complete', () => {
      const fullProfile: CompanyProfile = {
        ...baseCompanyProfile,
        description: 'Enterprise AI and placement workflow automation platform for universities.',
        companyEmail: 'recruiting@acmecloud.com',
        companyPhone: '+1-555-0199',
        location: 'Bengaluru, India',
        logoUrl: 'https://cdn.example.com/acme-logo.png',
        website: 'https://acmecloud.example.com',
        companySize: '501-1000',
        foundedYear: 2018,
        linkedinUrl: 'https://linkedin.com/company/acme-cloud',
        isVerified: true,
      };

      const res = calculateCompanyProfileCompletion(fullProfile);
      expect(res.percentage).toBe(100);
      expect(res.completedCount).toBe(7);
      expect(res.incompleteSections).toHaveLength(0);
      expect(res.isReadyForHiring).toBe(true);
    });

    it('does not grant hiring readiness if core fields are missing even with high score', () => {
      const missingContact: CompanyProfile = {
        ...baseCompanyProfile,
        description: 'Enterprise AI and placement workflow automation platform for universities.',
        location: 'Bengaluru, India',
        logoUrl: 'https://cdn.example.com/logo.png',
        website: 'https://example.com',
        companySize: '50-100',
        // missing contact email / phone
      };

      const res = calculateCompanyProfileCompletion(missingContact);
      expect(res.isReadyForHiring).toBe(false);
    });
  });
});
