'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { registerAction, type FormState } from '@/features/auth/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="primary"
      size="md"
      className="w-full font-medium"
      isLoading={pending}
    >
      {pending ? 'Creating Account...' : 'Create Account'}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState<FormState | null, FormData>(registerAction, null);
  const [selectedRole, setSelectedRole] = React.useState<'student' | 'company'>('student');

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.message && (
        <div
          role="status"
          className="rounded-md border border-success/20 bg-success-bg p-3 text-xs font-medium text-success flex items-start space-x-2"
        >
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{state.message}</span>
        </div>
      )}

      {state?.error && (
        <div
          role="alert"
          className="rounded-md border border-error/20 bg-error-bg p-3 text-xs font-medium text-error flex items-start space-x-2"
        >
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-text-primary">
          Select Account Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
              selectedRole === 'student'
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-border bg-surface text-text-muted hover:bg-surface-hover'
            }`}
          >
            Student Candidate
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('company')}
            className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
              selectedRole === 'company'
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-border bg-surface text-text-muted hover:bg-surface-hover'
            }`}
          >
            Company Recruiter
          </button>
        </div>
        <input type="hidden" name="role" value={selectedRole} />
        {state?.fieldErrors?.role && (
          <p className="text-xs text-error font-medium">{state.fieldErrors.role}</p>
        )}
      </div>

      <div className="space-y-4">
        <Input
          id="fullName"
          name="fullName"
          type="text"
          label={selectedRole === 'student' ? 'Student Full Name' : 'Recruiter / HR Name'}
          placeholder="e.g. Jane Doe"
          autoComplete="name"
          required
          error={state?.fieldErrors?.fullName}
        />

        <Input
          id="email"
          name="email"
          type="email"
          label={selectedRole === 'student' ? 'University / College Email' : 'Corporate Email'}
          placeholder={selectedRole === 'student' ? 'student@institution.edu' : 'recruiter@company.com'}
          autoComplete="email"
          required
          error={state?.fieldErrors?.email}
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password (min 8 characters)"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          error={state?.fieldErrors?.password}
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          error={state?.fieldErrors?.confirmPassword}
        />
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-text-muted">
          Already registered?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Sign in to your account
          </Link>
        </p>
      </div>
    </form>
  );
}
