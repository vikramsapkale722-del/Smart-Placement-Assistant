import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateStatusTransition,
  getAllowedNextStatuses,
  isTerminalStatus,
  VALID_RECRUITER_TRANSITIONS,
  TERMINAL_STATUSES,
} from '@/features/applications/utils/transitions';
import { applicationService } from '@/services/application.service';
import { jobService } from '@/services/job.service';
import type { JobPosting } from '@/features/jobs/types';
import type { ApplicationStatus } from '@/features/applications/types';

describe('Recruiter Candidate Stage Transition & Pipeline Automation Unit Tests (TASK-015)', () => {
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
    description: 'Design responsive UI components.',
    employmentType: 'internship',
    department: 'UI Design',
    location: 'Remote',
    workplaceType: 'remote',
    degree: 'B.Tech',
    minCgpa: 6.5,
    allowedDepartments: [],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    requiredSkills: ['React'],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    applicationService._resetMockStore();

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

  describe('1. Centralized Status Transition Validation Rules', () => {
    it('allows valid sequential forward transitions (Applied -> In Review -> Shortlisted -> Offered)', () => {
      expect(validateStatusTransition('applied', 'in_review').isValid).toBe(true);
      expect(validateStatusTransition('in_review', 'shortlisted').isValid).toBe(true);
      expect(validateStatusTransition('shortlisted', 'offered').isValid).toBe(true);
    });

    it('allows rejection from any active non-terminal stage', () => {
      expect(validateStatusTransition('applied', 'rejected').isValid).toBe(true);
      expect(validateStatusTransition('in_review', 'rejected').isValid).toBe(true);
      expect(validateStatusTransition('shortlisted', 'rejected').isValid).toBe(true);
    });

    it('identifies terminal stages correctly', () => {
      expect(isTerminalStatus('offered')).toBe(true);
      expect(isTerminalStatus('rejected')).toBe(true);
      expect(isTerminalStatus('withdrawn')).toBe(true);
      expect(isTerminalStatus('applied')).toBe(false);
      expect(isTerminalStatus('in_review')).toBe(false);
      expect(isTerminalStatus('shortlisted')).toBe(false);
    });

    it('blocks invalid backward transitions', () => {
      const res1 = validateStatusTransition('in_review', 'applied');
      expect(res1.isValid).toBe(false);
      expect(res1.error).toContain('Invalid recruitment pipeline transition');

      const res2 = validateStatusTransition('shortlisted', 'in_review');
      expect(res2.isValid).toBe(false);

      const res3 = validateStatusTransition('shortlisted', 'applied');
      expect(res3.isValid).toBe(false);
    });

    it('blocks skipping mandatory pipeline stages (e.g. Applied directly to Offered)', () => {
      const res = validateStatusTransition('applied', 'offered');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Invalid recruitment pipeline transition');
    });

    it('blocks any modification to withdrawn applications', () => {
      const targets: ApplicationStatus[] = ['applied', 'in_review', 'shortlisted', 'offered', 'rejected'];
      for (const target of targets) {
        const res = validateStatusTransition('withdrawn', target);
        expect(res.isValid).toBe(false);
        expect(res.error).toContain('withdrawn');
      }
    });

    it('blocks any modification once application is marked Rejected (terminal outcome)', () => {
      const targets: ApplicationStatus[] = ['applied', 'in_review', 'shortlisted', 'offered'];
      for (const target of targets) {
        const res = validateStatusTransition('rejected', target);
        expect(res.isValid).toBe(false);
        expect(res.error).toContain('terminal Rejected stage');
      }
    });

    it('blocks any modification once candidate has been Offered placement (terminal outcome)', () => {
      const targets: ApplicationStatus[] = ['applied', 'in_review', 'shortlisted', 'rejected'];
      for (const target of targets) {
        const res = validateStatusTransition('offered', target);
        expect(res.isValid).toBe(false);
        expect(res.error).toContain('terminal Offered stage');
      }
    });

    it('blocks duplicate transition to the identical stage', () => {
      const res = validateStatusTransition('in_review', 'in_review');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('already at stage');
    });

    it('returns exact allowed next stages for each status', () => {
      expect(getAllowedNextStatuses('applied')).toEqual(['in_review', 'rejected']);
      expect(getAllowedNextStatuses('in_review')).toEqual(['shortlisted', 'rejected']);
      expect(getAllowedNextStatuses('shortlisted')).toEqual(['offered', 'rejected']);
      expect(getAllowedNextStatuses('offered')).toEqual([]);
      expect(getAllowedNextStatuses('rejected')).toEqual([]);
      expect(getAllowedNextStatuses('withdrawn')).toEqual([]);
    });
  });

  describe('2. Server-Side Execution & Service Layer Pipeline Automation', () => {
    it('executes valid Applied -> In Review transition and appends immutable audit record', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants.find((a) => a.status === 'applied');
      expect(app).toBeDefined();

      const remark = 'Resume and academic transcripts verified by screening committee';
      const result = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'in_review',
        remark
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('in_review');

      // Verify immutable history entry
      const history = await applicationService.getApplicationStatusHistory(app!.id);
      const latest = history[history.length - 1];
      expect(latest.toStatus).toBe('in_review');
      expect(latest.fromStatus).toBe('applied');
      expect(latest.remarks).toBe(remark);
      expect(latest.changedBy).toBe(companyUserA);
      expect(latest.createdAt).toBeDefined();
    });

    it('executes valid In Review -> Shortlisted transition', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants.find((a) => a.status === 'in_review');
      expect(app).toBeDefined();

      const result = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'shortlisted',
        'Selected for Technical Systems Interview Round'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('shortlisted');
    });

    it('executes valid Shortlisted -> Offered transition', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants.find((a) => a.status === 'shortlisted');
      expect(app).toBeDefined();

      const result = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'offered',
        'Candidate selected for full-time offer at ₹18 LPA'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('offered');
    });

    it('rejects unauthorized backward transition on the server', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants.find((a) => a.status === 'shortlisted');
      expect(app).toBeDefined();

      const result = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'applied',
        'Attempted backward manipulation'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recruitment pipeline transition');
    });

    it('rejects unauthorized stage skip on the server', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants.find((a) => a.status === 'applied');
      expect(app).toBeDefined();

      const result = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'offered',
        'Attempted to skip screening and interviews'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recruitment pipeline transition');
    });

    it('enforces multi-tenant company isolation on status transitions', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants[0];

      // Recruiter B attempts to modify Recruiter A's application
      const result = await applicationService.updateRecruiterApplicationStatus(
        companyUserB,
        app.id,
        'rejected',
        'Cross-tenant tampering attempt'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('blocks modifications to withdrawn applications on the server', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants[0];

      // Simulate student withdrawal
      await applicationService.updateApplicationStatus(app.id, 'withdrawn', 'student-user');

      const result = await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app.id,
        'in_review',
        'Recruiter attempting to reopen withdrawn application'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('withdrawn');
    });

    it('maintains exactly one audit history entry per transition', async () => {
      const listRes = await applicationService.getCompanyJobApplicants(companyUserA, 'job-seed-001');
      const app = listRes.data!.applicants.find((a) => a.status === 'applied');
      expect(app).toBeDefined();

      const initialHistory = await applicationService.getApplicationStatusHistory(app!.id);
      const initialCount = initialHistory.length;

      await applicationService.updateRecruiterApplicationStatus(
        companyUserA,
        app!.id,
        'in_review',
        'Audit increment test'
      );

      const updatedHistory = await applicationService.getApplicationStatusHistory(app!.id);
      expect(updatedHistory.length).toBe(initialCount + 1);
    });
  });
});
