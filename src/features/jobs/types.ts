import type { Database } from '@/types/database.types';

export type JobRow = Database['public']['Tables']['jobs']['Row'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export type JobStatus = 'draft' | 'published' | 'closed' | 'archived';
export type JobEmploymentType = 'full_time' | 'internship' | 'internship_to_full_time';
export type JobWorkplaceType = 'on_site' | 'remote' | 'hybrid';

export interface JobPosting {
  id: string;
  companyId: string;
  createdBy?: string | null;
  title: string;
  description: string;
  employmentType: JobEmploymentType;
  department?: string | null;
  location: string;
  workplaceType: JobWorkplaceType;
  ctcMin?: number | null;
  ctcMax?: number | null;
  ctcDisplayText?: string | null;
  stipendMonthly?: number | null;
  isSalaryDisclosed?: boolean;
  degree?: string;
  minCgpa: number;
  allowedDepartments: string[];
  maxActiveBacklogs: number;
  eligibleBatchYears: number[];
  requiredSkills?: string[];
  numberOfOpenings?: number | null;
  selectionProcess?: string | null;
  applicationDeadline: string;
  publishedAt?: string | null;
  status: JobStatus;
  isApprovedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  companyWebsite?: string | null;
  companyDescription?: string | null;
}

export interface CreateJobInput {
  title: string;
  description: string;
  employmentType: JobEmploymentType;
  department?: string | null;
  location: string;
  workplaceType: JobWorkplaceType;
  ctcMin?: number | null;
  ctcMax?: number | null;
  ctcDisplayText?: string | null;
  stipendMonthly?: number | null;
  isSalaryDisclosed?: boolean;
  degree?: string;
  minCgpa: number;
  allowedDepartments: string[];
  maxActiveBacklogs: number;
  eligibleBatchYears: number[];
  requiredSkills?: string[];
  numberOfOpenings?: number | null;
  selectionProcess?: string | null;
  applicationDeadline: string;
  status?: JobStatus;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  status?: JobStatus;
}

export interface CompanyJobCounts {
  totalJobs: number;
  activeJobs: number; // published and not expired
  draftJobs: number;
  closedJobs: number;
}

export type StudentJobSortOption = 'newest' | 'deadline' | 'title' | 'ctc_desc';

export interface StudentJobFilters {
  search?: string;
  employmentType?: JobEmploymentType | 'all';
  workplaceType?: JobWorkplaceType | 'all';
  department?: string | 'all';
  minCgpa?: number;
  batchYear?: number;
  onlyEligible?: boolean;
  sortBy?: StudentJobSortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedJobsResult {
  jobs: JobPosting[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
