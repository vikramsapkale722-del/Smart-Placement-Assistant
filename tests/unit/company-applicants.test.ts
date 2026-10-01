import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applicationService } from '@/services/application.service';
import { jobService } from '@/services/job.service';
import {
  formatApplicationStatus,
  APPLICATION_STATUS_MAP,
} from '@/features/applications/utils/status-timeline';
import type { JobPosting } from '@/features/jobs/types';
import type { ApplicationStatus } from '@/features/applications/types';

describe('Recruiter Applicant Management Board Unit Tests (TASK-014)', () => {
  const companyUserA = 'recruiter-company-a';
  const companyUserB = 'recruiter-company-b';

  const companyAJob: JobPosting = {
    id: 'job-company-a-101',
    companyId: `mock-company-${companyUserA}`,
    companyName: 'Acme Cloud Innovations',
    companyWebsite: 'https://acmecloud.io',
    title: 'Cloud Infrastructure Engineer',
    description: 'Design and deploy reliable distributed systems.',
    employmentType: 'full_time',
    department: 'Cloud Platform',
    location: 'Bengaluru, India',
    workplaceType: 'hybrid',
    degree: 'B.Tech',
    minCgpa: 7.0,
    allowedDepartments: ['Computer Science and Engineering'],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const companyBJob: JobPosting = {
    id: 'job-company-b-202',
    companyId: `mock-company-${companyUserB}`,
    companyName: 'Beta Systems Corp',
    companyWebsite: 'https://betasystems.com',
    title: 'Frontend Product Designer',
    description: 'Design responsive UI components and design systems.',
    employmentType: 'internship',
    department: 'UI Design',
    location: 'Remote',
    workplaceType: 'remote',
    degree: 'B.Tech',
    minCgpa: 6.5,
    allowedDepartments: [],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    requiredSkills: ['React', 'Figma'],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    applicationService._resetMockStore();

    // Mock jobService to return jobs matching company ownership
    vi.spyOn(jobService, 'getRecruiterCompanyId').mockImplementation(async (userId) => {
      if (userId === companyUserA) return `mock-company-${companyUserA}`;
      if (userId === companyUserB) return `mock-company-${companyUserB}`;
      return null;
    });

    vi.spyOn(jobService, 'getJobById').mockImplementation(async (userId, jobId) => {
      if (userId === companyUserA && (jobId === companyAJob.id || jobId === 'job-seed-001')) {
        return companyAJob;
      }
      if (userId === companyUserB && jobId === companyBJob.id) {
        return companyBJob;
      }
      return null;
    });
  });

  describe('1. Candidate Application Retrieval & Roster Loading', () => {
    it('retrieves candidate applications for a company-owned job posting', async () => {
      // Seed applicant in mock store
      const result = await applicationService.getCompanyJobApplicants(
        companyUserA,
        companyAJob.id
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.job.id).toBe(companyAJob.id);
      expect(Array.isArray(result.data?.applicants)).toBe(true);
    });

    it('requires authenticated recruiter ID and job ID', async () => {
      const resMissingUser = await applicationService.getCompanyJobApplicants('', companyAJob.id);
      expect(resMissingUser.success).toBe(false);
      expect(resMissingUser.error).toContain('required');

      const resMissingJob = await applicationService.getCompanyJobApplicants(companyUserA, '');
      expect(resMissingJob.success).toBe(false);
      expect(resMissingJob.error).toContain('required');
    });
  });

  describe('2. Multi-Tenant Company Isolation & Security', () => {
    it('prevents Company A recruiter from accessing Company B job applicants', async () => {
      // Recruiter A attempts to access Job B
      const result = await applicationService.getCompanyJobApplicants(
        companyUserA,
        companyBJob.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('unauthorized');
      expect(result.data).toBeUndefined();
    });

    it('prevents Company B recruiter from accessing Company A job applicants', async () => {
      // Recruiter B attempts to access Job A
      const result = await applicationService.getCompanyJobApplicants(
        companyUserB,
        companyAJob.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('unauthorized');
      expect(result.data).toBeUndefined();
    });

    it('rejects access if the recruiter has no associated company profile', async () => {
      vi.spyOn(jobService, 'getRecruiterCompanyId').mockResolvedValue(null);

      const result = await applicationService.getCompanyJobApplicants(
        'unaffiliated-user',
        companyAJob.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('3. Candidate Data Mapping & Profile Completeness', () => {
    it('maps candidate personal, academic, skills, and portfolio attributes correctly', async () => {
      // Use seeded applicants
      const result = await applicationService.getCompanyJobApplicants(
        companyUserA,
        'job-seed-001'
      );

      expect(result.success).toBe(true);
      expect(result.data?.applicants.length).toBeGreaterThan(0);

      const applicant = result.data!.applicants[0];
      expect(applicant.id).toBeDefined();
      expect(applicant.candidate.fullName).toBeDefined();
      expect(applicant.candidate.email).toBeDefined();
      expect(applicant.candidate.collegeName).toBeDefined();
      expect(applicant.candidate.department).toBeDefined();
      expect(applicant.candidate.cgpa).toBeGreaterThan(0);
      expect(Array.isArray(applicant.candidate.skills)).toBe(true);
      expect(Array.isArray(applicant.statusHistory)).toBe(true);
    });
  });

  describe('4. Recruitment Status Management & Stage Transitions', () => {
    it('allows recruiter to transition applicant status through pipeline stages', async () => {
      // Retrieve seed applicant
      const listRes = await applicationService.getCompanyJobApplicants(
        companyUserA,
        'job-seed-001'
      );
      const app = listRes.data!.applicants.find((a) => a.status === 'applied');
      expect(app).toBeDefined();

      // Recruiter updates status to 'in_review'
      const updateRes1 = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'in_review',
        'Reviewing academic scorecards and technical portfolio'
      );

      expect(updateRes1.success).toBe(true);
      expect(updateRes1.data?.status).toBe('in_review');

      // Next stage: 'shortlisted'
      const updateRes2 = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'shortlisted',
        'Candidate selected for Round 1 Technical Systems Interview'
      );

      expect(updateRes2.success).toBe(true);
      expect(updateRes2.data?.status).toBe('shortlisted');
    });

    it('rejects status updates from unauthorized recruiters belonging to another company', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(
        companyUserA,
        'job-seed-001'
      );
      const app = listRes.data!.applicants[0];

      // Company B recruiter attempts to update Company A's candidate
      const attackRes = await applicationService.updateRecruiterApplicationStatus(
        companyUserB,
        app.id,
        'offered',
        'Spoofed status update attempt'
      );

      expect(attackRes.success).toBe(false);
      expect(attackRes.error).toContain('Unauthorized');
    });

    it('prevents modifying an application that has been withdrawn by the student candidate', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(
        companyUserA,
        'job-seed-001'
      );
      const app = listRes.data!.applicants[0];

      // Set to withdrawn first
      await applicationService.updateApplicationStatus(app.id, 'withdrawn', 'student-user');

      // Recruiter attempts to modify withdrawn application
      const res = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app.id,
        'shortlisted',
        'Attempt to shortlist withdrawn application'
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('withdrawn');
    });
  });

  describe('5. Audit Progression History & Recruiter Remarks', () => {
    it('records recruiter remarks accurately in the status history timeline', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(
        companyUserA,
        'job-seed-001'
      );
      const app =
        listRes.data!.applicants.find((a) => a.status === 'shortlisted') ||
        listRes.data!.applicants[0];
      const customRemark = 'Exceptional performance in algorithmic design round.';

      await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app.id,
        'offered',
        customRemark
      );

      const history = await applicationService.getApplicationStatusHistory(app.id);
      expect(history.length).toBeGreaterThan(0);

      const latestAudit = history[history.length - 1];
      expect(latestAudit.toStatus).toBe('offered');
      expect(latestAudit.remarks).toBe(customRemark);
      expect(latestAudit.changedBy).toBe(companyUserA);
    });
  });

  describe('6. Applicant Details Query Verification', () => {
    it('retrieves detailed candidate profile for authorized recruiter', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(
        companyUserA,
        'job-seed-001'
      );
      const targetApp = listRes.data!.applicants[0];

      const detailRes = await applicationService.getApplicantDetails(
        companyUserA,
        targetApp.id
      );

      expect(detailRes.success).toBe(true);
      expect(detailRes.data?.id).toBe(targetApp.id);
      expect(detailRes.data?.candidate.fullName).toBe(targetApp.candidate.fullName);
    });

    it('denies applicant detail retrieval for unauthorized company recruiter', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(
        companyUserA,
        'job-seed-001'
      );
      const targetApp = listRes.data!.applicants[0];

      const detailRes = await applicationService.getApplicantDetails(
        companyUserB,
        targetApp.id
      );

      expect(detailRes.success).toBe(false);
      expect(detailRes.error).toContain('Unauthorized');
    });
  });

  describe('7. Status Mapping & Formatting Utilities', () => {
    it('formats all recruitment statuses with approved labels and badges', () => {
      const statuses: ApplicationStatus[] = [
        'applied',
        'in_review',
        'shortlisted',
        'offered',
        'rejected',
        'withdrawn',
      ];

      for (const st of statuses) {
        const meta = formatApplicationStatus(st);
        expect(meta).toBeDefined();
        expect(meta.label).toBe(APPLICATION_STATUS_MAP[st].label);
        expect(meta.badgeVariant).toBe(APPLICATION_STATUS_MAP[st].badgeVariant);
      }
    });
  });
});
