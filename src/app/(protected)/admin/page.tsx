import Link from 'next/link';
import { rbacService } from '@/services/rbac.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/features/auth/actions';

export const metadata = {
  title: 'Admin Control Center | Smart Placement Portal',
  description: 'Verified administrative access boundary.',
};

export default async function AdminPage() {
  // Authoritative server-side RBAC enforcement
  const { user, role } = await rbacService.requireAdmin();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="warning">Highest Privilege</Badge>
              <span className="text-xs font-mono font-medium text-warning uppercase">
                {role}
              </span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-text-primary">
              Admin Control Center
            </CardTitle>
            <CardDescription className="text-sm text-text-secondary">
              Authoritative server-side verification confirmed. This area is strictly reserved for portal administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-surface-hover/60 border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Administrator:</span>
                <span className="font-medium text-text-primary font-mono text-xs">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Security Clearance:</span>
                <span className="text-warning font-semibold text-xs">SUPERADMIN (VERIFIED)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-text-primary">Corporate Verifications</span>
                <Badge variant="default">TASK-008</Badge>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Review, verify, and authorize registered corporate hiring partner profiles for campus placement drives.
              </p>
              <div className="pt-1">
                <Link href="/admin/companies">
                  <Button variant="primary" size="md" className="w-full">
                    Open Verification Queue →
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" size="md" className="w-full">
                  Portal Home
                </Button>
              </Link>
              <form action={logoutAction} className="flex-1">
                <Button variant="ghost" size="md" type="submit" className="w-full">
                  Sign Out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
