import Link from 'next/link';
import { rbacService } from '@/services/rbac.service';
import { companyService } from '@/services/company.service';
import { jobService } from '@/services/job.service';
import { JobListTable } from '@/features/jobs/components/JobListTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'Job Openings & Placement Drives | Company Portal',
  description: 'Manage active, draft, and closed campus placement drives.',
};

export default async function CompanyJobsPage() {
  // 1. Authoritative server-side RBAC guard
  const { user } = await rbacService.requireCompany();

  // 2. Fetch associated company profile and jobs
  const [profile, jobs] = await Promise.all([
    companyService.getProfile(user.id),
    jobService.getJobsByCompany(user.id),
  ]);

  const companyName = profile?.name || 'Your Company';

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Breadcrumbs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link href="/company" className="hover:text-text-primary transition-colors">
              Company Dashboard
            </Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Job Openings</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Placement Drives & Jobs
            </h1>
            <Badge variant="default" className="text-xs">
              {jobs.length} Total
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Manage corporate recruitment drives, eligibility rules, and application deadlines for {companyName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/company">
            <Button variant="outline" size="sm">
              ← Dashboard
            </Button>
          </Link>
          <Link href="/company/jobs/new">
            <Button variant="primary" size="sm">
              + Post New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Jobs Table / Empty State */}
      <JobListTable jobs={jobs} companyName={companyName} />
    </main>
  );
}
