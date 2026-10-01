import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background px-4 py-8 md:py-12">
      <header className="flex justify-center items-center">
        <Link href="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-xs">
            SP
          </div>
          <span className="text-base font-bold tracking-tight text-text-primary group-hover:text-primary transition-colors">
            Smart Placement Portal
          </span>
        </Link>
      </header>

      <main className="flex justify-center items-center my-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="text-center space-y-2">
        <div className="flex justify-center space-x-2">
          <Badge variant="default" className="text-[10px]">
            Institutional Placement Network
          </Badge>
        </div>
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Smart Placement Portal. Secure Institutional Access.
        </p>
      </footer>
    </div>
  );
}
