import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { rbacService } from '@/services/rbac.service';
import { logoutAction } from '@/features/auth/actions';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { USER_ROLES, ROLE_HOME_ROUTES } from '@/lib/auth/roles';

export default async function Home() {
  const user = await authService.getCurrentUser();
  const role = user ? await rbacService.getUserRole(user) : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 bg-background">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant={user ? 'success' : 'info'}>
            {user ? 'Active Session' : 'Institutional Placement Network'}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Smart Placement Portal
          </h1>
          <p className="text-sm text-text-muted">
            Next.js App Router, TypeScript & Supabase RBAC
          </p>
        </div>

        {user ? (
          /* Authenticated User Landing with Role-Aware Navigation */
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Authorized Session</CardTitle>
                {role && (
                  <Badge
                    variant={role === USER_ROLES.ADMIN ? 'warning' : 'default'}
                    className="capitalize text-xs font-mono"
                  >
                    {role}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Server-side identity and role clearance verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-surface-hover/60 border border-border p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">User Account:</span>
                  <span className="font-medium text-text-primary font-mono text-xs">{user.email}</span>
                </div>
                {user.user_metadata?.full_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Full Name:</span>
                    <span className="font-medium text-text-primary">{user.user_metadata.full_name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Authoritative Role:</span>
                  <span className="font-semibold text-text-primary uppercase text-xs">
                    {role || 'Pending Assignment'}
                  </span>
                </div>
              </div>

              {/* Minimal Role-Aware Primary Navigation */}
              {role && (
                <div className="pt-1">
                  <Link href={ROLE_HOME_ROUTES[role]} className="w-full block">
                    <Button variant="primary" size="md" className="w-full">
                      Enter {role.charAt(0).toUpperCase() + role.slice(1)} Area →
                    </Button>
                  </Link>
                </div>
              )}

              {/* Security Boundary Verification Navigation */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-text-muted mb-2">
                  Role Boundary Verification (Server-Side Enforced):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Link href="/student" className="text-center">
                    <Button
                      variant={role === USER_ROLES.STUDENT ? 'outline' : 'ghost'}
                      size="sm"
                      className="w-full text-xs"
                    >
                      /student
                    </Button>
                  </Link>
                  <Link href="/company" className="text-center">
                    <Button
                      variant={role === USER_ROLES.COMPANY ? 'outline' : 'ghost'}
                      size="sm"
                      className="w-full text-xs"
                    >
                      /company
                    </Button>
                  </Link>
                  <Link href="/admin" className="text-center">
                    <Button
                      variant={role === USER_ROLES.ADMIN ? 'outline' : 'ghost'}
                      size="sm"
                      className="w-full text-xs"
                    >
                      /admin
                    </Button>
                  </Link>
                </div>
              </div>

              <form action={logoutAction} className="pt-2">
                <Button variant="outline" size="md" type="submit" className="w-full">
                  Sign Out
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Public Unauthenticated Gateway */
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Welcome to the Portal</CardTitle>
              <CardDescription>
                Please sign in to access your recruitment drives, applications, and placement metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link href="/login" className="w-full">
                  <Button variant="primary" size="md" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button variant="outline" size="md" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-text-muted mb-2 text-center">
                  Protected Areas (Requires Authentication):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Link href="/student" className="text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      /student
                    </Button>
                  </Link>
                  <Link href="/company" className="text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      /company
                    </Button>
                  </Link>
                  <Link href="/admin" className="text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      /admin
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
