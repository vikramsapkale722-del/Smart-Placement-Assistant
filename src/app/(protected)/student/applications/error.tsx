'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function StudentApplicationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Student applications retrieval error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-10 flex items-center justify-center">
      <Card className="max-w-md w-full border border-error/30 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-error font-semibold text-sm">
            <span>⚠️</span>
            <span>Unable to Load Applications</span>
          </div>
          <CardTitle className="text-base font-bold">Application Tracking Error</CardTitle>
          <CardDescription className="text-xs">
            We encountered a temporary issue retrieving your submitted placement drive applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-text-secondary bg-surface-hover p-3 rounded-md leading-relaxed">
            Please verify your network connection or try refreshing the view. Your underlying application records remain securely recorded.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/student">
              <Button variant="outline" size="sm" className="text-xs">
                Student Dashboard
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
