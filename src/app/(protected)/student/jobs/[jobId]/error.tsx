'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StudentJobDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Student job detail view error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <Card className="max-w-md w-full border border-error/30 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-error font-semibold text-sm">
            <span>⚠️</span>
            <span>Unable to Load Job Opening</span>
          </div>
          <CardTitle className="text-base font-bold">Placement Drive Detail Error</CardTitle>
          <CardDescription className="text-xs">
            The requested placement drive could not be loaded or is no longer published.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-text-secondary bg-surface-hover p-3 rounded-md font-mono">
            {error.message || 'An unexpected error occurred while loading this job posting.'}
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/student/jobs">
              <Button variant="outline" size="sm" className="text-xs">
                Back to Openings
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => reset()} className="text-xs">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
