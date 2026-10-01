import Link from 'next/link';
import { rbacService } from '@/services/rbac.service';
import { studentService } from '@/services/student.service';
import { jobService } from '@/services/job.service';
import { StudentJobListing } from '@/features/jobs/components/StudentJobListing';

export const metadata = {
  title: 'Job & Internship Discovery | Smart Placement Portal',
  description: 'Discover active corporate recruitment drives, internships, and placement opportunities.',
};

export default async function StudentJobsDiscoveryPage() {
  // 1. Authoritative Server-Side RBAC Guard (Student Role Only)
  const { user } = await rbacService.requireStudent();

  // 2. Fetch Verified Dynamic Profile for Current Authenticated Student
  const profile = await studentService.getProfile(user.id);

  // 3. Fetch Published Placement Drives (Excludes drafts, closed, archived, expired)
  const { jobs } = await jobService.getPublishedJobs();

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/student" className="hover:text-text-primary transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium">Placement Drives</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/80">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Placement Drives & Internships
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
              Explore active campus recruitment openings, review academic eligibility criteria, and evaluate compensation packages across enterprise hiring partners.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/student/profile"
              className="text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
            >
              Verify Academic Profile →
            </Link>
          </div>
        </div>

        {/* Discovery Listing Orchestrator */}
        <StudentJobListing initialJobs={jobs} studentProfile={profile} />
      </div>
    </main>
  );
}
