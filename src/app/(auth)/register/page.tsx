import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an Account | Smart Placement Portal',
  description: 'Register as a student candidate or company recruiter on the Smart Placement Portal.',
};

export default function RegisterPage() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">Create an Account</CardTitle>
        <CardDescription>
          Get started as a student candidate or hiring recruiter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
