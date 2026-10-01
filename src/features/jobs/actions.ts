'use server';

import { revalidatePath } from 'next/cache';
import { rbacService } from '@/services/rbac.service';
import { jobService } from '@/services/job.service';
import type { JobStatus } from '@/features/jobs/types';

export interface ActionState<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Creates a new job posting for the authenticated recruiter's organization.
 */
export async function createJobAction(rawInput: unknown): Promise<ActionState> {
  try {
    const { user } = await rbacService.requireCompany();
    const result = await jobService.createJob(user.id, rawInput);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to create job posting' };
    }

    revalidatePath('/company/jobs');
    revalidatePath('/company');
    return { success: true, data: result.data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error creating job posting';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates an existing job posting.
 */
export async function updateJobAction(jobId: string, rawInput: unknown): Promise<ActionState> {
  try {
    const { user } = await rbacService.requireCompany();
    const result = await jobService.updateJob(user.id, jobId, rawInput);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to update job posting' };
    }

    revalidatePath('/company/jobs');
    revalidatePath('/company');
    return { success: true, data: result.data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error updating job posting';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates job publication status.
 */
export async function updateJobStatusAction(
  jobId: string,
  newStatus: JobStatus
): Promise<ActionState> {
  try {
    const { user } = await rbacService.requireCompany();
    const result = await jobService.updateJobStatus(user.id, jobId, newStatus);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to update job status' };
    }

    revalidatePath('/company/jobs');
    revalidatePath('/company');
    return { success: true, data: result.data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error updating status';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Deletes a draft job posting.
 */
export async function deleteJobAction(jobId: string): Promise<ActionState> {
  try {
    const { user } = await rbacService.requireCompany();
    const result = await jobService.deleteJob(user.id, jobId);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to delete job posting' };
    }

    revalidatePath('/company/jobs');
    revalidatePath('/company');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error deleting job';
    return { success: false, error: message };
  }
}
