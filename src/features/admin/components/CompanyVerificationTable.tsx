'use client';

import * as React from 'react';
import Link from 'next/link';
import type { CompanyProfile } from '@/features/company/types';
import type { VerificationFilter } from '@/features/admin/types';
import { verifyCompanyAction, revokeCompanyVerificationAction } from '@/features/admin/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CompanyVerificationTableProps {
  initialCompanies: CompanyProfile[];
}

export function CompanyVerificationTable({ initialCompanies }: CompanyVerificationTableProps) {
  const [companies, setCompanies] = React.useState<CompanyProfile[]>(initialCompanies);
  const [activeFilter, setActiveFilter] = React.useState<VerificationFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state if initialCompanies changes
  React.useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies]);

  // Compute counts
  const pendingCount = companies.filter((c) => !c.isVerified).length;
  const verifiedCount = companies.filter((c) => c.isVerified).length;

  // Filtered list
  const filteredCompanies = companies.filter((c) => {
    // Status filter
    if (activeFilter === 'pending' && c.isVerified) return false;
    if (activeFilter === 'verified' && !c.isVerified) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchIndustry = c.industry.toLowerCase().includes(q);
      const matchLocation = (c.location || '').toLowerCase().includes(q);
      const matchEmail = (c.companyEmail || '').toLowerCase().includes(q);
      return matchName || matchIndustry || matchLocation || matchEmail;
    }

    return true;
  });

  // Handle Verify Action
  const handleVerify = async (companyId: string, companyName: string) => {
    setActionLoadingId(companyId);
    setFeedback(null);

    const res = await verifyCompanyAction(companyId);
    setActionLoadingId(null);

    if (res.success && res.data) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, isVerified: true, verifiedAt: new Date().toISOString() } : c))
      );
      setFeedback({
        type: 'success',
        message: `Successfully verified "${companyName}". Placement drives and candidate access are now enabled.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || `Failed to verify "${companyName}". Please try again.`,
      });
    }
  };

  // Handle Revoke Action
  const handleRevoke = async (companyId: string, companyName: string) => {
    setActionLoadingId(companyId);
    setFeedback(null);

    const res = await revokeCompanyVerificationAction(companyId);
    setActionLoadingId(null);

    if (res.success && res.data) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, isVerified: false, verifiedAt: null } : c))
      );
      setFeedback({
        type: 'success',
        message: `Verification revoked for "${companyName}". Placement drive permissions suspended.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || `Failed to revoke verification for "${companyName}".`,
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Admin Control Center
            </Link>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-xs text-text-muted">Enterprise Verifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Company Verification Queue
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Audit and approve corporate employer credentials to authorize campus placement drives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning" className="px-3 py-1 font-semibold text-xs">
            {pendingCount} Pending Review
          </Badge>
          <Badge variant="success" className="px-3 py-1 font-semibold text-xs">
            {verifiedCount} Verified
          </Badge>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm flex items-start justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 border border-border p-1 rounded-xl bg-surface">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All Organizations ({companies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'pending'
                ? 'bg-warning text-warning-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'verified'
                ? 'bg-success text-success-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Verified Active ({verifiedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Search by company or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
            aria-label="Search companies"
          />
        </div>
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <Card className="border-border text-center py-12 px-6">
          <div className="max-w-sm mx-auto space-y-3">
            <div className="text-3xl">🏢</div>
            <h3 className="text-base font-bold text-text-primary">No organizations found</h3>
            <p className="text-xs text-text-secondary">
              {searchQuery
                ? 'No registered companies match your search criteria. Try a different keyword.'
                : activeFilter === 'pending'
                ? 'All submitted company profiles have been reviewed. No pending verifications.'
                : 'No registered company accounts recorded yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCompanies.map((company) => {
            const isLoading = actionLoadingId === company.id;

            return (
              <Card
                key={company.id || company.name}
                className="border-border hover:border-border/80 transition-colors shadow-sm overflow-hidden"
              >
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left: Organization Identity */}
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-surface-hover border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {company.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={company.logoUrl}
                          alt={`${company.name} logo`}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-lg font-bold text-text-muted">
                          {company.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-text-primary">{company.name}</h3>
                        <Badge variant="default" className="text-[10px]">
                          {company.companyType || 'Product'}
                        </Badge>
                        {company.isVerified ? (
                          <Badge variant="success" className="text-[10px]">
                            ✓ Verified
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">
                            ⏳ Pending Audit
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary font-medium">{company.industry}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted pt-0.5">
                        {company.location && <span>📍 {company.location}</span>}
                        {company.companyEmail && (
                          <span className="font-mono text-[11px]">✉️ {company.companyEmail}</span>
                        )}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            🌐 Website ↗
                          </a>
                        )}
                        {company.linkedinUrl && (
                          <a
                            href={company.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            LinkedIn ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Verification Action Buttons */}
                  <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                    {!company.isVerified ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isLoading || !company.id}
                        onClick={() => company.id && handleVerify(company.id, company.name)}
                        className="bg-success text-success-foreground hover:bg-success/90 shadow-sm"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Verifying...
                          </span>
                        ) : (
                          '✓ Approve Verification'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || !company.id}
                        onClick={() => company.id && handleRevoke(company.id, company.name)}
                        className="text-warning border-warning/40 hover:bg-warning/10"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          'Revoke Verification'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
