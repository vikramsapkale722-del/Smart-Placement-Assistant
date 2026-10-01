import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/features/auth/actions';

export const metadata = {
  title: 'Access Restricted | Smart Placement Portal',
  description: 'Authorization error: You do not have permission to view the requested portal resource.',
};

export default function UnauthorizedPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6 bg-background"
      role="main"
    >
      <div className="w-full max-w-md space-y-6" role="alert" aria-live="assertive">
        <Card className="border-border shadow-md text-center">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="w-12 h-12 rounded-full bg-error-bg/80 border border-error/20 flex items-center justify-center mb-4 text-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-6 h-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <Badge variant="error" className="mb-2">
              403 • Access Denied
            </Badge>
            <CardTitle className="text-xl font-bold tracking-tight text-text-primary">
              Authorization Required
            </CardTitle>
            <CardDescription className="text-sm text-text-secondary mt-1">
              Your account does not possess the required clearance level to access this specific portal resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="rounded-lg bg-surface-hover/60 border border-border p-3 text-xs text-text-muted leading-relaxed">
              If your assigned institutional role has recently changed or you believe this restriction is in error,
              please contact your campus Placement Cell administrator.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/" className="flex-1">
                <Button variant="primary" size="md" className="w-full">
                  Portal Home
                </Button>
              </Link>
              <form action={logoutAction} className="flex-1">
                <Button variant="outline" size="md" type="submit" className="w-full">
                  Switch Account
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
