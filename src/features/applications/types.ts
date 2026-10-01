import type { Database } from '@/types/database.types';

export type JobApplicationRow = Database['public']['Tables']['job_applications']['Row'];
export type JobApplicationInsert = Database['public']['Tables']['job_applications']['Insert'];
export type JobApplicationUpdate = Database['public']['Tables']['job_applications']['Update'];

export type ApplicationStatusHistoryRow =
  Database['public']['Tables']['application_status_history']['Row'];

export type ApplicationStatus =
  | 'applied'
  | 'withdrawn'
  | 'shortlisted'
  | 'in_review'
  | 'offered'
  | 'rejected';

export interface ApplicationStatusHistoryItem {
  id: string;
  applicationId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  studentId: string;
  resumeId?: string | null;
  status: ApplicationStatus;
  coverNote?: string | null;
  eligibilitySnapshot?: Record<string, unknown> | null;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  // Metadata optionally populated via joins
  jobTitle?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  companyWebsite?: string | null;
  location?: string;
  employmentType?: string;
  department?: string | null;
  workplaceType?: string;
  statusHistory?: ApplicationStatusHistoryItem[];
}

export interface SubmitApplicationInput {
  jobId: string;
  coverNote?: string | null;
}

export interface SubmitApplicationResponse {
  success: boolean;
  application?: JobApplication;
  error?: string;
}

export interface ApplicantCandidateProfile {
  studentId: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  collegeName: string;
  degree: string;
  rollNumber: string;
  department: string;
  batchYear: number;
  cgpa: number;
  activeBacklogs: number;
  skills: Array<{ name: string; category?: string; proficiency?: string }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    projectUrl?: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate?: string | null;
    credentialUrl?: string | null;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    date?: string | null;
  }>;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
}

export interface ApplicantDetailItem {
  id: string; // Application ID
  jobId: string;
  studentId: string;
  status: ApplicationStatus;
  coverNote?: string | null;
  appliedAt: string;
  updatedAt: string;
  candidate: ApplicantCandidateProfile;
  statusHistory: ApplicationStatusHistoryItem[];
}
