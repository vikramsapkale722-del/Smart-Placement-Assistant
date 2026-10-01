import { rbacService } from '@/services/rbac.service';
import { studentService } from '@/services/student.service';
import { calculateProfileCompletion } from '@/features/student/utils/profile-completion';
import { StudentDashboard } from '@/features/student/components/StudentDashboard';

export const metadata = {
  title: 'Student Dashboard | Smart Placement Portal',
  description: 'Central placement workspace for academic credentials, readiness, and recruitment drives.',
};

export default async function StudentPage() {
  // 1. Authoritative Server-Side RBAC Enforcement (Student Only)
  const { user } = await rbacService.requireStudent();

  // 2. Fetch Verified Dynamic Profile for Current Authenticated Student
  const profile = await studentService.getProfile(user.id);

  // 3. Compute Real-Time Profile Completion & Readiness Metrics
  const completion = calculateProfileCompletion(profile);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10">
      <StudentDashboard user={user} profile={profile} completion={completion} />
    </main>
  );
}
