import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applicationService } from '@/services/application.service';
import { jobService } from '@/services/job.service';
import { studentService } from '@/services/student.service';
import type { CompleteStudentProfile } from '@/features/student/types';
import type { JobPosting } from '@/features/jobs/types';

describe('Job Application Engine Service Unit Tests (TASK-012)', () => {
  const mockStudentUser = 'student-test-uid-101';

  const eligibleStudentProfile: CompleteStudentProfile = {
    userId: mockStudentUser,
    profileId: 'student-profile-uuid-101',
    fullName: 'Rahul Verma',
    email: 'rahul.verma@college.edu',
    collegeName: 'Apex Institute of Technology',
    degree: 'B.Tech',
    rollNumber: 'CS2022045',
    department: 'Computer Science and Engineering',
    batchYear: 2026,
    cgpa: 8.8,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    gender: 'male',
    isAcademicallyVerified: true,
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  const eligiblePublishedJob: JobPosting = {
    id: 'test-job-app-001',
    companyId: 'company-acme-corp',
    companyName: 'Acme Systems',
    companyWebsite: 'https://acme.example.com',
    title: 'Associate Cloud Engineer',
    description: 'Design and deploy scalable cloud infrastructure and backend APIs.',
    employmentType: 'full_time',
    location: 'Bengaluru, India',
    workplaceType: 'hybrid',
    minCgpa: 7.5,
    allowedDepartments: ['Computer Science and Engineering', 'Information Technology'],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    applicationDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    applicationService._resetMockStore();

    // Default mock resolves
    vi.spyOn(studentService, 'getProfile').mockResolvedValue(eligibleStudentProfile);
    vi.spyOn(jobService, 'getPublishedJobById').mockImplementation(async (id: string) => {
      if (id === eligiblePublishedJob.id) {
        return eligiblePublishedJob;
      }
      return null;
    });
  });

  describe('Application Submission & Creation', () => {
    it('successfully submits application for eligible student and published active job', async () => {
      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
        coverNote: 'Excited about cloud architecture and distributed microservices.',
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.jobId).toBe(eligiblePublishedJob.id);
      expect(res.data?.studentId).toBe(eligibleStudentProfile.profileId);
      expect(res.data?.status).toBe('applied');
      expect(res.data?.coverNote).toBe('Excited about cloud architecture and distributed microservices.');
      expect(res.data?.appliedAt).toBeDefined();
      expect(res.data?.eligibilitySnapshot).toBeDefined();
    });

    it('submits application without cover note gracefully', async () => {
      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(true);
      expect(res.data?.coverNote).toBeNull();
      expect(res.data?.status).toBe('applied');
    });

    it('retrieves application status via hasApplied and getExistingApplication', async () => {
      expect(await applicationService.hasApplied(mockStudentUser, eligiblePublishedJob.id)).toBe(false);

      await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(await applicationService.hasApplied(mockStudentUser, eligiblePublishedJob.id)).toBe(true);
      const existing = await applicationService.getExistingApplication(mockStudentUser, eligiblePublishedJob.id);
      expect(existing).not.toBeNull();
      expect(existing?.jobId).toBe(eligiblePublishedJob.id);
      expect(existing?.status).toBe('applied');
    });
  });

  describe('Duplicate Application Prevention', () => {
    it('blocks duplicate application submissions for the same student and job', async () => {
      const firstSubmission = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });
      expect(firstSubmission.success).toBe(true);

      // Second attempt with same user and job
      const duplicateSubmission = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
        coverNote: 'Trying to apply again',
      });

      expect(duplicateSubmission.success).toBe(false);
      expect(duplicateSubmission.error).toMatch(/already submitted an application/i);
    });
  });

  describe('Academic Eligibility Enforcement', () => {
    it('rejects candidate if CGPA is below the minimum job threshold', async () => {
      vi.spyOn(studentService, 'getProfile').mockResolvedValue({
        ...eligibleStudentProfile,
        cgpa: 7.0, // Job requires 7.5
      });

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/CGPA requirement not met/i);
    });

    it('rejects candidate if active backlogs exceed maximum allowed', async () => {
      vi.spyOn(studentService, 'getProfile').mockResolvedValue({
        ...eligibleStudentProfile,
        activeBacklogs: 1, // Job allows 0
      });

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Backlog limit exceeded/i);
    });

    it('rejects candidate if student department is not permitted', async () => {
      vi.spyOn(studentService, 'getProfile').mockResolvedValue({
        ...eligibleStudentProfile,
        department: 'Civil Engineering', // Job allows CSE, IT
      });

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Branch not eligible/i);
    });

    it('rejects candidate if graduation batch year is not in eligible batches', async () => {
      vi.spyOn(studentService, 'getProfile').mockResolvedValue({
        ...eligibleStudentProfile,
        batchYear: 2025, // Job requires 2026
      });

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Graduation batch not eligible/i);
    });
  });

  describe('Job Status & Deadline Enforcement', () => {
    it('rejects application if job application deadline has passed', async () => {
      const expiredJob: JobPosting = {
        ...eligiblePublishedJob,
        applicationDeadline: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      vi.spyOn(jobService, 'getPublishedJobById').mockResolvedValue(expiredJob);

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/deadline for this position has passed/i);
    });

    it('rejects application if job is not found or not published', async () => {
      vi.spyOn(jobService, 'getPublishedJobById').mockResolvedValue(null);

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: 'non-existent-or-draft-job',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/not available for applications/i);
    });
  });

  describe('Identity & Authorization Integrity', () => {
    it('fails if user is unauthenticated', async () => {
      const res = await applicationService.submitApplication('', {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Authentication required/i);
    });

    it('fails if student profile does not exist', async () => {
      vi.spyOn(studentService, 'getProfile').mockResolvedValue(null);

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Student profile not found/i);
    });

    it('validates cover note character length', async () => {
      const longNote = 'A'.repeat(2500);

      const res = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
        coverNote: longNote,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cannot exceed 2,000 characters/i);
    });

    it('retrieves applications list and individual application by ID', async () => {
      const sub = await applicationService.submitApplication(mockStudentUser, {
        jobId: eligiblePublishedJob.id,
        coverNote: 'First application',
      });
      expect(sub.success).toBe(true);

      const byId = await applicationService.getApplicationById(sub.data!.id);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(sub.data!.id);
      expect(byId?.status).toBe('applied');

      const allApps = await applicationService.getStudentApplications(mockStudentUser);
      expect(allApps.length).toBeGreaterThanOrEqual(1);
      expect(allApps.some((a) => a.id === sub.data!.id)).toBe(true);
    });
  });
});
