'use server';

import { revalidatePath } from 'next/cache';
import { rbacService } from '@/services/rbac.service';
import { companyService } from '@/services/company.service';
import type { CompanyProfile } from '@/features/company/types';
import type { VerificationFilter, VerificationActionResult } from '@/features/admin/types';

/**
 * Server Action: Retrieves all companies for administrative verification.
 * Enforces authoritative admin-only RBAC check.
 */
export async function getAdminCompaniesAction(
  filter: VerificationFilter = 'all'
): Promise<{ success: boolean; data?: CompanyProfile[]; error?: string }> {
  try {
    await rbacService.requireAdmin();
    const companies = await companyService.listAllCompanies(filter);
    return { success: true, data: companies };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve companies list';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Approves and verifies a company profile.
 * Enforces authoritative admin-only RBAC check.
 */
export async function verifyCompanyAction(
  companyId: string
): Promise<VerificationActionResult> {
  try {
    const { user } = await rbacService.requireAdmin();
    const result = await companyService.verifyCompany(companyId, user.id);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to verify company' };
    }

    revalidatePath('/admin/companies');
    revalidatePath('/company/profile');
    revalidatePath('/company');

    return { success: true, data: result.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error occurred during verification';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Revokes or suspends verification for a company.
 * Enforces authoritative admin-only RBAC check.
 */
export async function revokeCompanyVerificationAction(
  companyId: string
): Promise<VerificationActionResult> {
  try {
    await rbacService.requireAdmin();
    const result = await companyService.revokeVerification(companyId);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to revoke company verification' };
    }

    revalidatePath('/admin/companies');
    revalidatePath('/company/profile');
    revalidatePath('/company');

    return { success: true, data: result.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error occurred while revoking verification';
    return { success: false, error: msg };
  }
}
