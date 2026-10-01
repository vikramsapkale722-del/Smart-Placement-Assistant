import { rbacService } from '@/services/rbac.service';
import { companyService } from '@/services/company.service';
import { jobService } from '@/services/job.service';
import { CompanyDashboard } from '@/features/company/components/CompanyDashboard';
import { calculateCompanyProfileCompletion } from '@/features/company/utils/profile-completion';

export const metadata = {
  title: 'Company Dashboard | Smart Placement Portal',
  description: 'Enterprise recruiter dashboard and campus placement management.',
};

export default async function CompanyPage() {
  // 1. Authoritative server-side RBAC enforcement
  const { user } = await rbacService.requireCompany();

  // 2. Load associated company profile
  const companyProfile = await companyService.getProfile(user.id);

  // 3. Compute dynamic profile completeness & fetch real job counts
  const completion = calculateCompanyProfileCompletion(companyProfile);
  const jobCounts = companyProfile?.id
    ? await jobService.getCompanyJobCounts(companyProfile.id)
    : { totalJobs: 0, activeJobs: 0, draftJobs: 0, closedJobs: 0 };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <CompanyDashboard
        user={user}
        profile={companyProfile}
        completion={completion}
        jobCounts={jobCounts}
      />
    </main>
  );
}
