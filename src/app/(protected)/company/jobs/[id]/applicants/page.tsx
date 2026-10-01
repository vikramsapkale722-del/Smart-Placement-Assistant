import { redirect } from 'next/navigation';
import { rbacService } from '@/services/rbac.service';
import { applicationService } from '@/services/application.service';
import { RecruiterApplicantBoard } from '@/features/applications/components/RecruiterApplicantBoard';

interface CompanyJobApplicantsPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: CompanyJobApplicantsPageProps) {
  return {
    title: `Applicant Management | Company Portal`,
    description: `Review and manage applicant roster for placement drive ${params.id}.`,
  };
}

export default async function CompanyJobApplicantsPage({
  params,
}: CompanyJobApplicantsPageProps) {
  // 1. Authoritative server-side RBAC guard: enforces authenticated company role
  const { user } = await rbacService.requireCompany();

  // 2. Resolve job and applicants scoped strictly to authenticated recruiter's organization
  const result = await applicationService.getCompanyJobApplicants(user.id, params.id);

  if (!result.success || !result.data) {
    // If unauthorized or job belongs to another company, redirect safely to company jobs roster
    redirect('/company/jobs');
  }

  const { job, applicants } = result.data;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <RecruiterApplicantBoard job={job} initialApplicants={applicants} />
    </main>
  );
}
