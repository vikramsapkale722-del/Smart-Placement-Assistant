'use server';

import { revalidatePath } from 'next/cache';
import { rbacService } from '@/services/rbac.service';
import { companyService } from '@/services/company.service';
import type { CompanyProfile } from '@/features/company/types';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Fetches the authenticated recruiter's company profile.
 * Enforces company role authorization.
 */
export async function getCompanyProfileAction(): Promise<ActionResponse<CompanyProfile | null>> {
  try {
    const { user } = await rbacService.requireCompany();
    const profile = await companyService.getProfile(user.id);
    return { success: true, data: profile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve company profile';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Creates or updates the authenticated company's profile.
 * Enforces company role authorization and server-verified user ID.
 */
export async function saveCompanyProfileAction(
  rawInput: unknown
): Promise<ActionResponse<CompanyProfile>> {
  try {
    // 1. Authoritative Server-Side Role and Session Assertion
    const { user } = await rbacService.requireCompany();

    // 2. Perform authoritative upsert via Company Service
    const result = await companyService.upsertProfile(user.id, rawInput);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Could not update company profile' };
    }

    revalidatePath('/company/profile');
    revalidatePath('/company');

    return { success: true, data: result.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error occurred during company profile update';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Uploads and updates the company's logo.
 */
export async function uploadCompanyLogoAction(
  formData: FormData
): Promise<ActionResponse<string>> {
  try {
    const { user } = await rbacService.requireCompany();
    const file = formData.get('logo') as File | null;

    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No logo file provided' };
    }

    const buffer = await file.arrayBuffer();
    const result = await companyService.uploadLogo(user.id, {
      name: file.name,
      size: file.size,
      type: file.type,
      buffer,
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to upload company logo' };
    }

    revalidatePath('/company/profile');
    return { success: true, data: result.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Company logo upload error';
    return { success: false, error: msg };
  }
}
