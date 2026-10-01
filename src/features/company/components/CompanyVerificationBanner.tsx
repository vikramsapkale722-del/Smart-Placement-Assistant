import * as React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface CompanyVerificationBannerProps {
  isVerified: boolean;
  verifiedAt?: string | null;
  className?: string;
}

export function CompanyVerificationBanner({
  isVerified,
  verifiedAt,
  className = '',
}: CompanyVerificationBannerProps) {
  const formattedDate = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  if (isVerified) {
    return (
      <Card
        className={`border-success/30 bg-success-bg/30 overflow-hidden shadow-sm ${className}`}
        role="status"
        aria-label="Company Verification Status: Verified"
      >
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-success/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center font-bold text-base">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  Verified Enterprise Hiring Partner
                </h3>
                <p className="text-xs text-text-secondary">
                  Institutional verification approved by university placement administrators.
                  {formattedDate && ` (Active since ${formattedDate})`}
                </p>
              </div>
            </div>
            <Badge variant="success" className="px-3 py-1 font-semibold text-xs">
              ✓ Verified Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-success/20">
              <span className="text-success font-bold">✓</span>
              <span className="text-text-primary font-medium">Campus Placement Drives Enabled</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-success/20">
              <span className="text-success font-bold">✓</span>
              <span className="text-text-primary font-medium">Full Candidate Pool Access</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-success/20">
              <span className="text-success font-bold">✓</span>
              <span className="text-text-primary font-medium">Official Employer Trust Badge</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-warning/40 bg-warning-bg/40 overflow-hidden shadow-sm ${className}`}
      role="status"
      aria-label="Company Verification Status: Verification Pending"
    >
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warning/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-warning/15 text-warning flex items-center justify-center font-bold text-base">
              ⏳
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                Organization Verification in Progress
              </h3>
              <p className="text-xs text-text-secondary">
                Your profile is awaiting review by campus placement administrators.
              </p>
            </div>
          </div>
          <Badge variant="warning" className="px-3 py-1 font-semibold text-xs">
            ⏳ Review Pending
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-border">
            <span className="text-warning font-bold">🔒</span>
            <span className="text-text-secondary">
              Campus Drives <span className="text-text-muted">(Locked)</span>
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-border">
            <span className="text-warning font-bold">🔒</span>
            <span className="text-text-secondary">
              Job Postings <span className="text-text-muted">(Locked)</span>
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface/80 border border-border">
            <span className="text-success font-bold">✓</span>
            <span className="text-text-primary font-medium">Profile Configuration Active</span>
          </div>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text-secondary">Verification Note:</span> Administrative
          audits typically complete within 1–2 business days. To avoid delays, ensure your official
          corporate website and recruiter email domain match your organization credentials.
        </p>
      </CardContent>
    </Card>
  );
}
