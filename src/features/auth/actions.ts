'use server';

import { redirect } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { loginSchema, registerSchema } from '@/features/auth/schemas';

export interface FormState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
}

/**
 * Server Action for User Login.
 */
export async function loginAction(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    validation.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors,
    };
  }

  const result = await authService.signIn(validation.data);

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Authentication failed. Please try again.',
    };
  }

  // Redirect to home/dashboard
  redirect('/');
}

/**
 * Server Action for User Registration.
 */
export async function registerAction(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const rawData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    role: formData.get('role') || 'student',
  };

  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    validation.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors,
    };
  }

  const result = await authService.signUp(validation.data);

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Registration failed. Please try again.',
    };
  }

  if (result.data?.requiresEmailConfirmation) {
    return {
      success: true,
      message: 'Account created! Please check your email inbox to confirm your registration before signing in.',
    };
  }

  // If auto-logged in, redirect to home
  redirect('/');
}

/**
 * Server Action for Logging Out.
 */
export async function logoutAction(): Promise<void> {
  await authService.signOut();
  redirect('/login');
}
