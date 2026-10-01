import { rbacService } from '@/services/rbac.service';
import { applicationService } from '@/services/application.service';
import { StudentApplicationsView } from '@/features/applications/components/StudentApplicationsView';

export const metadata = {
  title: 'My Applications | Smart Placement Portal',
  description: 'Track candidate status, interview rounds, and offers across applied placement drives.',
};

export default async function StudentApplicationsPage() {
  // 1. Authoritative Server-Side RBAC Guard (Student Role Only)
  const { user } = await rbacService.requireStudent();

  // 2. Fetch all applications submitted by the authenticated student
  const applications = await applicationService.getStudentApplications(user.id);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10">
      <StudentApplicationsView applications={applications} />
    </main>
  );
}
