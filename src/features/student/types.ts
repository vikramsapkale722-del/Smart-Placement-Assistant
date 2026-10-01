import type { Database } from '@/types/database.types';

export type StudentProfileRow = Database['public']['Tables']['student_profiles']['Row'];
export type StudentSkillRow = Database['public']['Tables']['student_skills']['Row'];
export type StudentProjectRow = Database['public']['Tables']['student_projects']['Row'];
export type StudentCertificationRow = Database['public']['Tables']['student_certifications']['Row'];
export type StudentAchievementRow = Database['public']['Tables']['student_achievements']['Row'];

export interface StudentSkillInput {
  name: string;
  category?: 'technical' | 'soft' | 'tool' | 'language' | 'other';
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface StudentProjectInput {
  title: string;
  description: string;
  technologies: string[];
  projectUrl?: string | null;
}

export interface StudentCertificationInput {
  name: string;
  issuingOrganization: string;
  issueDate?: string | null;
  credentialUrl?: string | null;
}

export interface StudentAchievementInput {
  title: string;
  description: string;
  date?: string | null;
}

export interface CompleteStudentProfile {
  // Personal Identity (synced with public.users)
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;

  // Academic Information (from student_profiles)
  profileId?: string;
  collegeName: string;
  degree: string;
  rollNumber: string;
  department: string;
  batchYear: number;
  cgpa: number;
  tenthPercentage?: number | null;
  twelfthPercentage?: number | null;
  activeBacklogs: number;
  totalBacklogsCleared: number;
  gender?: string | null;

  // Professional Links
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  isAcademicallyVerified: boolean;

  // Relational Collections
  skills: StudentSkillInput[];
  projects: StudentProjectInput[];
  certifications: StudentCertificationInput[];
  achievements: StudentAchievementInput[];
}
