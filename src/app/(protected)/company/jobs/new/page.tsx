import Link from 'next/link';
import { rbacService } from '@/services/rbac.service';
import { companyService } from '@/services/company.service';
import { JobCreationForm } from '@/features/jobs/components/JobCreationForm';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Post New Job / Drive | Company Portal',
  description: 'Create a new campus placement drive or internship opening.',
};

export default async function NewJobPage() {
  // 1. Authoritative server-side RBAC guard
  const { user } = await rbacService.requireCompany();

  // 2. Fetch associated company profile
  const profile = await companyService.getProfile(user.id);
  const companyName = profile?.name || 'Your Company';

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link href="/company" className="hover:text-text-primary transition-colors">
              Company Dashboard
            </Link>
            <span>/</span>
            <Link href="/company/jobs" className="hover:text-text-primary transition-colors">
              Jobs
            </Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Create New</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Post Campus Recruitment Drive
          </h1>
          <p className="text-xs text-text-secondary">
            Publish an active job opening or internship for {companyName} with automated academic eligibility screening.
          </p>
        </div>

        <Link href="/company/jobs">
          <Button variant="outline" size="sm">
            ← Cancel
          </Button>
        </Link>
      </div>

      {!profile?.name ? (
        <Card className="border-border p-6 text-center">
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">
              Company Profile Setup Required
            </p>
            <p className="text-xs text-text-secondary">
              Please establish your organization identity before posting jobs.
            </p>
            <Link href="/company/profile">
              <button className="px-4 py-2 bg-primary text-primary-foreground text-xs rounded-md">
                Set Up Company Profile →
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <JobCreationForm />
      )}
    </main>
  );
}
