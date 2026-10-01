import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applicationService } from '@/services/application.service';
import { studentService } from '@/services/student.service';
import { jobService } from '@/services/job.service';
import {
  formatApplicationStatus,
  getTimelineStages,
  APPLICATION_STATUS_MAP,
} from '@/features/applications/utils/status-timeline';
import type { CompleteStudentProfile } from '@/features/student/types';
import type { JobPosting } from '@/features/jobs/types';
import type { ApplicationStatus } from '@/features/applications/types';

describe('Student Application Tracking View Unit Tests (TASK-013)', () => {
  const studentUserA = 'student-test-uid-aaa';
  const studentUserB = 'student-test-uid-bbb';

  const profileA: CompleteStudentProfile = {
    userId: studentUserA,
    profileId: 'student-profile-uuid-aaa',
    fullName: 'Ananya Roy',
    email: 'ananya.roy@university.edu',
    collegeName: 'National Institute of Technology',
    degree: 'B.Tech',
    rollNumber: 'CS2022088',
    department: 'Computer Science and Engineering',
    batchYear: 2026,
    cgpa: 9.1,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    gender: 'female',
    isAcademicallyVerified: true,
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  const profileB: CompleteStudentProfile = {
    userId: studentUserB,
    profileId: 'student-profile-uuid-bbb',
    fullName: 'Vikram Seth',
    email: 'vikram.seth@university.edu',
    collegeName: 'National Institute of Technology',
    degree: 'B.Tech',
    rollNumber: 'ME2022019',
    department: 'Mechanical Engineering',
    batchYear: 2026,
    cgpa: 8.2,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    gender: 'male',
    isAcademicallyVerified: true,
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  const sampleJob1: JobPosting = {
    id: 'test-job-track-001',
    companyId: 'company-nexus-labs',
    companyName: 'Nexus Cloud Technologies',
    title: 'Cloud Systems Engineer',
    description: 'Cloud systems and distributed architecture.',
    employmentType: 'full_time',
    location: 'Bengaluru, India',
    workplaceType: 'hybrid',
    minCgpa: 7.5,
    allowedDepartments: ['Computer Science and Engineering'],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleJob2: JobPosting = {
    id: 'test-job-track-002',
    companyId: 'company-stripewave',
    companyName: 'Stripewave Labs',
    title: 'Frontend Developer Intern',
    description: 'React, Next.js, and TypeScript frontend development.',
    employmentType: 'internship',
    location: 'Remote, India',
    workplaceType: 'remote',
    minCgpa: 7.0,
    allowedDepartments: ['Computer Science and Engineering'],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    applicationDeadline: new Date(Date.now() + 20 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    applicationService._resetMockStore();

    vi.spyOn(studentService, 'getProfile').mockImplementation(async (userId: string) => {
      if (userId === studentUserA) return profileA;
      if (userId === studentUserB) return profileB;
      return null;
    });

    vi.spyOn(jobService, 'getPublishedJobById').mockImplementation(async (id: string) => {
      if (id === sampleJob1.id) return sampleJob1;
      if (id === sampleJob2.id) return sampleJob2;
      return null;
    });
  });

  describe('1. Application Retrieval & Metadata Mapping', () => {
    it('returns empty array when student has submitted 0 applications (Empty State)', async () => {
      const apps = await applicationService.getStudentApplications(studentUserA);
      expect(apps).toEqual([]);
      expect(apps.length).toBe(0);
    });

    it('retrieves all applications for a student with complete metadata and status history', async () => {
      const sub1 = await applicationService.submitApplication(studentUserA, {
        jobId: sampleJob1.id,
        coverNote: 'Excited about distributed cloud infrastructure.',
      });
      expect(sub1.success).toBe(true);

      const sub2 = await applicationService.submitApplication(studentUserA, {
        jobId: sampleJob2.id,
        coverNote: 'Passionate about frontend performance and React.',
      });
      expect(sub2.success).toBe(true);

      const apps = await applicationService.getStudentApplications(studentUserA);
      expect(apps.length).toBe(2);

      const app1 = apps.find((a) => a.jobId === sampleJob1.id);
      expect(app1).toBeDefined();
      expect(app1?.jobTitle).toBe('Cloud Systems Engineer');
      expect(app1?.companyName).toBe('Nexus Cloud Technologies');
      expect(app1?.location).toBe('Bengaluru, India');
      expect(app1?.employmentType).toBe('full_time');
      expect(app1?.status).toBe('applied');
      expect(app1?.coverNote).toBe('Excited about distributed cloud infrastructure.');
      expect(app1?.statusHistory).toBeDefined();
      expect(app1?.statusHistory?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Student Ownership Isolation', () => {
    it('guarantees a student only sees their own applications and never another student records', async () => {
      // Student A applies to Job 1
      await applicationService.submitApplication(studentUserA, {
        jobId: sampleJob1.id,
      });

      // Student A retrieves applications
      const appsA = await applicationService.getStudentApplications(studentUserA);
      expect(appsA.length).toBe(1);
      expect(appsA[0].studentId).toBe(profileA.profileId);

      // Student B retrieves applications -> must be empty
      const appsB = await applicationService.getStudentApplications(studentUserB);
      expect(appsB.length).toBe(0);
      expect(appsB.some((a) => a.studentId === profileA.profileId)).toBe(false);
    });
  });

  describe('3. Status Mapping & Labels', () => {
    it('maps all supported application statuses to proper user-friendly labels and badges', () => {
      const statuses: ApplicationStatus[] = [
        'applied',
        'in_review',
        'shortlisted',
        'offered',
        'rejected',
        'withdrawn',
      ];

      for (const status of statuses) {
        const meta = formatApplicationStatus(status);
        expect(meta.label).toBeDefined();
        expect(meta.badgeVariant).toBeDefined();
        expect(meta.description).toBeDefined();
      }

      expect(formatApplicationStatus('applied').label).toBe('Applied');
      expect(formatApplicationStatus('in_review').label).toBe('In Review');
      expect(formatApplicationStatus('shortlisted').label).toBe('Shortlisted');
      expect(formatApplicationStatus('offered').label).toBe('Offered');
      expect(formatApplicationStatus('rejected').label).toBe('Rejected');
      expect(formatApplicationStatus('withdrawn').label).toBe('Withdrawn');
    });
  });

  describe('4. Recruitment Timeline Construction', () => {
    it('constructs correct timeline stages for applied status without future stages completed', () => {
      const stages = getTimelineStages('applied', [
        {
          id: 'hist-1',
          applicationId: 'app-1',
          fromStatus: null,
          toStatus: 'applied',
          createdAt: '2026-09-30T10:00:00Z',
          remarks: 'Submitted',
        },
      ]);

      expect(stages.length).toBe(4);
      expect(stages[0].key).toBe('applied');
      expect(stages[0].status).toBe('current');
      expect(stages[0].timestamp).toBe('2026-09-30T10:00:00Z');

      expect(stages[1].key).toBe('in_review');
      expect(stages[1].status).toBe('upcoming');

      expect(stages[2].key).toBe('shortlisted');
      expect(stages[2].status).toBe('upcoming');

      expect(stages[3].key).toBe('offered');
      expect(stages[3].status).toBe('upcoming');
    });

    it('constructs correct timeline stages for shortlisted status with prior stages completed', () => {
      const stages = getTimelineStages('shortlisted', [
        {
          id: 'hist-1',
          applicationId: 'app-1',
          fromStatus: null,
          toStatus: 'applied',
          createdAt: '2026-09-30T10:00:00Z',
        },
        {
          id: 'hist-2',
          applicationId: 'app-1',
          fromStatus: 'applied',
          toStatus: 'in_review',
          createdAt: '2026-10-02T10:00:00Z',
        },
        {
          id: 'hist-3',
          applicationId: 'app-1',
          fromStatus: 'in_review',
          toStatus: 'shortlisted',
          createdAt: '2026-10-05T10:00:00Z',
        },
      ]);

      expect(stages[0].key).toBe('applied');
      expect(stages[0].status).toBe('completed');

      expect(stages[1].key).toBe('in_review');
      expect(stages[1].status).toBe('completed');

      expect(stages[2].key).toBe('shortlisted');
      expect(stages[2].status).toBe('current');

      expect(stages[3].key).toBe('offered');
      expect(stages[3].status).toBe('upcoming');
    });

    it('constructs terminal timeline correctly for rejected applications', () => {
      const stages = getTimelineStages('rejected', [
        {
          id: 'hist-1',
          applicationId: 'app-1',
          fromStatus: null,
          toStatus: 'applied',
          createdAt: '2026-09-30T10:00:00Z',
        },
        {
          id: 'hist-2',
          applicationId: 'app-1',
          fromStatus: 'applied',
          toStatus: 'rejected',
          createdAt: '2026-10-02T10:00:00Z',
          remarks: 'Did not meet technical assessment cutoff',
        },
      ]);

      const lastStage = stages[stages.length - 1];
      expect(lastStage.key).toBe('rejected');
      expect(lastStage.status).toBe('terminal_rejected');
      expect(lastStage.remarks).toBe('Did not meet technical assessment cutoff');
    });

    it('constructs terminal timeline correctly for withdrawn applications', () => {
      const stages = getTimelineStages('withdrawn', [
        {
          id: 'hist-1',
          applicationId: 'app-1',
          fromStatus: null,
          toStatus: 'applied',
          createdAt: '2026-09-30T10:00:00Z',
        },
        {
          id: 'hist-2',
          applicationId: 'app-1',
          fromStatus: 'applied',
          toStatus: 'withdrawn',
          createdAt: '2026-10-01T10:00:00Z',
          remarks: 'Withdrawn by candidate',
        },
      ]);

      const lastStage = stages[stages.length - 1];
      expect(lastStage.key).toBe('withdrawn');
      expect(lastStage.status).toBe('terminal_withdrawn');
    });
  });

  describe('5. Status Update Simulation & Audit History Retrieval', () => {
    it('updates application status and retrieves full status progression history', async () => {
      const sub = await applicationService.submitApplication(studentUserA, {
        jobId: sampleJob1.id,
      });
      const appId = sub.data!.id;

      await applicationService.updateApplicationStatus(
        appId,
        'in_review',
        'recruiter-1',
        'Resume screening in progress'
      );

      await applicationService.updateApplicationStatus(
        appId,
        'shortlisted',
        'recruiter-1',
        'Invited for Technical Interview Round 1'
      );

      const history = await applicationService.getApplicationStatusHistory(appId);
      expect(history.length).toBe(3);
      expect(history[0].toStatus).toBe('applied');
      expect(history[1].toStatus).toBe('in_review');
      expect(history[2].toStatus).toBe('shortlisted');
      expect(history[2].remarks).toBe('Invited for Technical Interview Round 1');

      const app = await applicationService.getApplicationById(appId);
      expect(app?.status).toBe('shortlisted');
    });
  });
});
