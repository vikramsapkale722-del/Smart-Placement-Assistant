import { describe, it, expect, beforeEach } from 'vitest';
import { jobService } from '@/services/job.service';
import { createJobSchema } from '@/features/jobs/schemas';

describe('Job Posting Engine Foundation Tests (TASK-010)', () => {
  const futureDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const pastDeadline = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  describe('createJobSchema Zod Validation', () => {
    it('validates a complete, valid job input', () => {
      const valid = {
        title: 'Full Stack Software Engineer',
        description: 'Design and build high-performance web applications using modern technologies.',
        employmentType: 'full_time',
        location: 'Bengaluru',
        workplaceType: 'hybrid',
        ctcMin: 12.0,
        ctcMax: 18.0,
        ctcDisplayText: '12 - 18 LPA',
        stipendMonthly: null,
        minCgpa: 7.5,
        allowedDepartments: ['Computer Science and Engineering', 'Information Technology'],
        maxActiveBacklogs: 0,
        eligibleBatchYears: [2025, 2026],
        applicationDeadline: futureDeadline,
        status: 'published',
      };

      const result = createJobSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects title shorter than 3 characters', () => {
      const invalid = {
        title: 'SE',
        description: 'Valid description that has more than 20 characters in length.',
        employmentType: 'full_time',
        location: 'Remote',
        workplaceType: 'remote',
        applicationDeadline: futureDeadline,
      };

      const result = createJobSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/title must be at least 3 characters/i);
      }
    });

    it('rejects description shorter than 20 characters', () => {
      const invalid = {
        title: 'Frontend Engineer',
        description: 'Too short desc',
        employmentType: 'full_time',
        location: 'Delhi',
        workplaceType: 'on_site',
        applicationDeadline: futureDeadline,
      };

      const result = createJobSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/description must be at least 20 characters/i);
      }
    });

    it('rejects invalid CGPA (< 0 or > 10)', () => {
      const invalidNegative = {
        title: 'Backend Engineer',
        description: 'Valid description with sufficient length for placement testing.',
        employmentType: 'full_time',
        location: 'Hyderabad',
        workplaceType: 'hybrid',
        minCgpa: -1.0,
        applicationDeadline: futureDeadline,
      };

      const resNeg = createJobSchema.safeParse(invalidNegative);
      expect(resNeg.success).toBe(false);

      const invalidExceed = {
        ...invalidNegative,
        minCgpa: 10.5,
      };
      const resExceed = createJobSchema.safeParse(invalidExceed);
      expect(resExceed.success).toBe(false);
    });

    it('rejects ctcMax when lower than ctcMin', () => {
      const invalid = {
        title: 'Backend Engineer',
        description: 'Valid description with sufficient length for placement testing.',
        employmentType: 'full_time',
        location: 'Hyderabad',
        workplaceType: 'hybrid',
        ctcMin: 15.0,
        ctcMax: 10.0,
        applicationDeadline: futureDeadline,
      };

      const result = createJobSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/Maximum CTC must be greater than/i);
      }
    });

    it('rejects publishing a job with an application deadline in the past', () => {
      const pastJob = {
        title: 'DevOps Engineer',
        description: 'Managing cloud clusters, CI/CD pipelines, and observability tooling.',
        employmentType: 'full_time',
        location: 'Remote',
        workplaceType: 'remote',
        applicationDeadline: pastDeadline,
        status: 'published',
      };

      const result = createJobSchema.safeParse(pastJob);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/deadline must be in the future/i);
      }
    });

    it('allows saving a draft job even with a past deadline during editing', () => {
      const draftJob = {
        title: 'DevOps Engineer',
        description: 'Managing cloud clusters, CI/CD pipelines, and observability tooling.',
        employmentType: 'full_time',
        location: 'Remote',
        workplaceType: 'remote',
        applicationDeadline: pastDeadline,
        status: 'draft',
      };

      const result = createJobSchema.safeParse(draftJob);
      expect(result.success).toBe(true);
    });
  });

  describe('jobService Operations & Tenant Isolation', () => {
    const testUserId = 'test-recruiter-uuid-1';

    it('creates a job posting for the authenticated recruiter', async () => {
      const res = await jobService.createJob(testUserId, {
        title: 'Graduate Data Scientist',
        description: 'Predictive modeling, NLP pipelines, and data analytics on large datasets.',
        employmentType: 'full_time',
        location: 'Pune',
        workplaceType: 'hybrid',
        ctcMin: 9.0,
        ctcMax: 14.0,
        minCgpa: 8.0,
        applicationDeadline: futureDeadline,
        status: 'draft',
      });

      expect(res.success).toBe(true);
      expect(res.data?.id).toBeDefined();
      expect(res.data?.title).toBe('Graduate Data Scientist');
      expect(res.data?.status).toBe('draft');
      expect(res.data?.createdBy).toBe(testUserId);
    });

    it('lists jobs belonging to the recruiter organization', async () => {
      const jobs = await jobService.getJobsByCompany(testUserId);
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs[0]?.title).toBe('Graduate Data Scientist');
    });

    it('updates job publication status and rejects publishing expired jobs', async () => {
      const createRes = await jobService.createJob(testUserId, {
        title: 'Cloud Security Analyst',
        description: 'Securing cloud deployments, vulnerability scanning, and IAM management.',
        employmentType: 'full_time',
        location: 'Bengaluru',
        workplaceType: 'on_site',
        applicationDeadline: pastDeadline,
        status: 'draft',
      });

      const jobId = createRes.data?.id!;

      // Publishing with past deadline should fail
      const pubRes = await jobService.updateJobStatus(testUserId, jobId, 'published');
      expect(pubRes.success).toBe(false);
      expect(pubRes.error).toMatch(/expired or past application deadline/i);

      // Updating deadline to future then publishing should succeed
      await jobService.updateJob(testUserId, jobId, { applicationDeadline: futureDeadline });
      const pubSuccess = await jobService.updateJobStatus(testUserId, jobId, 'published');
      expect(pubSuccess.success).toBe(true);
      expect(pubSuccess.data?.status).toBe('published');
    });

    it('allows deleting draft jobs but prevents deleting published jobs', async () => {
      const createRes = await jobService.createJob(testUserId, {
        title: 'QA Automation Engineer',
        description: 'Writing end-to-end Playwright tests, API tests, and performance benchmarks.',
        employmentType: 'full_time',
        location: 'Remote',
        workplaceType: 'remote',
        applicationDeadline: futureDeadline,
        status: 'published',
      });

      const jobId = createRes.data?.id!;

      // Cannot delete published job
      const delPub = await jobService.deleteJob(testUserId, jobId);
      expect(delPub.success).toBe(false);
      expect(delPub.error).toMatch(/Only draft jobs may be deleted/i);

      // Revert to draft then delete succeeds
      await jobService.updateJobStatus(testUserId, jobId, 'draft');
      const delDraft = await jobService.deleteJob(testUserId, jobId);
      expect(delDraft.success).toBe(true);
    });

    it('persists and maps all 6-section metadata fields (department, degree, skills, openings, selection process)', async () => {
      const res = await jobService.createJob(testUserId, {
        title: 'Senior Frontend Architect',
        description: 'Lead engineering on design system components and Next.js portal architecture.',
        employmentType: 'full_time',
        department: 'Core Frontend',
        location: 'Bengaluru',
        workplaceType: 'hybrid',
        ctcMin: 18.0,
        ctcMax: 26.0,
        ctcDisplayText: '₹18 - 26 LPA',
        isSalaryDisclosed: true,
        degree: 'B.Tech / M.Tech',
        minCgpa: 8.0,
        allowedDepartments: ['Computer Science and Engineering'],
        maxActiveBacklogs: 0,
        eligibleBatchYears: [2025],
        requiredSkills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
        numberOfOpenings: 4,
        selectionProcess: '1. Machine Coding Round 2. System Architecture 3. Leadership Interview',
        applicationDeadline: futureDeadline,
        status: 'draft',
      });

      expect(res.success).toBe(true);
      expect(res.data?.department).toBe('Core Frontend');
      expect(res.data?.degree).toBe('B.Tech / M.Tech');
      expect(res.data?.isSalaryDisclosed).toBe(true);
      expect(res.data?.requiredSkills).toEqual(['React', 'TypeScript', 'Next.js', 'TailwindCSS']);
      expect(res.data?.numberOfOpenings).toBe(4);
      expect(res.data?.selectionProcess).toContain('Machine Coding');
    });

    it('enforces strict cross-company isolation: company B recruiter cannot access company A jobs', async () => {
      const otherRecruiterId = 'other-company-recruiter-uuid';

      // Create a job for testUserId (Company A)
      const res = await jobService.createJob(testUserId, {
        title: 'Confidential Internal Job',
        description: 'Internal project description requiring top secret company clearance.',
        employmentType: 'full_time',
        location: 'Mumbai',
        workplaceType: 'on_site',
        applicationDeadline: futureDeadline,
        status: 'draft',
      });

      const jobId = res.data?.id!;

      // Recruiter B attempts to fetch Company A's job
      const fetchedByB = await jobService.getJobById(otherRecruiterId, jobId);
      expect(fetchedByB).toBeNull();

      // Recruiter B attempts to update Company A's job
      const updateByB = await jobService.updateJob(otherRecruiterId, jobId, {
        title: 'Hacked Title Attempt',
      });
      expect(updateByB.success).toBe(false);

      // Recruiter B attempts to delete Company A's job
      const deleteByB = await jobService.deleteJob(otherRecruiterId, jobId);
      expect(deleteByB.success).toBe(false);
    });

    it('rejects unauthenticated requests cleanly', async () => {
      const resCreate = await jobService.createJob('', {
        title: 'Unauthenticated Posting',
        description: 'Should fail immediately because userId is empty.',
        employmentType: 'full_time',
        location: 'Delhi',
        workplaceType: 'remote',
        applicationDeadline: futureDeadline,
      });

      expect(resCreate.success).toBe(false);
      expect(resCreate.error).toMatch(/Authentication required/i);
    });

    it('calculates company job counts correctly', async () => {
      const companyId = await jobService.getRecruiterCompanyId(testUserId);
      const counts = await jobService.getCompanyJobCounts(companyId!);

      expect(typeof counts.totalJobs).toBe('number');
      expect(typeof counts.activeJobs).toBe('number');
      expect(typeof counts.draftJobs).toBe('number');
      expect(typeof counts.closedJobs).toBe('number');
      expect(counts.totalJobs).toBeGreaterThan(0);
    });
  });
});
