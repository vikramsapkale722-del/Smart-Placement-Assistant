import { notFound } from 'next/navigation';
import { rbacService } from '@/services/rbac.service';
import { studentService } from '@/services/student.service';
import { jobService } from '@/services/job.service';
import { applicationService } from '@/services/application.service';
import { JobDetailView } from '@/features/jobs/components/JobDetailView';

interface StudentJobDetailPageProps {
  params: {
    jobId: string;
  };
}

export async function generateMetadata({ params }: StudentJobDetailPageProps) {
  const job = await jobService.getPublishedJobById(params.jobId);
  if (!job) {
    return {
      title: 'Job Not Found | Smart Placement Portal',
    };
  }

  return {
    title: `${job.title} | ${job.companyName || 'Campus Placement'}`,
    description: `Placement drive specifications, requirements, and eligibility for ${job.title}.`,
  };
}

export default async function StudentJobDetailPage({ params }: StudentJobDetailPageProps) {
  // 1. Authoritative Server-Side RBAC Guard (Student Role Only)
  const { user } = await rbacService.requireStudent();

  // 2. Fetch Student Profile for Personalized Academic Eligibility Assessment
  const profile = await studentService.getProfile(user.id);

  // 3. Fetch Published Job Opening (Strictly prevents viewing draft/closed/archived jobs)
  const job = await jobService.getPublishedJobById(params.jobId);

  if (!job) {
    notFound();
  }

  // 4. Fetch Existing Application record if student already applied
  const existingApplication = await applicationService.getExistingApplication(user.id, job.id);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10">
      <JobDetailView
        job={job}
        studentProfile={profile}
        initialApplication={existingApplication}
      />
    </main>
  );
}
