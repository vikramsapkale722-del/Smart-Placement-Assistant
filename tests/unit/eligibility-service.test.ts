import { describe, it, expect } from 'vitest';
import { evaluateJobEligibility } from '@/services/eligibility.service';
import type { CompleteStudentProfile } from '@/features/student/types';
import type { JobPosting } from '@/features/jobs/types';

describe('Eligibility Service Unit Tests (TASK-011)', () => {
  const baseJob: JobPosting = {
    id: 'test-job-1',
    companyId: 'company-1',
    title: 'Software Development Engineer',
    description: 'Core backend microservices and distributed database engineering.',
    employmentType: 'full_time',
    location: 'Bengaluru',
    workplaceType: 'hybrid',
    minCgpa: 7.5,
    allowedDepartments: ['Computer Science and Engineering', 'Information Technology'],
    maxActiveBacklogs: 0,
    eligibleBatchYears: [2025, 2026],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'published',
    isApprovedByAdmin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const eligibleStudent: CompleteStudentProfile = {
    userId: 'student-user-1',
    fullName: 'Aditya Sharma',
    email: 'aditya@university.edu',
    collegeName: 'National Institute of Technology',
    degree: 'B.Tech',
    rollNumber: 'CS2022001',
    department: 'Computer Science and Engineering',
    batchYear: 2026,
    cgpa: 8.4,
    activeBacklogs: 0,
    totalBacklogsCleared: 0,
    isAcademicallyVerified: true,
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  };

  it('declares fully eligible when all academic and cohort gates are satisfied', () => {
    const res = evaluateJobEligibility(eligibleStudent, baseJob);
    expect(res.isEligible).toBe(true);
    expect(res.reasons).toHaveLength(0);
    expect(res.criteria.cgpa.passed).toBe(true);
    expect(res.criteria.backlogs.passed).toBe(true);
    expect(res.criteria.department.passed).toBe(true);
    expect(res.criteria.batchYear.passed).toBe(true);
  });

  it('fails eligibility when student CGPA is below the minimum threshold', () => {
    const studentWithLowCgpa: CompleteStudentProfile = {
      ...eligibleStudent,
      cgpa: 7.1,
    };

    const res = evaluateJobEligibility(studentWithLowCgpa, baseJob);
    expect(res.isEligible).toBe(false);
    expect(res.criteria.cgpa.passed).toBe(false);
    expect(res.reasons.some((r) => r.toLowerCase().includes('cgpa'))).toBe(true);
    // Other criteria remain passed
    expect(res.criteria.backlogs.passed).toBe(true);
    expect(res.criteria.department.passed).toBe(true);
    expect(res.criteria.batchYear.passed).toBe(true);
  });

  it('fails eligibility when active backlogs exceed maximum allowed', () => {
    const studentWithBacklogs: CompleteStudentProfile = {
      ...eligibleStudent,
      activeBacklogs: 1,
    };

    const res = evaluateJobEligibility(studentWithBacklogs, baseJob);
    expect(res.isEligible).toBe(false);
    expect(res.criteria.backlogs.passed).toBe(false);
    expect(res.reasons.some((r) => r.toLowerCase().includes('backlog'))).toBe(true);
  });

  it('fails eligibility when department is not in allowed departments list', () => {
    const mechanicalStudent: CompleteStudentProfile = {
      ...eligibleStudent,
      department: 'Mechanical Engineering',
    };

    const res = evaluateJobEligibility(mechanicalStudent, baseJob);
    expect(res.isEligible).toBe(false);
    expect(res.criteria.department.passed).toBe(false);
    expect(res.reasons.some((r) => r.toLowerCase().includes('branch') || r.toLowerCase().includes('department'))).toBe(true);
  });

  it('passes department check when job allowedDepartments is empty (open to all)', () => {
    const openJob: JobPosting = {
      ...baseJob,
      allowedDepartments: [],
    };
    const mechanicalStudent: CompleteStudentProfile = {
      ...eligibleStudent,
      department: 'Civil Engineering',
    };

    const res = evaluateJobEligibility(mechanicalStudent, openJob);
    expect(res.criteria.department.passed).toBe(true);
    expect(res.isEligible).toBe(true);
  });

  it('fails eligibility when student graduation batch is not in eligible batches', () => {
    const student2024: CompleteStudentProfile = {
      ...eligibleStudent,
      batchYear: 2024,
    };

    const res = evaluateJobEligibility(student2024, baseJob);
    expect(res.isEligible).toBe(false);
    expect(res.criteria.batchYear.passed).toBe(false);
    expect(res.reasons.some((r) => r.toLowerCase().includes('batch'))).toBe(true);
  });

  it('passes batch year check when job eligibleBatchYears is empty (open to all batches)', () => {
    const openBatchJob: JobPosting = {
      ...baseJob,
      eligibleBatchYears: [],
    };
    const student2028: CompleteStudentProfile = {
      ...eligibleStudent,
      batchYear: 2028,
    };

    const res = evaluateJobEligibility(student2028, openBatchJob);
    expect(res.criteria.batchYear.passed).toBe(true);
    expect(res.isEligible).toBe(true);
  });

  it('accumulates multiple failure reasons when several criteria are breached simultaneously', () => {
    const multiFailStudent: CompleteStudentProfile = {
      ...eligibleStudent,
      cgpa: 5.5,
      activeBacklogs: 2,
      department: 'Chemical Engineering',
      batchYear: 2023,
    };

    const res = evaluateJobEligibility(multiFailStudent, baseJob);
    expect(res.isEligible).toBe(false);
    expect(res.reasons.length).toBe(4);
    expect(res.criteria.cgpa.passed).toBe(false);
    expect(res.criteria.backlogs.passed).toBe(false);
    expect(res.criteria.department.passed).toBe(false);
    expect(res.criteria.batchYear.passed).toBe(false);
  });

  it('returns ineligible with guidance message when student profile is null/undefined', () => {
    const res = evaluateJobEligibility(null, baseJob);
    expect(res.isEligible).toBe(false);
    expect(res.reasons[0]).toMatch(/complete your student academic profile/i);
    expect(res.criteria.cgpa.passed).toBe(false);
  });
});
