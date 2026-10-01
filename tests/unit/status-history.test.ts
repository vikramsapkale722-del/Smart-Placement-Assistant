import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applicationService } from '@/services/application.service';
import { jobService } from '@/services/job.service';
import { studentService } from '@/services/student.service';
import { rbacService } from '@/services/rbac.service';
import {
  getStudentApplicationHistoryAction,
  getRecruiterApplicationHistoryAction,
} from '@/features/applications/actions';
import {
  formatApplicationStatus,
  getStatusIcon,
  getHistoryAttribution,
  getTerminalOutcomeInfo,
  formatTransitionTitle,
} from '@/features/applications/utils/status-timeline';
import type { CompleteStudentProfile } from '@/features/student/types';
import type { JobPosting } from '@/features/jobs/types';
import type { ApplicationStatusHistoryItem, ApplicationStatus } from '@/features/applications/types';

describe('Application Status History & Full Audit Transparency (TASK-016)', () => {
  const mockStudentUserA = 'student-uid-alpha';
  const mockStudentUserB = 'student-uid-beta';
  const mockRecruiterUserA = 'recruiter-uid-alpha';
  const mockRecruiterUserB = 'recruiter-uid-beta';

  const studentProfileA: CompleteStudentProfile = {
    userId: mockStudentUserA,
    profileId: 'profile-uuid-alpha',
    fullName: 'Aarav Patel',
    email: 'aarav@apex.edu',
    collegeName: 'Apex Institute of Technology',
    degree: 'B.Tech',
    rollNumber: 'CS2022001',
    department: 'Computer Science and Engineering',
    batchYear: 2026,
    cgpa: 9.0,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    isAcademicallyVerified: true,
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  const studentProfileB: CompleteStudentProfile = {
    userId: mockStudentUserB,
    profileId: 'profile-uuid-beta',
    fullName: 'Bhavna Sharma',
    email: 'bhavna@apex.edu',
    collegeName: 'Apex Institute of Technology',
    degree: 'B.Tech',
    rollNumber: 'CS2022002',
    department: 'Computer Science and Engineering',
    batchYear: 2026,
    cgpa: 8.5,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    isAcademicallyVerified: true,
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  const jobCompanyA: JobPosting = {
    id: 'job-company-a-01',
    companyId: 'company-uuid-alpha',
    companyName: 'Alpha Cloud Corp',
    title: 'Platform Engineer',
    description: 'Cloud infrastructure and Kubernetes operations.',
    employmentType: 'full_time',
    location: 'Bengaluru, India',
    workplaceType: 'hybrid',
    minCgpa: 7.0,
    allowedDepartments: ['Computer Science and Engineering'],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const jobCompanyB: JobPosting = {
    id: 'job-company-b-02',
    companyId: 'company-uuid-beta',
    companyName: 'Beta Data Labs',
    title: 'Data Analyst',
    description: 'Data pipelines and business intelligence.',
    employmentType: 'full_time',
    location: 'Hyderabad, India',
    workplaceType: 'on_site',
    minCgpa: 7.0,
    allowedDepartments: ['Computer Science and Engineering'],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2026],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    applicationService._resetMockStore();

    // Default student profiles mock
    vi.spyOn(studentService, 'getProfile').mockImplementation(async (userId: string) => {
      if (userId === mockStudentUserA || userId === studentProfileA.profileId) return studentProfileA;
      if (userId === mockStudentUserB || userId === studentProfileB.profileId) return studentProfileB;
      return null;
    });

    // Default jobs mock
    vi.spyOn(jobService, 'getPublishedJobById').mockImplementation(async (jobId: string) => {
      if (jobId === jobCompanyA.id) return jobCompanyA;
      if (jobId === jobCompanyB.id) return jobCompanyB;
      return null;
    });

    // Default recruiter job ownership mock
    vi.spyOn(jobService, 'getJobById').mockImplementation(async (userId: string, jobId: string) => {
      if (userId === mockRecruiterUserA && jobId === jobCompanyA.id) return jobCompanyA;
      if (userId === mockRecruiterUserB && jobId === jobCompanyB.id) return jobCompanyB;
      return null; // Not authorized across companies
    });
  });

  describe('1. Chronological History & Remark Logging', () => {
    it('records and returns application status progression in strictly chronological order', async () => {
      // Student A applies to Job A
      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
        coverNote: 'Excited about Kubernetes architecture.',
      });
      expect(submitRes.success).toBe(true);
      const app = submitRes.data!;

      // Recruiter advances stage: applied -> in_review with remarks
      await applicationService.updateRecruiterApplicationStatus(
        mockRecruiterUserA,
        app.id,
        'in_review',
        'Academic credentials verified and forwarded to engineering lead.'
      );

      // Recruiter advances stage: in_review -> shortlisted with remarks
      await applicationService.updateRecruiterApplicationStatus(
        mockRecruiterUserA,
        app.id,
        'shortlisted',
        'Shortlisted for Round 1 Technical Systems Interview.'
      );

      // Recruiter advances stage: shortlisted -> offered with remarks
      await applicationService.updateRecruiterApplicationStatus(
        mockRecruiterUserA,
        app.id,
        'offered',
        'Exceptional performance across technical assessment. Formal offer extended.'
      );

      const historyRes = await applicationService.getStudentApplicationStatusHistory(
        mockStudentUserA,
        app.id
      );

      expect(historyRes.success).toBe(true);
      expect(historyRes.data).toBeDefined();
      const history = historyRes.data!;
      expect(history.length).toBe(4);

      // Verify chronological sequence
      expect(history[0].toStatus).toBe('applied');
      expect(history[0].fromStatus).toBeNull();

      expect(history[1].fromStatus).toBe('applied');
      expect(history[1].toStatus).toBe('in_review');
      expect(history[1].remarks).toContain('Academic credentials verified');

      expect(history[2].fromStatus).toBe('in_review');
      expect(history[2].toStatus).toBe('shortlisted');
      expect(history[2].remarks).toContain('Round 1 Technical Systems Interview');

      expect(history[3].fromStatus).toBe('shortlisted');
      expect(history[3].toStatus).toBe('offered');
      expect(history[3].remarks).toContain('Formal offer extended');

      // Verify timestamps are non-decreasing
      for (let i = 1; i < history.length; i++) {
        const prevTime = new Date(history[i - 1].createdAt).getTime();
        const currTime = new Date(history[i].createdAt).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });

    it('preserves empty remarks gracefully when optional remarks are omitted', async () => {
      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      await applicationService.updateRecruiterApplicationStatus(
        mockRecruiterUserA,
        app.id,
        'in_review'
      );

      const history = await applicationService.getApplicationStatusHistory(app.id);
      expect(history.length).toBe(2);
      expect(history[1].toStatus).toBe('in_review');
      expect(history[1].remarks).toBe('Status changed to in_review');
    });
  });

  describe('2. Student Ownership Isolation', () => {
    it('allows a student to view audit history for their own submitted application', async () => {
      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      const res = await applicationService.getStudentApplicationStatusHistory(
        mockStudentUserA,
        app.id
      );
      expect(res.success).toBe(true);
      expect(res.data?.length).toBeGreaterThanOrEqual(1);
    });

    it('strictly forbids a student from viewing another student candidate application history', async () => {
      // Student A applies
      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      // Student B attempts to query Student A's application history
      const res = await applicationService.getStudentApplicationStatusHistory(
        mockStudentUserB,
        app.id
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized: You can only view status history for your own applications.');
      expect(res.data).toBeUndefined();
    });

    it('rejects history request if student user has no completed academic profile', async () => {
      vi.spyOn(studentService, 'getProfile').mockResolvedValueOnce(null);

      const res = await applicationService.getStudentApplicationStatusHistory(
        'unregistered-user-999',
        'some-app-id'
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe('Student profile not found.');
    });
  });

  describe('3. Recruiter Company Multi-Tenant Isolation', () => {
    it('allows recruiter to view complete audit history for applications to their own company jobs', async () => {
      // Student A applies to Company A job
      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      const res = await applicationService.getRecruiterApplicationStatusHistory(
        mockRecruiterUserA,
        app.id
      );

      expect(res.success).toBe(true);
      expect(res.data?.application.id).toBe(app.id);
      expect(res.data?.history.length).toBeGreaterThanOrEqual(1);
    });

    it('blocks recruiter from Company B from viewing candidate audit history for Company A job', async () => {
      // Student A applies to Company A job
      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      // Recruiter from Company B tries to view candidate audit history
      const res = await applicationService.getRecruiterApplicationStatusHistory(
        mockRecruiterUserB,
        app.id
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized: You do not have permission to view this application audit history.');
      expect(res.data).toBeUndefined();
    });
  });

  describe('4. Invalid Application Access & Empty History Handling', () => {
    it('handles non-existent application ID gracefully for student query', async () => {
      const res = await applicationService.getStudentApplicationStatusHistory(
        mockStudentUserA,
        'non-existent-uuid-999'
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe('Application record not found.');
    });

    it('handles non-existent application ID gracefully for recruiter query', async () => {
      const res = await applicationService.getRecruiterApplicationStatusHistory(
        mockRecruiterUserA,
        'non-existent-uuid-999'
      );

      expect(res.success).toBe(false);
      expect(res.error).toBe('Application record not found.');
    });

    it('handles missing required parameters gracefully', async () => {
      const res1 = await applicationService.getStudentApplicationStatusHistory('', '');
      expect(res1.success).toBe(false);
      expect(res1.error).toBe('User ID and Application ID are required.');

      const res2 = await applicationService.getRecruiterApplicationStatusHistory('', '');
      expect(res2.success).toBe(false);
      expect(res2.error).toBe('User ID and Application ID are required.');
    });

    it('returns empty array when application has no recorded history entries', async () => {
      const emptyHistory = await applicationService.getApplicationStatusHistory('untracked-app-id');
      expect(Array.isArray(emptyHistory)).toBe(true);
      expect(emptyHistory.length).toBe(0);
    });
  });

  describe('5. Status Mapping, Icons, Attribution & Terminal Status Utilities', () => {
    it('maps all six canonical recruitment pipeline statuses to descriptive metadata', () => {
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

        const icon = getStatusIcon(status);
        expect(icon).toBeDefined();
        expect(icon.length).toBeGreaterThan(0);
      }
    });

    it('identifies and formats terminal statuses accurately', () => {
      // Offered is terminal success
      const offeredTerm = getTerminalOutcomeInfo('offered');
      expect(offeredTerm.isTerminal).toBe(true);
      expect(offeredTerm.badgeVariant).toBe('success');
      expect(offeredTerm.title).toContain('Official Placement Offer Extended');

      // Rejected is terminal error
      const rejectedTerm = getTerminalOutcomeInfo('rejected');
      expect(rejectedTerm.isTerminal).toBe(true);
      expect(rejectedTerm.badgeVariant).toBe('error');
      expect(rejectedTerm.title).toContain('Application Concluded');

      // Withdrawn is terminal neutral
      const withdrawnTerm = getTerminalOutcomeInfo('withdrawn');
      expect(withdrawnTerm.isTerminal).toBe(true);
      expect(withdrawnTerm.badgeVariant).toBe('default');
      expect(withdrawnTerm.title).toContain('Application Voluntarily Withdrawn');

      // Non-terminal states
      expect(getTerminalOutcomeInfo('applied').isTerminal).toBe(false);
      expect(getTerminalOutcomeInfo('in_review').isTerminal).toBe(false);
      expect(getTerminalOutcomeInfo('shortlisted').isTerminal).toBe(false);
    });

    it('resolves actor attribution accurately based on transition direction', () => {
      // Initial candidate submission
      const subItem: ApplicationStatusHistoryItem = {
        id: '1',
        applicationId: 'app-1',
        fromStatus: null,
        toStatus: 'applied',
        createdAt: new Date().toISOString(),
      };
      const subAttr = getHistoryAttribution(subItem);
      expect(subAttr.actor).toBe('candidate');
      expect(subAttr.label).toBe('Candidate Submission');

      // Recruiter shortlist transition
      const shortItem: ApplicationStatusHistoryItem = {
        id: '2',
        applicationId: 'app-1',
        fromStatus: 'in_review',
        toStatus: 'shortlisted',
        createdAt: new Date().toISOString(),
      };
      const shortAttr = getHistoryAttribution(shortItem);
      expect(shortAttr.actor).toBe('recruiter');
      expect(shortAttr.label).toBe('Recruiter / Hiring Team');

      // Candidate withdrawal
      const withItem: ApplicationStatusHistoryItem = {
        id: '3',
        applicationId: 'app-1',
        fromStatus: 'applied',
        toStatus: 'withdrawn',
        createdAt: new Date().toISOString(),
      };
      const withAttr = getHistoryAttribution(withItem);
      expect(withAttr.actor).toBe('candidate');
      expect(withAttr.label).toBe('Candidate Withdrawal');
    });

    it('formats user-friendly transition headlines', () => {
      expect(formatTransitionTitle(null, 'applied')).toBe('Application Submitted & Recorded');
      expect(formatTransitionTitle('applied', 'in_review')).toBe('Stage Transition: Applied → In Review');
      expect(formatTransitionTitle('in_review', 'shortlisted')).toBe('Stage Transition: In Review → Shortlisted');
      expect(formatTransitionTitle('shortlisted', 'offered')).toBe('Final Offer Extended (from Shortlisted)');
      expect(formatTransitionTitle('in_review', 'rejected')).toBe('Application Concluded (from In Review)');
      expect(formatTransitionTitle('applied', 'withdrawn')).toBe('Application Withdrawn (from Applied)');
    });
  });

  describe('6. Server Actions Enforcement', () => {
    it('getStudentApplicationHistoryAction enforces student RBAC guard', async () => {
      vi.spyOn(rbacService, 'requireStudent').mockResolvedValueOnce({
        user: { id: mockStudentUserA, email: 'aarav@apex.edu' } as any,
        role: 'student',
      });

      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      const actionRes = await getStudentApplicationHistoryAction(app.id);
      expect(actionRes.success).toBe(true);
      expect(actionRes.data?.length).toBeGreaterThanOrEqual(1);
    });

    it('getRecruiterApplicationHistoryAction enforces company RBAC guard and multi-tenant job ownership', async () => {
      vi.spyOn(rbacService, 'requireCompany').mockResolvedValueOnce({
        user: { id: mockRecruiterUserA, email: 'recruiter@alpha.com' } as any,
        role: 'company',
      });

      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      const actionRes = await getRecruiterApplicationHistoryAction(app.id);
      expect(actionRes.success).toBe(true);
      expect(actionRes.data?.history.length).toBeGreaterThanOrEqual(1);
    });

    it('getRecruiterApplicationHistoryAction rejects recruiter from different company', async () => {
      vi.spyOn(rbacService, 'requireCompany').mockResolvedValueOnce({
        user: { id: mockRecruiterUserB, email: 'recruiter@beta.com' } as any,
        role: 'company',
      });

      const submitRes = await applicationService.submitApplication(mockStudentUserA, {
        jobId: jobCompanyA.id,
      });
      const app = submitRes.data!;

      const actionRes = await getRecruiterApplicationHistoryAction(app.id);
      expect(actionRes.success).toBe(false);
      expect(actionRes.error).toContain('Unauthorized');
    });
  });
});
