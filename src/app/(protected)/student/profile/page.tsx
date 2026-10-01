import Link from 'next/link';
import { rbacService } from '@/services/rbac.service';
import { studentService } from '@/services/student.service';
import { StudentProfileForm } from '@/features/student/components/StudentProfileForm';
import { Button } from '@/components/ui/Button';
import type { CompleteStudentProfile } from '@/features/student/types';

export const metadata = {
  title: 'Student Profile | Smart Placement Portal',
  description: 'Manage personal, academic, and portfolio records for placement eligibility.',
};

export default async function StudentProfilePage() {
  // 1. Authoritative Server-Side RBAC Enforcement (Student Only)
  const { user } = await rbacService.requireStudent();

  // 2. Load Existing Profile from Data Layer
  let profile = await studentService.getProfile(user.id);

  if (!profile) {
    profile = {
      userId: user.id,
      fullName: user.user_metadata?.full_name || '',
      email: user.email || '',
      phone: null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      collegeName: 'Engineering & Technology College',
      degree: 'B.Tech',
      rollNumber: '',
      department: '',
      batchYear: new Date().getFullYear(),
      cgpa: 0,
      tenthPercentage: null,
      twelfthPercentage: null,
      activeBacklogs: 0,
      totalBacklogsCleared: 0,
      gender: null,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
      isAcademicallyVerified: false,
      skills: [],
      projects: [],
      certifications: [],
      achievements: [],
    };
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Return */}
        <div className="flex items-center justify-between">
          <Link href="/student">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-text-muted">
              ← Back to Student Area
            </Button>
          </Link>
          <span className="text-xs font-mono text-text-muted">
            STUDENT PROFILE FOUNDATION (TASK-005)
          </span>
        </div>

        {/* Page Heading */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Student Profile
          </h1>
          <p className="text-sm text-text-secondary">
            Manage your personal credentials, degree progress, verified skills, and project portfolio.
          </p>
        </div>

        {/* Interactive Profile Editor */}
        <StudentProfileForm initialProfile={profile as CompleteStudentProfile} />
      </div>
    </main>
  );
}
