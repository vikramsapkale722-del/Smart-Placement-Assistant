'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type FormState } from '@/features/auth/actions';
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
      {pending ? 'Signing in...' : 'Sign In'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState<FormState | null, FormData>(loginAction, null);

  return (
    <form action={formAction} className="space-y-4" noValidate>
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

      <div className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="College / Corporate Email"
          placeholder="name@institution.edu"
          autoComplete="email"
          required
          error={state?.fieldErrors?.email}
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={state?.fieldErrors?.password}
        />
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-text-muted">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </form>
  );
}
