import { rbacService } from '@/services/rbac.service';
import { companyService } from '@/services/company.service';
import { CompanyProfileManager } from '@/features/company/components/CompanyProfileManager';

export const metadata = {
  title: 'Company Profile | Smart Placement Portal',
  description: 'Manage corporate hiring identity, brand logo, industry domain, and recruitment contacts.',
};

export default async function CompanyProfilePage() {
  // 1. Authoritative Server-Side RBAC Enforcement (Company/Recruiter Only)
  const { user } = await rbacService.requireCompany();

  // 2. Load Existing Profile from Company Service
  const profile = await companyService.getProfile(user.id);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10">
      <CompanyProfileManager
        initialProfile={profile}
        userEmail={user.email || ''}
      />
    </main>
  );
}
