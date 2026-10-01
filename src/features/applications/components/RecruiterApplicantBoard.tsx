'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { JobPosting } from '@/features/jobs/types';
import type {
  ApplicantDetailItem,
  ApplicationStatus,
} from '@/features/applications/types';
import {
  formatApplicationStatus,
  APPLICATION_STATUS_MAP,
} from '@/features/applications/utils/status-timeline';
import {
  getAllowedNextStatuses,
  isTerminalStatus,
  validateStatusTransition,
} from '@/features/applications/utils/transitions';
import { updateRecruiterApplicationStatusAction } from '@/features/applications/actions';
import { ApplicationStatusHistoryModal } from './ApplicationStatusHistoryModal';

interface RecruiterApplicantBoardProps {
  job: JobPosting;
  initialApplicants: ApplicantDetailItem[];
}

type SortOption = 'newest' | 'oldest' | 'cgpa' | 'updated';

export function RecruiterApplicantBoard({
  job,
  initialApplicants,
}: RecruiterApplicantBoardProps) {
  const router = useRouter();
  const [applicants, setApplicants] = React.useState<ApplicantDetailItem[]>(initialApplicants);
  const [selectedApplicant, setSelectedApplicant] = React.useState<ApplicantDetailItem | null>(null);
  const [activeAuditApp, setActiveAuditApp] = React.useState<ApplicantDetailItem | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');

  // Status update modal / form states
  const [newStatus, setNewStatus] = React.useState<ApplicationStatus>('in_review');
  const [remarks, setRemarks] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = React.useState<string | null>(null);

  // Close drawer on Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedApplicant(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync initialApplicants when page revalidates
  React.useEffect(() => {
    setApplicants(initialApplicants);
  }, [initialApplicants]);

  // When selectedApplicant opens, prime the status update form
  React.useEffect(() => {
    if (selectedApplicant) {
      const allowed = getAllowedNextStatuses(selectedApplicant.status);
      if (allowed.length > 0) {
        setNewStatus(allowed[0]);
      } else {
        setNewStatus(selectedApplicant.status);
      }
      setRemarks('');
      setUpdateError(null);
      setUpdateSuccess(null);
    }
  }, [selectedApplicant]);

  // KPI Counts
  const totalCount = applicants.length;
  const inReviewCount = applicants.filter((a) => a.status === 'in_review').length;
  const shortlistedCount = applicants.filter((a) => a.status === 'shortlisted').length;
  const offeredCount = applicants.filter((a) => a.status === 'offered').length;
  const rejectedCount = applicants.filter((a) => a.status === 'rejected').length;
  const appliedCount = applicants.filter((a) => a.status === 'applied').length;
  const withdrawnCount = applicants.filter((a) => a.status === 'withdrawn').length;

  // Filtered & Sorted applicants
  const filteredApplicants = React.useMemo(() => {
    return applicants
      .filter((app) => {
        // Status filter
        if (statusFilter !== 'all' && app.status !== statusFilter) {
          return false;
        }

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchName = app.candidate.fullName.toLowerCase().includes(q);
        const matchCollege = app.candidate.collegeName.toLowerCase().includes(q);
        const matchDept = app.candidate.department.toLowerCase().includes(q);
        const matchRef = app.id.toLowerCase().includes(q);
        const matchRoll = app.candidate.rollNumber.toLowerCase().includes(q);
        const matchEmail = app.candidate.email.toLowerCase().includes(q);

        return matchName || matchCollege || matchDept || matchRef || matchRoll || matchEmail;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        }
        if (sortBy === 'cgpa') {
          return b.candidate.cgpa - a.candidate.cgpa;
        }
        if (sortBy === 'updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        return 0;
      });
  }, [applicants, statusFilter, searchQuery, sortBy]);

  // Handle recruitment status update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    const validation = validateStatusTransition(selectedApplicant.status, newStatus);
    if (!validation.isValid) {
      setUpdateError(validation.error || 'Invalid stage transition.');
      setIsUpdating(false);
      return;
    }

    try {
      const res = await updateRecruiterApplicationStatusAction({
        applicationId: selectedApplicant.id,
        newStatus,
        remarks: remarks.trim() || undefined,
      });

      if (!res.success) {
        setUpdateError(res.error || 'Failed to update application status.');
      } else {
        const updated = res.data!;
        setUpdateSuccess(`Status successfully changed to ${formatApplicationStatus(newStatus).label}`);

        // Update local applicants list
        const nowIso = new Date().toISOString();
        setApplicants((prev) =>
          prev.map((item) => {
            if (item.id === updated.id) {
              const newHistoryItem = {
                id: crypto.randomUUID(),
                applicationId: updated.id,
                fromStatus: item.status,
                toStatus: newStatus,
                remarks: remarks.trim() || `Status updated to ${newStatus}`,
                createdAt: nowIso,
              };
              const updatedItem: ApplicantDetailItem = {
                ...item,
                status: newStatus,
                updatedAt: nowIso,
                statusHistory: [...item.statusHistory, newHistoryItem],
              };
              setSelectedApplicant(updatedItem);
              return updatedItem;
            }
            return item;
          })
        );

        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during status update.';
      setUpdateError(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const deadlineDate = new Date(job.applicationDeadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const isDeadlinePassed = new Date(job.applicationDeadline).getTime() < Date.now();

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Link href="/company" className="hover:text-text-primary transition-colors">
                Company Dashboard
              </Link>
              <span>/</span>
              <Link href="/company/jobs" className="hover:text-text-primary transition-colors">
                Jobs
              </Link>
              <span>/</span>
              <span className="text-text-primary font-medium truncate max-w-xs">{job.title}</span>
              <span>/</span>
              <span className="text-text-primary font-semibold">Applicants</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {job.title}
              </h1>
              <Badge
                variant={
                  job.status === 'published'
                    ? 'success'
                    : job.status === 'closed'
                    ? 'info'
                    : 'warning'
                }
                className="capitalize text-xs font-semibold"
              >
                {job.status}
              </Badge>
              <Badge variant="default" className="text-xs font-semibold">
                {totalCount} {totalCount === 1 ? 'Applicant' : 'Applicants'}
              </Badge>
            </div>

            {/* Job Metadata Header Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary pt-1">
              <span className="font-semibold text-text-primary">{job.companyName}</span>
              <span>•</span>
              <span>{job.location}</span>
              <span>•</span>
              <span className="capitalize">
                {job.employmentType === 'full_time'
                  ? 'Full-Time'
                  : job.employmentType === 'internship'
                  ? 'Internship'
                  : 'Internship + PPO'}
              </span>
              <span>•</span>
              <span className="capitalize">{job.workplaceType.replace('_', ' ')}</span>
              {job.department && (
                <>
                  <span>•</span>
                  <span>{job.department}</span>
                </>
              )}
              <span>•</span>
              <span className={isDeadlinePassed ? 'text-warning font-semibold' : ''}>
                Deadline: {deadlineDate} {isDeadlinePassed && '(Expired)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/company/jobs">
              <Button id="back-to-jobs-btn" variant="outline" size="sm">
                ← Back to Company Jobs
              </Button>
            </Link>
          </div>
        </div>

        {/* 2. KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-text-muted">Total Applicants</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-text-primary">{totalCount}</span>
              <span className="text-[11px] text-text-muted">Roster</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-warning">In Review</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-warning">{inReviewCount}</span>
              <span className="text-[11px] text-text-muted">Screening</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-primary">Shortlisted</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-primary">{shortlistedCount}</span>
              <span className="text-[11px] text-text-muted">Qualified</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-success">Offered</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-success">{offeredCount}</span>
              <span className="text-[11px] text-text-muted">Selected</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-error">Rejected</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-error">{rejectedCount}</span>
              <span className="text-[11px] text-text-muted">Closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search, Filters, and Sorting Controls */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <input
                id="applicant-search-input"
                type="text"
                placeholder="Search candidates by name, college, branch, or ref ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-background border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary text-xs"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="applicant-sort-select" className="text-xs text-text-secondary whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="applicant-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="newest">Newest Applications</option>
                <option value="oldest">Oldest Applications</option>
                <option value="cgpa">Highest CGPA</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-border pt-3">
            {[
              { id: 'all', label: 'All', count: totalCount },
              { id: 'applied', label: 'Applied', count: appliedCount },
              { id: 'in_review', label: 'In Review', count: inReviewCount },
              { id: 'shortlisted', label: 'Shortlisted', count: shortlistedCount },
              { id: 'offered', label: 'Offered', count: offeredCount },
              { id: 'rejected', label: 'Rejected', count: rejectedCount },
              { id: 'withdrawn', label: 'Withdrawn', count: withdrawnCount },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`filter-tab-${tab.id}`}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-surface-hover/60 text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-surface text-text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Applicant List: Table (Desktop) / Cards (Mobile) */}
      {applicants.length === 0 ? (
        // Global empty state: no applications submitted yet
        <Card className="border-border shadow-sm text-center py-16">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover border border-border mx-auto flex items-center justify-center text-text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-primary">No applications yet</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Candidates have not applied to this placement drive yet. Once eligible students submit their applications, their academic profiles, verified scores, and resumes will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/company/jobs">
                <Button variant="primary" size="md">
                  Back to Company Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : filteredApplicants.length === 0 ? (
        // Filter empty state
        <Card className="border-border shadow-sm text-center py-12">
          <CardContent className="space-y-3 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-text-primary">No applicants match your filters.</p>
            <p className="text-xs text-text-secondary">
              Try adjusting your search query or selecting a different status filter to view candidates.
            </p>
            <div className="pt-1">
              <Button
                id="clear-filters-btn"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 bg-surface-hover/30 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Applicant Records ({filteredApplicants.length})
            </CardTitle>
            <span className="text-[11px] text-text-muted">Click any candidate to review full profile</span>
          </CardHeader>
          <CardContent className="p-0">
            {/* Responsive Table for Medium & Desktop Screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50 text-text-muted font-medium uppercase text-[11px]">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">College & Degree</th>
                    <th className="py-3 px-4">Academic Merit</th>
                    <th className="py-3 px-4">Skills</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredApplicants.map((app) => {
                    const statusMeta = formatApplicationStatus(app.status);
                    const appliedFormatted = new Date(app.appliedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    // Candidate Initials for Avatar Monogram
                    const initials = app.candidate.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr
                        key={app.id}
                        id={`applicant-row-${app.id}`}
                        className="hover:bg-surface-hover/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedApplicant(app)}
                      >
                        {/* Candidate Column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-text-primary text-sm group-hover:text-primary transition-colors">
                                {app.candidate.fullName}
                              </p>
                              <p className="text-[11px] text-text-muted truncate max-w-[180px]">
                                {app.candidate.email}
                              </p>
                              <span className="text-[10px] font-mono text-text-muted">
                                Ref: {app.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* College & Degree Column */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <p className="font-medium text-text-primary text-xs">
                              {app.candidate.collegeName}
                            </p>
                            <p className="text-[11px] text-text-secondary">
                              {app.candidate.degree} • {app.candidate.department}
                            </p>
                            <span className="text-[10px] text-text-muted font-mono">
                              Batch: {app.candidate.batchYear}
                            </span>
                          </div>
                        </td>

                        {/* Academic Merit Column */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border">
                              <span className="text-[10px] text-text-muted">CGPA</span>
                              <span className="font-bold text-text-primary text-xs">
                                {app.candidate.cgpa.toFixed(1)}
                              </span>
                            </div>
                            <div>
                              <span
                                className={`text-[10px] ${
                                  app.candidate.activeBacklogs === 0
                                    ? 'text-success'
                                    : 'text-warning font-semibold'
                                }`}
                              >
                                {app.candidate.activeBacklogs === 0
                                  ? '0 Backlogs'
                                  : `${app.candidate.activeBacklogs} Backlogs`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Skills Column */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {app.candidate.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] text-text-secondary"
                              >
                                {skill.name}
                              </span>
                            ))}
                            {app.candidate.skills.length > 3 && (
                              <span className="text-[10px] text-text-muted self-center">
                                +{app.candidate.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Applied Date Column */}
                        <td className="py-3 px-4 text-text-secondary font-mono text-[11px]">
                          {appliedFormatted}
                        </td>

                        {/* Status Column */}
                        <td className="py-3 px-4">
                          <Badge variant={statusMeta.badgeVariant} className="text-[11px] font-medium">
                            {statusMeta.label}
                          </Badge>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              id={`view-audit-btn-${app.id}`}
                              variant="outline"
                              size="sm"
                              className="text-xs text-text-secondary hover:text-text-primary px-2.5 flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAuditApp(app);
                              }}
                            >
                              <span>📜</span>
                              <span>History</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplicant(app);
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="md:hidden divide-y divide-border">
              {filteredApplicants.map((app) => {
                const statusMeta = formatApplicationStatus(app.status);
                const initials = app.candidate.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={app.id}
                    id={`applicant-card-${app.id}`}
                    onClick={() => setSelectedApplicant(app)}
                    className="p-4 space-y-3 hover:bg-surface-hover/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary text-sm">{app.candidate.fullName}</p>
                          <p className="text-xs text-text-muted">{app.candidate.collegeName}</p>
                        </div>
                      </div>
                      <Badge variant={statusMeta.badgeVariant} className="text-xs">
                        {statusMeta.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-surface-hover/40 p-2.5 rounded-lg border border-border/50">
                      <div>
                        <span className="text-[10px] text-text-muted block">Department</span>
                        <span className="font-medium text-text-primary text-[11px]">
                          {app.candidate.degree} • {app.candidate.department}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted block">Merit</span>
                        <span className="font-bold text-text-primary text-[11px]">
                          CGPA: {app.candidate.cgpa.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-text-muted font-mono">
                        Applied: {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          id={`view-audit-card-btn-${app.id}`}
                          variant="outline"
                          size="sm"
                          className="text-xs flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAuditApp(app);
                          }}
                        >
                          <span>📜</span>
                          <span>History</span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplicant(app);
                          }}
                        >
                          Review Candidate
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Applicant Detail Slide-Over / Modal */}
      {selectedApplicant && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicant-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm"
          onClick={() => setSelectedApplicant(null)}
        >
          <div
            className="w-full max-w-2xl h-full bg-surface border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-border bg-surface-hover/30 flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 id="applicant-detail-title" className="text-xl font-bold text-text-primary">
                    {selectedApplicant.candidate.fullName}
                  </h2>
                  <Badge
                    variant={formatApplicationStatus(selectedApplicant.status).badgeVariant}
                    className="text-xs font-semibold"
                  >
                    {formatApplicationStatus(selectedApplicant.status).label}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">
                  Application Reference: <span className="font-mono text-text-primary">{selectedApplicant.id}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted pt-1">
                  <span>Applied: {new Date(selectedApplicant.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>Updated: {new Date(selectedApplicant.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              <button
                type="button"
                id="close-drawer-btn"
                onClick={() => setSelectedApplicant(null)}
                className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label="Close applicant details"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Alert Feedback for Status Updates */}
              {updateSuccess && (
                <div
                  role="status"
                  className="rounded-lg bg-success-bg/80 border border-success/30 p-3 text-xs text-success font-medium flex items-center justify-between"
                >
                  <span>✓ {updateSuccess}</span>
                  <button type="button" onClick={() => setUpdateSuccess(null)} className="text-success/70 hover:text-success">
                    ✕
                  </button>
                </div>
              )}
              {updateError && (
                <div
                  role="alert"
                  className="rounded-lg bg-error-bg/80 border border-error/30 p-3 text-xs text-error font-medium flex items-center justify-between"
                >
                  <span>⚠ {updateError}</span>
                  <button type="button" onClick={() => setUpdateError(null)} className="text-error/70 hover:text-error">
                    ✕
                  </button>
                </div>
              )}

              {/* Status Management Action Bar */}
              <div className="p-4 rounded-xl bg-surface-hover/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Recruiter Status Management
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    Current Stage: <strong className="text-text-primary capitalize">{selectedApplicant.status.replace('_', ' ')}</strong>
                  </span>
                </div>

                {isTerminalStatus(selectedApplicant.status) ? (
                  <div className="p-3.5 rounded-lg bg-surface border border-border flex items-start gap-3">
                    <span className="text-base select-none">
                      {selectedApplicant.status === 'offered'
                        ? '🎉'
                        : selectedApplicant.status === 'rejected'
                        ? '🚫'
                        : 'ℹ️'}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-text-primary text-xs">
                        {selectedApplicant.status === 'offered'
                          ? 'Placement Offer Extended'
                          : selectedApplicant.status === 'rejected'
                          ? 'Application Marked Rejected'
                          : 'Application Voluntarily Withdrawn'}
                      </p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {selectedApplicant.status === 'offered'
                          ? 'This candidate has reached the final placement stage. No further stage transitions are required.'
                          : selectedApplicant.status === 'rejected'
                          ? 'This candidate was not selected for this drive. This application has reached a terminal outcome.'
                          : 'The candidate voluntarily withdrew this application from the recruitment drive. No further stage modifications are permitted.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStatusSubmit} className="space-y-3">
                    {/* Stage Progression Flow Indicator */}
                    <div className="p-3 rounded-lg bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">Current Stage:</span>
                        <Badge
                          variant={formatApplicationStatus(selectedApplicant.status).badgeVariant}
                          className="text-xs font-semibold"
                        >
                          {formatApplicationStatus(selectedApplicant.status).label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <span>Available Next:</span>
                        <div className="flex gap-1">
                          {getAllowedNextStatuses(selectedApplicant.status).map((s) => (
                            <Badge key={s} variant={formatApplicationStatus(s).badgeVariant} className="text-[10px]">
                              {formatApplicationStatus(s).label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="new-status-select" className="text-xs font-medium text-text-secondary block mb-1">
                          Transition Stage To:
                        </label>
                        <select
                          id="new-status-select"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                          disabled={isUpdating}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {getAllowedNextStatuses(selectedApplicant.status).map((s) => (
                            <option key={s} value={s}>
                              {formatApplicationStatus(s).label} {isTerminalStatus(s) ? '(Terminal Outcome)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="recruiter-remarks-input" className="text-xs font-medium text-text-secondary block mb-1">
                          Recruiter Remarks (Optional):
                        </label>
                        <input
                          id="recruiter-remarks-input"
                          type="text"
                          placeholder={
                            newStatus === 'rejected'
                              ? 'e.g. Does not meet technical stack criteria...'
                              : newStatus === 'offered'
                              ? 'e.g. Selected for full-time offer at ₹18 LPA...'
                              : newStatus === 'shortlisted'
                              ? 'e.g. Shortlisted for Technical Assessment...'
                              : 'e.g. Screening portfolio and coursework...'
                          }
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          disabled={isUpdating}
                          maxLength={500}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Important Terminal Confirmation Notice */}
                    {isTerminalStatus(newStatus) && (
                      <div
                        role="alert"
                        className="rounded-lg bg-warning/10 border border-warning/30 p-2.5 text-[11px] text-warning flex items-start gap-2"
                      >
                        <span className="font-bold">⚠️</span>
                        <span>
                          Transitioning this candidate to <strong>{formatApplicationStatus(newStatus).label}</strong> is an important outcome. Once confirmed, this application will reach a terminal stage in the recruitment pipeline.
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <Button
                        id="update-status-submit-btn"
                        type="submit"
                        variant={newStatus === 'rejected' ? 'destructive' : 'primary'}
                        size="sm"
                        disabled={isUpdating || newStatus === selectedApplicant.status}
                      >
                        {isUpdating ? 'Saving Transition...' : `Confirm Transition to ${formatApplicationStatus(newStatus).label}`}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* Candidate Overview Card */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Academic & Personal Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-text-muted block">College / University</span>
                    <span className="font-semibold text-text-primary">{selectedApplicant.candidate.collegeName}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-text-muted block">Degree & Department</span>
                    <span className="font-semibold text-text-primary">
                      {selectedApplicant.candidate.degree} in {selectedApplicant.candidate.department}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-text-muted block">Roll Number & Batch</span>
                    <span className="font-semibold text-text-primary">
                      {selectedApplicant.candidate.rollNumber} • Class of {selectedApplicant.candidate.batchYear}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-text-muted block">Cumulative CGPA</span>
                    <span className="font-bold text-primary text-sm">
                      {selectedApplicant.candidate.cgpa.toFixed(2)} / 10.0
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-text-muted block">Active Backlogs</span>
                    <span
                      className={`font-semibold ${
                        selectedApplicant.candidate.activeBacklogs === 0 ? 'text-success' : 'text-warning'
                      }`}
                    >
                      {selectedApplicant.candidate.activeBacklogs} backlogs on record
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                    <span className="text-[10px] text-text-muted block">Email & Phone</span>
                    <span className="font-medium text-text-primary block truncate">
                      {selectedApplicant.candidate.email}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {selectedApplicant.candidate.phone || 'Phone not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Candidate Resume & Portfolio Links */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Resume & Professional Links
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedApplicant.candidate.resumeUrl ? (
                    <a
                      id="view-resume-link"
                      href={selectedApplicant.candidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                        View Candidate Resume
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-text-muted italic px-3 py-1.5 rounded-lg border border-border bg-surface">
                      No resume attached to this application
                    </span>
                  )}

                  {selectedApplicant.candidate.githubUrl && (
                    <a
                      href={selectedApplicant.candidate.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary hover:bg-surface-hover transition-colors font-medium"
                    >
                      GitHub Profile ↗
                    </a>
                  )}

                  {selectedApplicant.candidate.linkedinUrl && (
                    <a
                      href={selectedApplicant.candidate.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary hover:bg-surface-hover transition-colors font-medium"
                    >
                      LinkedIn Profile ↗
                    </a>
                  )}

                  {selectedApplicant.candidate.portfolioUrl && (
                    <a
                      href={selectedApplicant.candidate.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary hover:bg-surface-hover transition-colors font-medium"
                    >
                      Portfolio Website ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Demonstrated Skills ({selectedApplicant.candidate.skills.length})
                </h3>
                {selectedApplicant.candidate.skills.length === 0 ? (
                  <p className="text-xs text-text-muted italic">Not provided</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplicant.candidate.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-surface border border-border text-xs text-text-primary font-medium"
                      >
                        {s.name}
                        {s.proficiency && (
                          <span className="ml-1 text-[10px] text-text-muted capitalize">({s.proficiency})</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Projects */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Featured Projects ({selectedApplicant.candidate.projects.length})
                </h3>
                {selectedApplicant.candidate.projects.length === 0 ? (
                  <p className="text-xs text-text-muted italic">Not provided</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedApplicant.candidate.projects.map((proj, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-surface border border-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-text-primary">{proj.title}</h4>
                          {proj.projectUrl && (
                            <a
                              href={proj.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary hover:underline"
                            >
                              Demo / Repo ↗
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{proj.description}</p>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.technologies.map((t, tidx) => (
                              <span
                                key={tidx}
                                className="px-1.5 py-0.2 rounded bg-surface-hover text-[10px] text-text-muted"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Certifications */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Certifications ({selectedApplicant.candidate.certifications.length})
                </h3>
                {selectedApplicant.candidate.certifications.length === 0 ? (
                  <p className="text-xs text-text-muted italic">Not provided</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedApplicant.candidate.certifications.map((cert, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-surface border border-border space-y-1">
                        <p className="font-semibold text-text-primary text-xs">{cert.name}</p>
                        <p className="text-[11px] text-text-secondary">{cert.issuingOrganization}</p>
                        {cert.issueDate && (
                          <p className="text-[10px] text-text-muted">Issued: {cert.issueDate}</p>
                        )}
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline block pt-0.5"
                          >
                            Verify Credential ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cover Note */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Candidate Cover Note
                </h3>
                {selectedApplicant.coverNote ? (
                  <blockquote className="p-3.5 rounded-lg bg-surface border-l-4 border-primary text-xs text-text-secondary italic leading-relaxed">
                    &ldquo;{selectedApplicant.coverNote}&rdquo;
                  </blockquote>
                ) : (
                  <p className="text-xs text-text-muted italic">No cover note provided by candidate.</p>
                )}
              </div>

              {/* Application Status Progression History Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Application Audit Timeline
                  </h3>
                  <Button
                    id="open-full-audit-modal-btn"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2.5 flex items-center gap-1"
                    onClick={() => setActiveAuditApp(selectedApplicant)}
                  >
                    <span>📜</span>
                    <span>Full Audit Modal ↗</span>
                  </Button>
                </div>
                {selectedApplicant.statusHistory.length === 0 ? (
                  <p className="text-xs text-text-muted italic">No audit records logged yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {selectedApplicant.statusHistory.map((item, idx) => {
                      const itemMeta = formatApplicationStatus(item.toStatus as ApplicationStatus);
                      return (
                        <div key={item.id || idx} className="relative space-y-1">
                          <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />
                          <div className="flex items-center gap-2">
                            <Badge variant={itemMeta.badgeVariant} className="text-[10px] font-semibold">
                              {itemMeta.label}
                            </Badge>
                            <span className="text-[11px] text-text-muted font-mono">
                              {new Date(item.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {item.remarks && (
                            <p className="text-xs text-text-secondary pl-1 leading-relaxed">
                              {item.remarks}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-surface-hover/30 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-text-muted">
                Candidate ID: {selectedApplicant.candidate.studentId}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApplicant(null)}
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Full Application Audit History Modal */}
      {activeAuditApp && (
        <ApplicationStatusHistoryModal
          isOpen={!!activeAuditApp}
          onClose={() => setActiveAuditApp(null)}
          applicationId={activeAuditApp.id}
          jobTitle={job.title}
          companyName={job.companyName}
          candidateName={activeAuditApp.candidate.fullName}
          currentStatus={activeAuditApp.status}
          history={activeAuditApp.statusHistory}
          mode="recruiter"
        />
      )}
    </div>
  );
}
