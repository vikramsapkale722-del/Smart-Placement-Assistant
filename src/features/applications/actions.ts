'use server';

import { revalidatePath } from 'next/cache';
import { rbacService } from '@/services/rbac.service';
import { applicationService } from '@/services/application.service';
import {
  submitApplicationSchema,
  updateApplicationStatusSchema,
} from '@/features/applications/schemas';
import type {
  JobApplication,
  ApplicationStatusHistoryItem,
} from '@/features/applications/types';

export interface ActionState<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Submits a candidate job application.
 * Authoritatively verifies student session identity, re-evaluates eligibility,
 * prevents duplicates, and records the application atomically.
 */
export async function submitApplicationAction(
  rawInput: unknown
): Promise<ActionState<JobApplication>> {
  try {
    // 1. Authoritative Student RBAC Guard
    const { user } = await rbacService.requireStudent();

    // 2. Delegate to Service Layer (Derives student identity from server session)
    const result = await applicationService.submitApplication(user.id, rawInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to submit application. Please try again.',
      };
    }

    // 3. Selective Cache Revalidation
    if (result.data?.jobId) {
      revalidatePath(`/student/jobs/${result.data.jobId}`);
    }
    revalidatePath('/student/jobs');

    return {
      success: true,
      data: result.data,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Server error occurred during application submission.';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Checks if the current authenticated student candidate has already applied.
 */
export async function checkHasAppliedAction(jobId: string): Promise<boolean> {
  try {
    const { user } = await rbacService.requireStudent();
    return await applicationService.hasApplied(user.id, jobId);
  } catch {
    return false;
  }
}

/**
 * Server Action: Recruiter updates application status and adds optional audit remarks.
 * Enforces server-side company authorization and job ownership before persisting.
 */
export async function updateRecruiterApplicationStatusAction(
  rawInput: unknown
): Promise<ActionState<JobApplication>> {
  try {
    // 1. Authoritative Recruiter/Company RBAC Guard
    const { user } = await rbacService.requireCompany();

    // 2. Schema validation
    const parsed = updateApplicationStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid status update payload',
      };
    }

    const { applicationId, newStatus, remarks } = parsed.data;

    // 3. Delegate to Service Layer (Derives recruiter identity & verifies job ownership server-side)
    const result = await applicationService.updateRecruiterApplicationStatus(
      user.id,
      applicationId,
      newStatus,
      remarks || undefined
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to update application status.',
      };
    }

    // 4. Selective Cache Revalidation
    if (result.data?.jobId) {
      revalidatePath(`/company/jobs/${result.data.jobId}/applicants`);
    }
    revalidatePath('/student/applications');

    return {
      success: true,
      data: result.data,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Server error occurred during status update.';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Fetches chronological status history for a student's own application.
 * Verifies student role and ownership identity server-side.
 */
export async function getStudentApplicationHistoryAction(
  applicationId: string
): Promise<ActionState<ApplicationStatusHistoryItem[]>> {
  try {
    const { user } = await rbacService.requireStudent();
    const result = await applicationService.getStudentApplicationStatusHistory(
      user.id,
      applicationId
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to retrieve application status history.',
      };
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Server error occurred while fetching status history.';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Fetches complete audit history for a candidate application for recruiters.
 * Verifies company recruiter role and multi-tenant job ownership server-side.
 */
export async function getRecruiterApplicationHistoryAction(
  applicationId: string
): Promise<ActionState<{ application: JobApplication; history: ApplicationStatusHistoryItem[] }>> {
  try {
    const { user } = await rbacService.requireCompany();
    const result = await applicationService.getRecruiterApplicationStatusHistory(
      user.id,
      applicationId
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to retrieve applicant audit history.',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Server error occurred while fetching audit history.';
    return {
      success: false,
      error: message,
    };
  }
}
