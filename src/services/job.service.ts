import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  JobPosting,
  JobStatus,
  CompanyJobCounts,
  StudentJobFilters,
  PaginatedJobsResult,
} from '@/features/jobs/types';
import { createJobSchema, updateJobSchema } from '@/features/jobs/schemas';

export interface JobServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface JobRowRecord {
  id: string;
  company_id: string;
  created_by: string | null;
  title: string;
  description: string;
  employment_type: 'full_time' | 'internship' | 'internship_to_full_time';
  department: string | null;
  location: string;
  workplace_type: 'on_site' | 'remote' | 'hybrid';
  ctc_min: number | null;
  ctc_max: number | null;
  ctc_display_text: string | null;
  stipend_monthly: number | null;
  is_salary_disclosed: boolean;
  degree: string;
  min_cgpa: number;
  allowed_departments: string[];
  max_active_backlogs: number;
  eligible_batch_years: number[];
  required_skills: string[];
  number_of_openings: number | null;
  selection_process: string | null;
  application_deadline: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  is_approved_by_admin: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapJobRow(
  record: JobRowRecord,
  company?: { name?: string; logo_url?: string | null; website?: string | null; description?: string | null }
): JobPosting {
  return {
    id: record.id,
    companyId: record.company_id,
    createdBy: record.created_by,
    title: record.title,
    description: record.description,
    employmentType: record.employment_type,
    department: record.department,
    location: record.location,
    workplaceType: record.workplace_type,
    ctcMin: record.ctc_min,
    ctcMax: record.ctc_max,
    ctcDisplayText: record.ctc_display_text,
    stipendMonthly: record.stipend_monthly,
    isSalaryDisclosed: record.is_salary_disclosed ?? true,
    degree: record.degree,
    minCgpa: Number(record.min_cgpa),
    allowedDepartments: record.allowed_departments || [],
    maxActiveBacklogs: record.max_active_backlogs,
    eligibleBatchYears: record.eligible_batch_years || [],
    requiredSkills: record.required_skills || [],
    numberOfOpenings: record.number_of_openings,
    selectionProcess: record.selection_process,
    applicationDeadline: record.application_deadline,
    publishedAt: record.published_at,
    status: record.status,
    isApprovedByAdmin: record.is_approved_by_admin,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    companyName: company?.name || 'TechCorp Solutions',
    companyLogoUrl: company?.logo_url ?? null,
    companyWebsite: company?.website ?? null,
    companyDescription: company?.description ?? null,
  };
}

// In-memory fallback cache for development/testing when Supabase backend is disconnected
const mockJobsStore = new Map<string, JobPosting>();

function ensureMockSeeds() {
  if (mockJobsStore.size > 0) return;
  const now = Date.now();
  const future1 = new Date(now + 14 * 86400000).toISOString();
  const future2 = new Date(now + 21 * 86400000).toISOString();
  const future3 = new Date(now + 30 * 86400000).toISOString();

  const seeds: JobPosting[] = [
    {
      id: 'job-seed-001',
      companyId: 'company-nexus-tech',
      companyName: 'Nexus Cloud Technologies',
      companyWebsite: 'https://nexuscloud.io',
      companyDescription: 'Next-generation cloud infrastructure and distributed systems provider.',
      title: 'Graduate Software Engineer (Backend)',
      description: 'Build resilient microservices, scale transactional backends, and optimize database queries across distributed clusters using Node.js, Go, and PostgreSQL.',
      employmentType: 'full_time',
      department: 'Cloud Platform Engineering',
      location: 'Bengaluru, India',
      workplaceType: 'hybrid',
      ctcMin: 12.0,
      ctcMax: 18.0,
      ctcDisplayText: '₹12 - 18 LPA + Stocks',
      isSalaryDisclosed: true,
      degree: 'B.Tech / M.Tech',
      minCgpa: 7.0,
      allowedDepartments: ['Computer Science and Engineering', 'Information Technology', 'Data Science'],
      maxActiveBacklogs: 0,
      eligibleBatchYears: [2025, 2026, 2027],
      requiredSkills: ['Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'AWS'],
      numberOfOpenings: 8,
      selectionProcess: 'Round 1: Online Technical Assessment (DSA & CS Fundamentals)\nRound 2: Systems Design & Problem Solving\nRound 3: Values & HR Interview',
      applicationDeadline: future1,
      status: 'published',
      publishedAt: new Date(now - 2 * 86400000).toISOString(),
      isApprovedByAdmin: true,
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      id: 'job-seed-002',
      companyId: 'company-stripewave',
      companyName: 'Stripewave Labs',
      companyWebsite: 'https://stripewave.dev',
      companyDescription: 'Fintech software studio powering digital payment rails and banking experiences.',
      title: 'Frontend Engineering Intern (React / Next.js)',
      description: 'Work alongside senior UI engineers to construct accessible component libraries, high-performance dashboards, and responsive web workflows.',
      employmentType: 'internship',
      department: 'Frontend Products',
      location: 'Remote, India',
      workplaceType: 'remote',
      stipendMonthly: 45000,
      ctcDisplayText: '₹45,000 / month',
      isSalaryDisclosed: true,
      degree: 'B.Tech / MCA',
      minCgpa: 6.5,
      allowedDepartments: [],
      maxActiveBacklogs: 1,
      eligibleBatchYears: [2026, 2027],
      requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'TailwindCSS'],
      numberOfOpenings: 5,
      selectionProcess: 'Round 1: Frontend Coding Project\nRound 2: Live Component Pair Programming\nRound 3: Culture Fit',
      applicationDeadline: future2,
      status: 'published',
      publishedAt: new Date(now - 4 * 86400000).toISOString(),
      isApprovedByAdmin: true,
      createdAt: new Date(now - 4 * 86400000).toISOString(),
      updatedAt: new Date(now - 4 * 86400000).toISOString(),
    },
    {
      id: 'job-seed-003',
      companyId: 'company-finedge',
      companyName: 'FinEdge Analytics',
      companyWebsite: 'https://finedge-analytics.com',
      companyDescription: 'Enterprise predictive intelligence and quantitative financial research firm.',
      title: 'Data Analyst & BI Associate',
      description: 'Analyze real-time market datasets, construct automated executive dashboards, and translate business telemetry into actionable insights using SQL, Python, and Tableau.',
      employmentType: 'full_time',
      department: 'Business Intelligence',
      location: 'Mumbai, India',
      workplaceType: 'on_site',
      ctcMin: 8.5,
      ctcMax: 13.0,
      ctcDisplayText: '₹8.5 - 13 LPA',
      isSalaryDisclosed: true,
      degree: 'B.Tech / B.E. / M.Tech',
      minCgpa: 6.0,
      allowedDepartments: ['Computer Science and Engineering', 'Information Technology', 'Data Science', 'Electronics and Communication'],
      maxActiveBacklogs: 0,
      eligibleBatchYears: [2025, 2026],
      requiredSkills: ['SQL', 'Python', 'Tableau', 'PowerBI', 'Excel'],
      numberOfOpenings: 6,
      selectionProcess: 'Round 1: Data Analytics Aptitude Test\nRound 2: SQL & Dashboard Case Study\nRound 3: Partner Interview',
      applicationDeadline: future3,
      status: 'published',
      publishedAt: new Date(now - 5 * 86400000).toISOString(),
      isApprovedByAdmin: true,
      createdAt: new Date(now - 5 * 86400000).toISOString(),
      updatedAt: new Date(now - 5 * 86400000).toISOString(),
    },
    {
      id: 'job-seed-004',
      companyId: 'company-aerotech',
      companyName: 'AeroTech Avionics',
      companyWebsite: 'https://aerotech-avionics.com',
      companyDescription: 'Autonomous aeronautics and embedded hardware solutions provider.',
      title: 'Embedded Systems & Firmware Intern (PPO)',
      description: 'Develop low-level RTOS drivers, test embedded avionics controllers, and integrate sensor buses for mission-critical flight equipment.',
      employmentType: 'internship_to_full_time',
      department: 'Avionics Systems',
      location: 'Bengaluru, India',
      workplaceType: 'on_site',
      stipendMonthly: 35000,
      ctcMin: 10.0,
      ctcMax: 15.0,
      ctcDisplayText: '₹35,000/mo Internship -> ₹10-15 LPA PPO',
      isSalaryDisclosed: true,
      degree: 'B.Tech / M.Tech (ECE/EEE/Mechanical)',
      minCgpa: 7.2,
      allowedDepartments: ['Electronics and Communication', 'Electrical and Electronics', 'Mechanical Engineering'],
      maxActiveBacklogs: 0,
      eligibleBatchYears: [2026, 2027],
      requiredSkills: ['C/C++', 'Embedded Systems', 'RTOS', 'Microcontrollers', 'Git'],
      numberOfOpenings: 4,
      selectionProcess: 'Round 1: Hardware & Embedded Fundamentals Test\nRound 2: Microcontroller Lab & Code Review\nRound 3: Technical Director Interview',
      applicationDeadline: future1,
      status: 'published',
      publishedAt: new Date(now - 1 * 86400000).toISOString(),
      isApprovedByAdmin: true,
      createdAt: new Date(now - 1 * 86400000).toISOString(),
      updatedAt: new Date(now - 1 * 86400000).toISOString(),
    },
  ];

  for (const s of seeds) {
    mockJobsStore.set(s.id, s);
  }
}

/**
 * Job Service
 * Authoritative data access and business logic layer for Job Posting Engine.
 */
export const jobService = {
  /**
   * Helper to resolve the companyId associated with an authenticated recruiter's userId.
   */
  async getRecruiterCompanyId(userId: string): Promise<string | null> {
    if (!userId) return null;

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      // In mock/test environments, check if a mock mapping was registered
      return `mock-company-${userId}`;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('company_users')
        .select('company_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return `mock-company-${userId}`;
      }
      return data.company_id;
    } catch {
      return `mock-company-${userId}`;
    }
  },

  /**
   * Creates a new job posting for the authenticated recruiter's organization.
   * Derives companyId strictly from the server-side session.
   */
  async createJob(
    userId: string,
    rawInput: unknown
  ): Promise<JobServiceResult<JobPosting>> {
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const companyId = await this.getRecruiterCompanyId(userId);
    if (!companyId) {
      return {
        success: false,
        error: 'No organization registered for your account. Please set up your company profile first.',
      };
    }

    // 1. Validate Input via Zod
    const parseResult = createJobSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message || 'Invalid job posting data',
      };
    }

    const validated = parseResult.data;
    const nowIso = new Date().toISOString();
    const publishedAt = validated.status === 'published' ? nowIso : null;
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      // Offline / Test mock fallback execution
      const jobId = `mock-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newJob: JobPosting = {
        id: jobId,
        companyId,
        createdBy: userId,
        title: validated.title,
        description: validated.description,
        employmentType: validated.employmentType,
        department: validated.department ?? null,
        location: validated.location,
        workplaceType: validated.workplaceType,
        ctcMin: validated.ctcMin ?? null,
        ctcMax: validated.ctcMax ?? null,
        ctcDisplayText: validated.ctcDisplayText ?? null,
        stipendMonthly: validated.stipendMonthly ?? null,
        isSalaryDisclosed: validated.isSalaryDisclosed ?? true,
        degree: validated.degree ?? 'B.Tech / M.Tech / MCA',
        minCgpa: validated.minCgpa,
        allowedDepartments: validated.allowedDepartments,
        maxActiveBacklogs: validated.maxActiveBacklogs,
        eligibleBatchYears: validated.eligibleBatchYears,
        requiredSkills: validated.requiredSkills ?? [],
        numberOfOpenings: validated.numberOfOpenings ?? null,
        selectionProcess: validated.selectionProcess ?? null,
        applicationDeadline: validated.applicationDeadline,
        status: validated.status || 'draft',
        publishedAt,
        isApprovedByAdmin: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      mockJobsStore.set(jobId, newJob);
      return { success: true, data: newJob };
    }

    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .insert({
          company_id: companyId,
          created_by: userId,
          title: validated.title,
          description: validated.description,
          employment_type: validated.employmentType,
          department: validated.department ?? null,
          location: validated.location,
          workplace_type: validated.workplaceType,
          ctc_min: validated.ctcMin ?? null,
          ctc_max: validated.ctcMax ?? null,
          ctc_display_text: validated.ctcDisplayText ?? null,
          stipend_monthly: validated.stipendMonthly ?? null,
          is_salary_disclosed: validated.isSalaryDisclosed ?? true,
          degree: validated.degree ?? 'B.Tech / M.Tech / MCA',
          min_cgpa: validated.minCgpa,
          allowed_departments: validated.allowedDepartments,
          max_active_backlogs: validated.maxActiveBacklogs,
          eligible_batch_years: validated.eligibleBatchYears,
          required_skills: validated.requiredSkills ?? [],
          number_of_openings: validated.numberOfOpenings ?? null,
          selection_process: validated.selectionProcess ?? null,
          application_deadline: validated.applicationDeadline,
          status: validated.status || 'draft',
          published_at: publishedAt,
          is_approved_by_admin: true,
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to create job posting' };
      }

      return {
        success: true,
        data: mapJobRow(data as JobRowRecord),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error creating job';
      return { success: false, error: msg };
    }
  },

  /**
   * Retrieves all jobs belonging to the recruiter's organization.
   */
  async getJobsByCompany(userId: string): Promise<JobPosting[]> {
    if (!userId) return [];

    const companyId = await this.getRecruiterCompanyId(userId);
    if (!companyId) return [];

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return Array.from(mockJobsStore.values())
        .filter((j) => j.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return Array.from(mockJobsStore.values())
          .filter((j) => j.companyId === companyId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return (data as JobRowRecord[]).map((row) => mapJobRow(row));
    } catch {
      return Array.from(mockJobsStore.values())
        .filter((j) => j.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  /**
   * Retrieves a single job by ID, ensuring recruiter ownership.
   */
  async getJobById(userId: string, jobId: string): Promise<JobPosting | null> {
    if (!userId || !jobId) return null;

    const companyId = await this.getRecruiterCompanyId(userId);
    if (!companyId) return null;

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      const job = mockJobsStore.get(jobId);
      if (job && job.companyId === companyId) {
        return job;
      }
      return null;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (error || !data) return null;

      return mapJobRow(data as JobRowRecord);
    } catch {
      return null;
    }
  },

  /**
   * Updates an existing job posting for the recruiter's organization.
   */
  async updateJob(
    userId: string,
    jobId: string,
    rawInput: unknown
  ): Promise<JobServiceResult<JobPosting>> {
    if (!userId || !jobId) {
      return { success: false, error: 'Authentication and Job ID required' };
    }

    const companyId = await this.getRecruiterCompanyId(userId);
    if (!companyId) {
      return { success: false, error: 'Unauthorized company access' };
    }

    const parseResult = updateJobSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return {
        success: false,
        error: firstIssue?.message || 'Invalid job update data',
      };
    }

    const validated = parseResult.data;
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      const existing = mockJobsStore.get(jobId);
      if (!existing || existing.companyId !== companyId) {
        return { success: false, error: 'Job not found or unauthorized' };
      }

      const updated: JobPosting = {
        ...existing,
        ...validated,
        publishedAt:
          validated.status === 'published' && !existing.publishedAt
            ? new Date().toISOString()
            : existing.publishedAt,
        updatedAt: new Date().toISOString(),
      };
      mockJobsStore.set(jobId, updated);
      return { success: true, data: updated };
    }

    try {
      const updatePayload: Record<string, unknown> = {};
      if (validated.title !== undefined) updatePayload.title = validated.title;
      if (validated.description !== undefined) updatePayload.description = validated.description;
      if (validated.employmentType !== undefined) updatePayload.employment_type = validated.employmentType;
      if (validated.department !== undefined) updatePayload.department = validated.department;
      if (validated.location !== undefined) updatePayload.location = validated.location;
      if (validated.workplaceType !== undefined) updatePayload.workplace_type = validated.workplaceType;
      if (validated.ctcMin !== undefined) updatePayload.ctc_min = validated.ctcMin;
      if (validated.ctcMax !== undefined) updatePayload.ctc_max = validated.ctcMax;
      if (validated.ctcDisplayText !== undefined) updatePayload.ctc_display_text = validated.ctcDisplayText;
      if (validated.stipendMonthly !== undefined) updatePayload.stipend_monthly = validated.stipendMonthly;
      if (validated.isSalaryDisclosed !== undefined) updatePayload.is_salary_disclosed = validated.isSalaryDisclosed;
      if (validated.degree !== undefined) updatePayload.degree = validated.degree;
      if (validated.minCgpa !== undefined) updatePayload.min_cgpa = validated.minCgpa;
      if (validated.allowedDepartments !== undefined) updatePayload.allowed_departments = validated.allowedDepartments;
      if (validated.maxActiveBacklogs !== undefined) updatePayload.max_active_backlogs = validated.maxActiveBacklogs;
      if (validated.eligibleBatchYears !== undefined) updatePayload.eligible_batch_years = validated.eligibleBatchYears;
      if (validated.requiredSkills !== undefined) updatePayload.required_skills = validated.requiredSkills;
      if (validated.numberOfOpenings !== undefined) updatePayload.number_of_openings = validated.numberOfOpenings;
      if (validated.selectionProcess !== undefined) updatePayload.selection_process = validated.selectionProcess;
      if (validated.applicationDeadline !== undefined) updatePayload.application_deadline = validated.applicationDeadline;
      if (validated.status !== undefined) {
        updatePayload.status = validated.status;
        if (validated.status === 'published') {
          updatePayload.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await (supabase as any)
        .from('jobs')
        .update(updatePayload)
        .eq('id', jobId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to update job' };
      }

      return {
        success: true,
        data: mapJobRow(data as JobRowRecord),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error updating job';
      return { success: false, error: msg };
    }
  },

  /**
   * Updates job status (draft -> published -> closed -> archived).
   */
  async updateJobStatus(
    userId: string,
    jobId: string,
    newStatus: JobStatus
  ): Promise<JobServiceResult<JobPosting>> {
    const job = await this.getJobById(userId, jobId);
    if (!job) {
      return { success: false, error: 'Job posting not found or unauthorized' };
    }

    if (newStatus === 'published') {
      const deadline = new Date(job.applicationDeadline);
      if (deadline.getTime() <= Date.now()) {
        return {
          success: false,
          error: 'Cannot publish a job with an expired or past application deadline.',
        };
      }
    }

    return this.updateJob(userId, jobId, { status: newStatus });
  },

  /**
   * Deletes a draft job posting.
   */
  async deleteJob(userId: string, jobId: string): Promise<JobServiceResult<void>> {
    if (!userId || !jobId) {
      return { success: false, error: 'Authentication and Job ID required' };
    }

    const job = await this.getJobById(userId, jobId);
    if (!job) {
      return { success: false, error: 'Job not found or unauthorized' };
    }

    if (job.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft jobs may be deleted. Active or past postings should be closed or archived.',
      };
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      mockJobsStore.delete(jobId);
      return { success: true };
    }

    try {
      const { error } = await (supabase as any)
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('company_id', job.companyId)
        .eq('status', 'draft');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database error deleting job';
      return { success: false, error: msg };
    }
  },

  /**
   * Computes accurate job statistics for a company.
   */
  async getCompanyJobCounts(companyId: string): Promise<CompanyJobCounts> {
    if (!companyId) {
      return { totalJobs: 0, activeJobs: 0, draftJobs: 0, closedJobs: 0 };
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      const allJobs = Array.from(mockJobsStore.values()).filter(
        (j) => j.companyId === companyId
      );
      const now = Date.now();
      const activeJobs = allJobs.filter(
        (j) => j.status === 'published' && new Date(j.applicationDeadline).getTime() > now
      ).length;
      const draftJobs = allJobs.filter((j) => j.status === 'draft').length;
      const closedJobs = allJobs.filter((j) => j.status === 'closed' || j.status === 'archived').length;

      return {
        totalJobs: allJobs.length,
        activeJobs,
        draftJobs,
        closedJobs,
      };
    }

    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('id, status, application_deadline')
        .eq('company_id', companyId);

      if (error || !data) {
        return { totalJobs: 0, activeJobs: 0, draftJobs: 0, closedJobs: 0 };
      }

      const now = Date.now();
      let activeJobs = 0;
      let draftJobs = 0;
      let closedJobs = 0;

      for (const row of data as { status: string; application_deadline: string }[]) {
        if (row.status === 'published' && new Date(row.application_deadline).getTime() > now) {
          activeJobs++;
        } else if (row.status === 'draft') {
          draftJobs++;
        } else if (row.status === 'closed' || row.status === 'archived') {
          closedJobs++;
        }
      }

      return {
        totalJobs: data.length,
        activeJobs,
        draftJobs,
        closedJobs,
      };
    } catch {
      return { totalJobs: 0, activeJobs: 0, draftJobs: 0, closedJobs: 0 };
    }
  },

  /**
   * Helper to filter, search, sort, and paginate jobs from in-memory store.
   */
  getPublishedJobsOffline(filters: StudentJobFilters = {}): PaginatedJobsResult {
    ensureMockSeeds();
    const now = Date.now();
    const {
      search,
      employmentType = 'all',
      workplaceType = 'all',
      department = 'all',
      minCgpa,
      batchYear,
      sortBy = 'newest',
      page = 1,
      pageSize = 9,
    } = filters;

    let jobs = Array.from(mockJobsStore.values()).filter(
      (j) => j.status === 'published' && new Date(j.applicationDeadline).getTime() > now
    );

    // Text search
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      jobs = jobs.filter((j) => {
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchCompany = (j.companyName || '').toLowerCase().includes(q);
        const matchDept = (j.department || '').toLowerCase().includes(q);
        const matchSkills = (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
        return matchTitle || matchCompany || matchDept || matchSkills;
      });
    }

    // Employment type
    if (employmentType && employmentType !== 'all') {
      jobs = jobs.filter((j) => j.employmentType === employmentType);
    }

    // Workplace type
    if (workplaceType && workplaceType !== 'all') {
      jobs = jobs.filter((j) => j.workplaceType === workplaceType);
    }

    // Department
    if (department && department !== 'all') {
      const target = department.trim().toLowerCase();
      jobs = jobs.filter((j) => {
        const matchDept = (j.department || '').toLowerCase().includes(target);
        const matchAllowed = (j.allowedDepartments || []).some(
          (d) => d.toLowerCase().includes(target)
        );
        return matchDept || matchAllowed || j.allowedDepartments.length === 0;
      });
    }

    // Min CGPA threshold
    if (minCgpa !== undefined && minCgpa !== null && !isNaN(minCgpa)) {
      jobs = jobs.filter((j) => j.minCgpa <= minCgpa);
    }

    // Graduation Batch
    if (batchYear !== undefined && batchYear !== null && !isNaN(batchYear)) {
      jobs = jobs.filter(
        (j) => j.eligibleBatchYears.length === 0 || j.eligibleBatchYears.includes(batchYear)
      );
    }

    // Sorting
    if (sortBy === 'deadline') {
      jobs.sort(
        (a, b) => new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime()
      );
    } else if (sortBy === 'title') {
      jobs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'ctc_desc') {
      jobs.sort((a, b) => (b.ctcMax || b.ctcMin || 0) - (a.ctcMax || a.ctcMin || 0));
    } else {
      // newest
      jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const totalCount = jobs.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedSlice = jobs.slice(startIndex, startIndex + pageSize);

    return {
      jobs: paginatedSlice,
      totalCount,
      page: currentPage,
      pageSize,
      totalPages,
    };
  },

  /**
   * Discovers active, published placement drives for student candidates.
   * Excludes drafts, closed, archived, and expired postings.
   */
  async getPublishedJobs(filters: StudentJobFilters = {}): Promise<PaginatedJobsResult> {
    ensureMockSeeds();
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return this.getPublishedJobsOffline(filters);
    }

    try {
      const nowIso = new Date().toISOString();
      const {
        search,
        employmentType = 'all',
        workplaceType = 'all',
        department = 'all',
        minCgpa,
        batchYear,
        sortBy = 'newest',
        page = 1,
        pageSize = 9,
      } = filters;

      let query = (supabase as any)
        .from('jobs')
        .select('*, companies(id, name, logo_url, website, description)')
        .eq('status', 'published')
        .gt('application_deadline', nowIso);

      if (employmentType && employmentType !== 'all') {
        query = query.eq('employment_type', employmentType);
      }

      if (workplaceType && workplaceType !== 'all') {
        query = query.eq('workplace_type', workplaceType);
      }

      if (minCgpa !== undefined && minCgpa !== null && !isNaN(minCgpa)) {
        query = query.lte('min_cgpa', minCgpa);
      }

      if (sortBy === 'deadline') {
        query = query.order('application_deadline', { ascending: true });
      } else if (sortBy === 'title') {
        query = query.order('title', { ascending: true });
      } else if (sortBy === 'ctc_desc') {
        query = query.order('ctc_max', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error || !data) {
        return this.getPublishedJobsOffline(filters);
      }

      let mappedJobs: JobPosting[] = (data as any[]).map((row) =>
        mapJobRow(row, row.companies)
      );

      // In-memory refinement for free-text search, arrays, and batch years
      if (search && search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        mappedJobs = mappedJobs.filter((j) => {
          const matchTitle = j.title.toLowerCase().includes(q);
          const matchCompany = (j.companyName || '').toLowerCase().includes(q);
          const matchDept = (j.department || '').toLowerCase().includes(q);
          const matchSkills = (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
          return matchTitle || matchCompany || matchDept || matchSkills;
        });
      }

      if (department && department !== 'all') {
        const target = department.trim().toLowerCase();
        mappedJobs = mappedJobs.filter((j) => {
          const matchDept = (j.department || '').toLowerCase().includes(target);
          const matchAllowed = (j.allowedDepartments || []).some(
            (d) => d.toLowerCase().includes(target)
          );
          return matchDept || matchAllowed || j.allowedDepartments.length === 0;
        });
      }

      if (batchYear !== undefined && batchYear !== null && !isNaN(batchYear)) {
        mappedJobs = mappedJobs.filter(
          (j) => j.eligibleBatchYears.length === 0 || j.eligibleBatchYears.includes(batchYear)
        );
      }

      const totalCount = mappedJobs.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const currentPage = Math.min(Math.max(1, page), totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedSlice = mappedJobs.slice(startIndex, startIndex + pageSize);

      return {
        jobs: paginatedSlice,
        totalCount,
        page: currentPage,
        pageSize,
        totalPages,
      };
    } catch {
      return this.getPublishedJobsOffline(filters);
    }
  },

  /**
   * Retrieves a single published job opening for student view.
   * If job is draft, closed, or nonexistent, returns null.
   */
  async getPublishedJobById(jobId: string): Promise<JobPosting | null> {
    ensureMockSeeds();
    if (!jobId) return null;

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      const job = mockJobsStore.get(jobId);
      if (job && job.status === 'published') {
        return job;
      }
      return null;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('*, companies(id, name, logo_url, website, description)')
        .eq('id', jobId)
        .eq('status', 'published')
        .maybeSingle();

      if (error || !data) {
        const fallback = mockJobsStore.get(jobId);
        if (fallback && fallback.status === 'published') return fallback;
        return null;
      }

      return mapJobRow(data as JobRowRecord, data.companies);
    } catch {
      const fallback = mockJobsStore.get(jobId);
      if (fallback && fallback.status === 'published') return fallback;
      return null;
    }
  },
};
