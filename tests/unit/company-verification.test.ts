import { describe, it, expect, beforeEach } from 'vitest';
import { companyService } from '@/services/company.service';

describe('Company Verification & Administrative Workflow Tests (TASK-008)', () => {
  const adminId = 'superadmin-user-uuid-008';
  let companyAId: string;
  let companyBId: string;

  beforeEach(async () => {
    // Seed two test companies with distinct initial states
    const userA = 'recruiter-pending-001';
    const userB = 'recruiter-verified-002';

    const resA = await companyService.upsertProfile(userA, {
      name: 'Stark Industries',
      industry: 'Advanced Defense & Robotics',
      location: 'New York, USA',
    });
    if (resA.data?.id) companyAId = resA.data.id;

    const resB = await companyService.upsertProfile(userB, {
      name: 'Wayne Enterprises',
      industry: 'Applied Sciences & Tech',
      location: 'Gotham, USA',
    });
    if (resB.data?.id) companyBId = resB.data.id;
  });

  describe('Administrative Company Listing & Status Filtering', () => {
    it('retrieves all registered organizations with accurate baseline status', async () => {
      const companies = await companyService.listAllCompanies('all');
      expect(companies.length).toBeGreaterThanOrEqual(2);

      const stark = companies.find((c) => c.name === 'Stark Industries');
      expect(stark).toBeDefined();
      expect(stark?.isVerified).toBe(false);
    });

    it('filters companies by pending verification status', async () => {
      const pendingCompanies = await companyService.listAllCompanies('pending');
      expect(pendingCompanies.every((c) => c.isVerified === false)).toBe(true);
      expect(pendingCompanies.some((c) => c.name === 'Stark Industries')).toBe(true);
    });

    it('filters companies by verified active status', async () => {
      // First verify Company B
      await companyService.verifyCompany(companyBId, adminId);

      const verifiedCompanies = await companyService.listAllCompanies('verified');
      expect(verifiedCompanies.every((c) => c.isVerified === true)).toBe(true);
      expect(verifiedCompanies.some((c) => c.id === companyBId)).toBe(true);
    });
  });

  describe('Authoritative Administrative Verification (verifyCompany)', () => {
    it('successfully approves and verifies a company profile with audit timestamps', async () => {
      const verifyRes = await companyService.verifyCompany(companyAId, adminId);
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.data?.isVerified).toBe(true);
      expect(verifyRes.data?.verifiedAt).toBeDefined();

      // Ensure persistence
      const verifiedList = await companyService.listAllCompanies('verified');
      const verifiedStark = verifiedList.find((c) => c.id === companyAId);
      expect(verifiedStark).toBeDefined();
      expect(verifiedStark?.isVerified).toBe(true);
    });

    it('rejects verification if companyId or adminUserId is missing', async () => {
      const missingIdRes = await companyService.verifyCompany('', adminId);
      expect(missingIdRes.success).toBe(false);
      expect(missingIdRes.error).toMatch(/required/i);

      const missingAdminRes = await companyService.verifyCompany(companyAId, '');
      expect(missingAdminRes.success).toBe(false);
      expect(missingAdminRes.error).toMatch(/required/i);
    });

    it('returns error when verifying non-existent company', async () => {
      const notFoundRes = await companyService.verifyCompany('non-existent-company-999', adminId);
      expect(notFoundRes.success).toBe(false);
      expect(notFoundRes.error).toMatch(/not found/i);
    });
  });

  describe('Authoritative Administrative Revocation (revokeVerification)', () => {
    it('successfully revokes an active company verification status', async () => {
      // Setup verified state
      await companyService.verifyCompany(companyAId, adminId);

      // Revoke verification
      const revokeRes = await companyService.revokeVerification(companyAId);
      expect(revokeRes.success).toBe(true);
      expect(revokeRes.data?.isVerified).toBe(false);
      expect(revokeRes.data?.verifiedAt).toBeNull();

      // Check pending list
      const pendingList = await companyService.listAllCompanies('pending');
      const revokedCompany = pendingList.find((c) => c.id === companyAId);
      expect(revokedCompany).toBeDefined();
      expect(revokedCompany?.isVerified).toBe(false);
    });

    it('rejects revocation when companyId is blank or not found', async () => {
      const blankRes = await companyService.revokeVerification('');
      expect(blankRes.success).toBe(false);

      const notFoundRes = await companyService.revokeVerification('invalid-id-xyz');
      expect(notFoundRes.success).toBe(false);
      expect(notFoundRes.error).toMatch(/not found/i);
    });
  });
});
