'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CompanyDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log sanitized error indicator without exposing secrets
    console.error('Company Dashboard encountered an error:', error.message);
  }, [error]);

  return (
    <main
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      role="alert"
    >
      <Card className="max-w-md w-full border-border text-center shadow-md">
        <CardHeader className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-error-bg border border-error/20 flex items-center justify-center mx-auto text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <CardTitle className="text-xl font-bold text-text-primary">
            Unable to Load Company Dashboard
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            A temporary issue occurred while loading your corporate workspace. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="primary" size="md" onClick={() => reset()} className="flex-1">
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" size="md" className="w-full">
                Portal Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
