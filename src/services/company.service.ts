import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CompanyProfile } from '@/features/company/types';
import {
  companyProfileSchema,
  validateCompanyLogo,
} from '@/features/company/schemas';

// In-memory fallback cache for development/testing when Supabase backend is disconnected
const mockCompanyStore = new Map<string, CompanyProfile>();
const mockUserCompanyMap = new Map<string, string>(); // userId -> companyId

export interface CompanyServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CompanyRowRecord {
  id: string;
  name: string;
  industry: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  company_email: string | null;
  company_phone: string | null;
  location: string | null;
  company_size: string | null;
  founded_year: number | null;
  linkedin_url: string | null;
  company_type: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyUserRecord {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

/**
 * Company Profile Service
 * Authoritative data access layer for enterprise recruiter organization records.
 */
export const companyService = {
  /**
   * Retrieves the company profile associated with an authenticated recruiter's userId.
   * Returns null if no company profile has been created yet.
   */
  async getProfile(userId: string): Promise<CompanyProfile | null> {
    if (!userId) return null;

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      const companyId = mockUserCompanyMap.get(userId);
      if (companyId && mockCompanyStore.has(companyId)) {
        return mockCompanyStore.get(companyId) || null;
      }
      return null;
    }

    try {
      // 1. Query company association for the user
      const userAssocQuery = await (supabase as any)
        .from('company_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const userAssoc = userAssocQuery.data as CompanyUserRecord | null;

      if (userAssocQuery.error || !userAssoc) {
        // Fallback to memory map if in test/mock
        const fallbackId = mockUserCompanyMap.get(userId);
        if (fallbackId && mockCompanyStore.has(fallbackId)) {
          return mockCompanyStore.get(fallbackId) || null;
        }
        return null;
      }

      // 2. Query company record
      const companyQuery = await (supabase as any)
        .from('companies')
        .select('*')
        .eq('id', userAssoc.company_id)
        .maybeSingle();

      const companyData = companyQuery.data as CompanyRowRecord | null;

      if (companyQuery.error || !companyData) {
        return null;
      }

      return {
        id: companyData.id,
        name: companyData.name,
        industry: companyData.industry,
        description: companyData.description,
        website: companyData.website,
        logoUrl: companyData.logo_url,
        companyEmail: companyData.company_email,
        companyPhone: companyData.company_phone,
        location: companyData.location,
        companySize: companyData.company_size,
        foundedYear: companyData.founded_year,
        linkedinUrl: companyData.linkedin_url,
        companyType: companyData.company_type,
        isVerified: companyData.is_verified,
        verifiedAt: companyData.verified_at,
        createdAt: companyData.created_at,
        updatedAt: companyData.updated_at,
      };
    } catch {
      // Database query failed; check fallback cache
      const fallbackId = mockUserCompanyMap.get(userId);
      if (fallbackId && mockCompanyStore.has(fallbackId)) {
        return mockCompanyStore.get(fallbackId) || null;
      }
      return null;
    }
  },

  /**
   * Creates or updates the company profile for the authenticated recruiter.
   * Enforces server-side Zod validation.
   */
  async upsertProfile(
    userId: string,
    rawInput: unknown
  ): Promise<CompanyServiceResult<CompanyProfile>> {
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // 1. Server-Side Validation via Zod
    const parseResult = companyProfileSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid company profile data';
      return { success: false, error: firstError };
    }

    const validated = parseResult.data;
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      // Offline / Test mock fallback execution
      let companyId = mockUserCompanyMap.get(userId);
      if (!companyId) {
        companyId = `mock-company-${userId}-${Math.random().toString(36).substring(2, 9)}`;
        mockUserCompanyMap.set(userId, companyId);
      }

      const existing = mockCompanyStore.get(companyId);
      const updatedProfile: CompanyProfile = {
        id: companyId,
        name: validated.name,
        industry: validated.industry,
        description: validated.description || null,
        website: validated.website || null,
        logoUrl: validated.logoUrl || existing?.logoUrl || null,
        companyEmail: validated.companyEmail || null,
        companyPhone: validated.companyPhone || null,
        location: validated.location || null,
        companySize: validated.companySize || null,
        foundedYear: validated.foundedYear ?? null,
        linkedinUrl: validated.linkedinUrl || null,
        companyType: validated.companyType || 'Product',
        isVerified: existing?.isVerified ?? false,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCompanyStore.set(companyId, updatedProfile);
      return { success: true, data: updatedProfile };
    }

    try {
      // 2. Check if user already has an associated company
      const { data: existingAssoc } = await (supabase as any)
        .from('company_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let companyId: string;

      if (existingAssoc?.company_id) {
        companyId = existingAssoc.company_id;

        // Update existing company record
        const { error: updateError } = await (supabase as any)
          .from('companies')
          .update({
            name: validated.name,
            industry: validated.industry,
            description: validated.description || null,
            website: validated.website || null,
            logo_url: validated.logoUrl || null,
            company_email: validated.companyEmail || null,
            company_phone: validated.companyPhone || null,
            location: validated.location || null,
            company_size: validated.companySize || null,
            founded_year: validated.foundedYear ?? null,
            linkedin_url: validated.linkedinUrl || null,
            company_type: validated.companyType || 'Product',
          })
          .eq('id', companyId);

        if (updateError) {
          return { success: false, error: updateError.message };
        }
      } else {
        // Create new company record
        const { data: newCompany, error: insertError } = await (supabase as any)
          .from('companies')
          .insert({
            name: validated.name,
            industry: validated.industry,
            description: validated.description || null,
            website: validated.website || null,
            logo_url: validated.logoUrl || null,
            company_email: validated.companyEmail || null,
            company_phone: validated.companyPhone || null,
            location: validated.location || null,
            company_size: validated.companySize || null,
            founded_year: validated.foundedYear ?? null,
            linkedin_url: validated.linkedinUrl || null,
            company_type: validated.companyType || 'Product',
            is_verified: false,
          })
          .select()
          .single();

        if (insertError || !newCompany) {
          return { success: false, error: insertError?.message || 'Failed to create company' };
        }

        companyId = newCompany.id;

        // Create company_users mapping record
        const { error: assocError } = await (supabase as any)
          .from('company_users')
          .insert({
            company_id: companyId,
            user_id: userId,
            role: 'owner',
          });

        if (assocError) {
          return { success: false, error: assocError.message };
        }
      }

      // 3. Return full updated profile
      const finalProfile = await this.getProfile(userId);
      return { success: true, data: finalProfile || undefined };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database error during company update';
      return { success: false, error: message };
    }
  },

  /**
   * Uploads and links a company logo for the authenticated recruiter.
   */
  async uploadLogo(
    userId: string,
    file: { size: number; type: string; buffer: ArrayBuffer; name: string }
  ): Promise<CompanyServiceResult<string>> {
    const validation = validateCompanyLogo({ size: file.size, type: file.type });
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = createServerSupabaseClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filePath = `company-${userId}/logo-${Date.now()}.${ext}`;

    if (!supabase) {
      // Mock logo URL for dev/test environments
      const mockUrl = `/uploads/mock-company-logo-${userId}.${ext}`;
      const companyId = mockUserCompanyMap.get(userId);
      if (companyId) {
        const existing = mockCompanyStore.get(companyId);
        if (existing) {
          mockCompanyStore.set(companyId, { ...existing, logoUrl: mockUrl });
        }
      }
      return { success: true, data: mockUrl };
    }

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const logoUrl = publicUrlData.publicUrl;

      // Update company record if company exists
      const { data: assoc } = await (supabase as any)
        .from('company_users')
        .select('company_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (assoc?.company_id) {
        await (supabase as any)
          .from('companies')
          .update({ logo_url: logoUrl })
          .eq('id', assoc.company_id);
      }

      return { success: true, data: logoUrl };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logo upload failed';
      return { success: false, error: msg };
    }
  },

  /**
   * Retrieves all registered companies for administrative review.
   * Supports optional filtering by verification status ('all' | 'pending' | 'verified').
   */
  async listAllCompanies(
    filter: 'all' | 'pending' | 'verified' = 'all'
  ): Promise<CompanyProfile[]> {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      // Mock store fallback for offline/testing environments
      const allCompanies = Array.from(mockCompanyStore.values());
      if (filter === 'pending') {
        return allCompanies.filter((c) => !c.isVerified);
      }
      if (filter === 'verified') {
        return allCompanies.filter((c) => c.isVerified);
      }
      return allCompanies;
    }

    try {
      let query = (supabase as any)
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_verified', false);
      } else if (filter === 'verified') {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query;
      if (error || !data) {
        return Array.from(mockCompanyStore.values());
      }

      return (data as CompanyRowRecord[]).map((r) => ({
        id: r.id,
        name: r.name,
        industry: r.industry,
        description: r.description,
        website: r.website,
        logoUrl: r.logo_url,
        companyEmail: r.company_email,
        companyPhone: r.company_phone,
        location: r.location,
        companySize: r.company_size,
        foundedYear: r.founded_year,
        linkedinUrl: r.linkedin_url,
        companyType: r.company_type,
        isVerified: r.is_verified,
        verifiedAt: r.verified_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch {
      return Array.from(mockCompanyStore.values());
    }
  },

  /**
   * Authoritative administrative verification of a company profile.
   * Sets is_verified = true, verified_by = adminUserId, verified_at = now.
   */
  async verifyCompany(
    companyId: string,
    adminUserId: string
  ): Promise<CompanyServiceResult<CompanyProfile>> {
    if (!companyId || !adminUserId) {
      return { success: false, error: 'Company ID and Administrator ID are required' };
    }

    const verifiedAt = new Date().toISOString();
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      // Offline / testing fallback
      const existing = mockCompanyStore.get(companyId);
      if (!existing) {
        return { success: false, error: 'Company not found' };
      }

      const updated: CompanyProfile = {
        ...existing,
        isVerified: true,
        verifiedAt,
        updatedAt: verifiedAt,
      };
      mockCompanyStore.set(companyId, updated);
      return { success: true, data: updated };
    }

    try {
      const { data, error } = await (supabase as any)
        .from('companies')
        .update({
          is_verified: true,
          verified_by: adminUserId,
          verified_at: verifiedAt,
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to verify company' };
      }

      const updatedRecord = data as CompanyRowRecord;
      return {
        success: true,
        data: {
          id: updatedRecord.id,
          name: updatedRecord.name,
          industry: updatedRecord.industry,
          description: updatedRecord.description,
          website: updatedRecord.website,
          logoUrl: updatedRecord.logo_url,
          companyEmail: updatedRecord.company_email,
          companyPhone: updatedRecord.company_phone,
          location: updatedRecord.location,
          companySize: updatedRecord.company_size,
          foundedYear: updatedRecord.founded_year,
          linkedinUrl: updatedRecord.linkedin_url,
          companyType: updatedRecord.company_type,
          isVerified: updatedRecord.is_verified,
          verifiedAt: updatedRecord.verified_at,
          createdAt: updatedRecord.created_at,
          updatedAt: updatedRecord.updated_at,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error during company verification';
      return { success: false, error: msg };
    }
  },

  /**
   * Authoritative administrative revocation of company verification status.
   * Sets is_verified = false, verified_by = null, verified_at = null.
   */
  async revokeVerification(companyId: string): Promise<CompanyServiceResult<CompanyProfile>> {
    if (!companyId) {
      return { success: false, error: 'Company ID is required' };
    }

    const updatedAt = new Date().toISOString();
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      const existing = mockCompanyStore.get(companyId);
      if (!existing) {
        return { success: false, error: 'Company not found' };
      }

      const updated: CompanyProfile = {
        ...existing,
        isVerified: false,
        verifiedAt: null,
        updatedAt,
      };
      mockCompanyStore.set(companyId, updated);
      return { success: true, data: updated };
    }

    try {
      const { data, error } = await (supabase as any)
        .from('companies')
        .update({
          is_verified: false,
          verified_by: null,
          verified_at: null,
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to revoke company verification' };
      }

      const updatedRecord = data as CompanyRowRecord;
      return {
        success: true,
        data: {
          id: updatedRecord.id,
          name: updatedRecord.name,
          industry: updatedRecord.industry,
          description: updatedRecord.description,
          website: updatedRecord.website,
          logoUrl: updatedRecord.logo_url,
          companyEmail: updatedRecord.company_email,
          companyPhone: updatedRecord.company_phone,
          location: updatedRecord.location,
          companySize: updatedRecord.company_size,
          foundedYear: updatedRecord.founded_year,
          linkedinUrl: updatedRecord.linkedin_url,
          companyType: updatedRecord.company_type,
          isVerified: updatedRecord.is_verified,
          verifiedAt: updatedRecord.verified_at,
          createdAt: updatedRecord.created_at,
          updatedAt: updatedRecord.updated_at,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error during verification revocation';
      return { success: false, error: msg };
    }
  },
};
