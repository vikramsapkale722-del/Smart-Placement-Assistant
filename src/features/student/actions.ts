'use server';

import { revalidatePath } from 'next/cache';
import { rbacService } from '@/services/rbac.service';
import { studentService } from '@/services/student.service';
import type { CompleteStudentProfile } from '@/features/student/types';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Fetches the authenticated student's profile.
 * Enforces student role authorization.
 */
export async function getStudentProfileAction(): Promise<ActionResponse<CompleteStudentProfile | null>> {
  try {
    const { user } = await rbacService.requireStudent();
    const profile = await studentService.getProfile(user.id);
    return { success: true, data: profile };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve student profile';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Saves or updates the student's profile.
 * Enforces student role authorization and server-verified user ID.
 */
export async function saveStudentProfileAction(
  rawInput: unknown
): Promise<ActionResponse<CompleteStudentProfile>> {
  try {
    // 1. Authoritative Server-Side Role and Session Assertion
    const { user } = await rbacService.requireStudent();

    // 2. Perform authoritative upsert via Student Service
    const result = await studentService.upsertProfile(user.id, user.email || '', rawInput);

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Could not update student profile' };
    }

    revalidatePath('/student/profile');
    revalidatePath('/student');

    return { success: true, data: result.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error occurred during profile update';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Uploads and updates the student's profile photo.
 */
export async function uploadProfilePhotoAction(
  formData: FormData
): Promise<ActionResponse<string>> {
  try {
    const { user } = await rbacService.requireStudent();
    const file = formData.get('photo') as File | null;

    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No photo file provided' };
    }

    const buffer = await file.arrayBuffer();
    const result = await studentService.uploadProfilePhoto(user.id, {
      name: file.name,
      size: file.size,
      type: file.type,
      buffer,
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to upload photo' };
    }

    revalidatePath('/student/profile');
    return { success: true, data: result.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Photo upload error';
    return { success: false, error: msg };
  }
}
