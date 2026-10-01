import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | Smart Placement Portal',
  description: 'Sign in to access your placement dashboard, track applications, or manage recruitment drives.',
};

export default function LoginPage() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Enter your university or recruiter credentials to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
