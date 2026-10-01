import type { CompleteStudentProfile } from '@/features/student/types';
import type { JobPosting } from '@/features/jobs/types';

export interface EligibilityCriterionResult {
  passed: boolean;
  required: string | number;
  actual: string | number;
  message: string;
}

export interface JobEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  criteria: {
    cgpa: EligibilityCriterionResult;
    backlogs: EligibilityCriterionResult;
    department: EligibilityCriterionResult;
    batchYear: EligibilityCriterionResult;
  };
}

/**
 * Evaluates whether a student candidate meets all academic, departmental,
 * and cohort eligibility gates for a specific job posting.
 */
export function evaluateJobEligibility(
  student: CompleteStudentProfile | null | undefined,
  job: JobPosting
): JobEligibilityResult {
  // If student profile is missing, candidate cannot be verified
  if (!student) {
    return {
      isEligible: false,
      reasons: ['Complete your student academic profile to calculate placement eligibility.'],
      criteria: {
        cgpa: {
          passed: false,
          required: job.minCgpa,
          actual: 'N/A',
          message: `Minimum ${job.minCgpa.toFixed(2)} CGPA required`,
        },
        backlogs: {
          passed: false,
          required: job.maxActiveBacklogs,
          actual: 'N/A',
          message: `Maximum ${job.maxActiveBacklogs} active backlog(s) allowed`,
        },
        department: {
          passed: false,
          required: job.allowedDepartments.length > 0 ? job.allowedDepartments.join(', ') : 'All Branches',
          actual: 'N/A',
          message: 'Department not on file',
        },
        batchYear: {
          passed: false,
          required: job.eligibleBatchYears.length > 0 ? job.eligibleBatchYears.join(', ') : 'All Batches',
          actual: 'N/A',
          message: 'Graduation batch not on file',
        },
      },
    };
  }

  const reasons: string[] = [];

  // 1. CGPA Criterion
  const studentCgpa = Number(student.cgpa) || 0;
  const minRequiredCgpa = Number(job.minCgpa) || 0;
  const cgpaPassed = studentCgpa >= minRequiredCgpa;
  if (!cgpaPassed) {
    reasons.push(
      `CGPA requirement not met (Required: ${minRequiredCgpa.toFixed(2)}, Current: ${studentCgpa.toFixed(2)})`
    );
  }

  // 2. Active Backlogs Criterion
  const studentBacklogs = Number(student.activeBacklogs) || 0;
  const maxAllowedBacklogs = Number(job.maxActiveBacklogs) ?? 0;
  const backlogsPassed = studentBacklogs <= maxAllowedBacklogs;
  if (!backlogsPassed) {
    reasons.push(
      `Backlog limit exceeded (Allowed: ${maxAllowedBacklogs}, Current active: ${studentBacklogs})`
    );
  }

  // 3. Department / Branch Criterion
  const allowedDepts = job.allowedDepartments || [];
  let departmentPassed = true;
  if (allowedDepts.length > 0) {
    if (!student.department) {
      departmentPassed = false;
      reasons.push('Branch requirement not met (Student department is missing)');
    } else {
      const normalizedStudentDept = student.department.trim().toLowerCase();
      departmentPassed = allowedDepts.some(
        (dept) => dept.trim().toLowerCase() === normalizedStudentDept
      );
      if (!departmentPassed) {
        reasons.push(
          `Branch not eligible (Allowed: ${allowedDepts.join(', ')}, Current: ${student.department})`
        );
      }
    }
  }

  // 4. Batch Year Criterion
  const eligibleBatches = job.eligibleBatchYears || [];
  let batchPassed = true;
  if (eligibleBatches.length > 0) {
    const studentBatch = Number(student.batchYear);
    batchPassed = eligibleBatches.includes(studentBatch);
    if (!batchPassed) {
      reasons.push(
        `Graduation batch not eligible (Allowed: ${eligibleBatches.join(', ')}, Current: ${student.batchYear})`
      );
    }
  }

  const isEligible = cgpaPassed && backlogsPassed && departmentPassed && batchPassed;

  return {
    isEligible,
    reasons,
    criteria: {
      cgpa: {
        passed: cgpaPassed,
        required: minRequiredCgpa,
        actual: studentCgpa,
        message: cgpaPassed
          ? `CGPA meets requirement (${studentCgpa.toFixed(2)} ≥ ${minRequiredCgpa.toFixed(2)})`
          : `Requires minimum ${minRequiredCgpa.toFixed(2)} CGPA (Current: ${studentCgpa.toFixed(2)})`,
      },
      backlogs: {
        passed: backlogsPassed,
        required: maxAllowedBacklogs,
        actual: studentBacklogs,
        message: backlogsPassed
          ? `Backlogs within limit (${studentBacklogs} ≤ ${maxAllowedBacklogs})`
          : `Exceeds max allowed backlogs (${studentBacklogs} active > ${maxAllowedBacklogs} max)`,
      },
      department: {
        passed: departmentPassed,
        required: allowedDepts.length > 0 ? allowedDepts.join(', ') : 'All Branches Allowed',
        actual: student.department || 'Not specified',
        message: departmentPassed
          ? allowedDepts.length > 0
            ? `Branch is eligible (${student.department})`
            : 'Open to all departments'
          : `Branch not eligible (${student.department})`,
      },
      batchYear: {
        passed: batchPassed,
        required: eligibleBatches.length > 0 ? eligibleBatches.join(', ') : 'All Batches Allowed',
        actual: student.batchYear || 'Not specified',
        message: batchPassed
          ? eligibleBatches.length > 0
            ? `Graduation class of ${student.batchYear} is eligible`
            : 'Open to all graduation batches'
          : `Class of ${student.batchYear} is not in eligible batches (${eligibleBatches.join(', ')})`,
      },
    },
  };
}

export const eligibilityService = {
  evaluateJobEligibility,
};
