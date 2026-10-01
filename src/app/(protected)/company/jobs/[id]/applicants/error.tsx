'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface CompanyJobApplicantsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CompanyJobApplicantsError({
  reset,
}: CompanyJobApplicantsErrorProps) {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <Card className="border-border shadow-md max-w-md w-full text-center">
        <CardContent className="py-12 px-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-error-bg/60 border border-error/30 mx-auto flex items-center justify-center text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-text-primary">
              Unable to Load Applicant Board
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              We encountered an issue retrieving the candidate roster for this placement drive. Please try again or return to your company jobs dashboard.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              id="try-again-btn"
              variant="primary"
              size="sm"
              onClick={() => reset()}
            >
              Try Again
            </Button>
            <Link href="/company/jobs">
              <Button
                id="back-to-company-jobs-btn"
                variant="outline"
                size="sm"
              >
                Back to Company Jobs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
