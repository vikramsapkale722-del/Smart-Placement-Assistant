import type { Database } from '@/types/database.types';

export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type CompanyUserRow = Database['public']['Tables']['company_users']['Row'];

export interface CompanyProfile {
  id?: string;
  name: string;
  industry: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  location?: string | null;
  companySize?: string | null;
  foundedYear?: number | null;
  linkedinUrl?: string | null;
  companyType?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyProfileInput {
  name: string;
  industry: string;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  location?: string | null;
  companySize?: string | null;
  foundedYear?: number | null;
  linkedinUrl?: string | null;
  companyType?: string | null;
}
