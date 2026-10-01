import type { CompanyProfile } from '@/features/company/types';

export type VerificationFilter = 'all' | 'pending' | 'verified';

export interface AdminCompanyItem extends CompanyProfile {
  id: string;
}

export interface VerificationActionResult {
  success: boolean;
  data?: CompanyProfile;
  error?: string;
}
