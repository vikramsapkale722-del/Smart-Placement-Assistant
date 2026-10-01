import { rbacService } from '@/services/rbac.service';
import { companyService } from '@/services/company.service';
import { CompanyVerificationTable } from '@/features/admin/components/CompanyVerificationTable';

export const metadata = {
  title: 'Company Verification Queue | Smart Placement Portal Admin',
  description: 'Review and verify corporate recruiter accounts for campus placement authorization.',
};

export default async function AdminCompaniesPage() {
  // Authoritative server-side RBAC enforcement (Admin Only)
  await rbacService.requireAdmin();

  // Load all registered companies from authoritative service
  const companies = await companyService.listAllCompanies('all');

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10">
      <CompanyVerificationTable initialCompanies={companies} />
    </main>
  );
}
