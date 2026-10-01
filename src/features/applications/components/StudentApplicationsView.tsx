'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { JobApplication, ApplicationStatus } from '@/features/applications/types';
import {
  formatApplicationStatus,
  getTimelineStages,
  APPLICATION_STATUS_MAP,
} from '@/features/applications/utils/status-timeline';
import { ApplicationStatusHistoryModal } from './ApplicationStatusHistoryModal';

interface StudentApplicationsViewProps {
  applications: JobApplication[];
}

type SortOption = 'newest' | 'oldest' | 'recently_updated';

export function StudentApplicationsView({ applications }: StudentApplicationsViewProps) {
  const [selectedFilter, setSelectedFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');
  const [expandedNotes, setExpandedNotes] = React.useState<Record<string, boolean>>({});
  const [selectedHistoryApp, setSelectedHistoryApp] = React.useState<JobApplication | null>(null);

  const toggleNote = (appId: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  // Status counts for filter pills
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    for (const key of Object.keys(APPLICATION_STATUS_MAP)) {
      counts[key] = 0;
    }
    for (const app of applications) {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    }
    return counts;
  }, [applications]);

  // Filtered and sorted applications
  const filteredApplications = React.useMemo(() => {
    let result = [...applications];

    if (selectedFilter !== 'all') {
      result = result.filter((app) => app.status === selectedFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.appliedAt || b.createdAt).getTime() - new Date(a.appliedAt || a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.appliedAt || a.createdAt).getTime() - new Date(b.appliedAt || b.createdAt).getTime();
      }
      if (sortBy === 'recently_updated') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }, [applications, selectedFilter, sortBy]);

  const filterTabs: { id: string; label: string }[] = [
    { id: 'all', label: 'All Applications' },
    { id: 'applied', label: 'Applied' },
    { id: 'in_review', label: 'In Review' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'offered', label: 'Offered' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'withdrawn', label: 'Withdrawn' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Area with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              My Job Applications
            </h1>
            <Badge variant="default" className="text-xs font-mono font-semibold">
              {applications.length} Total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Track candidate progression, interview milestones, and official offers across all submitted placement drives.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/student/jobs">
            <Button variant="primary" size="md" className="text-xs font-semibold">
              Explore Drives →
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Global Empty State (If student has never applied) */}
      {applications.length === 0 ? (
        <Card className="border-border shadow-xs">
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-hover/80 border border-border mx-auto flex items-center justify-center text-text-muted text-2xl">
              📋
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                You haven&apos;t applied to any jobs yet.
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Discover active recruitment opportunities matching your academic program, check your institutional eligibility gates, and submit applications with a single click.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/student/jobs">
                <Button id="explore-jobs-cta" variant="primary" size="md" className="font-semibold text-xs px-6">
                  Explore Placement Drives
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 3. Filter Pills and Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-3 sm:p-4 rounded-xl border border-border">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="tablist">
              {filterTabs.map((tab) => {
                const count = statusCounts[tab.id] || 0;
                const isActive = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-hover/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-border text-text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <label htmlFor="application-sort-select" className="text-text-muted font-medium">
                Sort by:
              </label>
              <select
                id="application-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-background text-text-primary border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="newest">Newest Applied</option>
                <option value="oldest">Oldest Applied</option>
                <option value="recently_updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* 4. Filtered Empty State */}
          {filteredApplications.length === 0 ? (
            <Card className="border-border text-center p-8 space-y-3">
              <p className="text-sm font-semibold text-text-primary">
                No applications matching filter &ldquo;{selectedFilter}&rdquo;
              </p>
              <p className="text-xs text-text-muted">
                Try selecting a different status filter or clear filters to view all submissions.
              </p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFilter('all')}
                  className="text-xs"
                >
                  Clear Status Filter
                </Button>
              </div>
            </Card>
          ) : (
            /* 5. Applications Cards List */
            <div className="space-y-5" id="applications-list">
              {filteredApplications.map((app) => {
                const statusMeta = formatApplicationStatus(app.status);
                const timeline = getTimelineStages(app.status, app.statusHistory);
                const companyInitial = (app.companyName || 'C').charAt(0).toUpperCase();
                const appliedDate = new Date(app.appliedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const updatedDate = new Date(app.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const isNoteExpanded = expandedNotes[app.id] || false;

                const employmentTypeLabel =
                  app.employmentType === 'full_time'
                    ? 'Full-Time Direct'
                    : app.employmentType === 'internship'
                    ? 'Internship Only'
                    : app.employmentType === 'internship_to_full_time'
                    ? 'Internship + PPO'
                    : null;

                const workplaceTypeLabel =
                  app.workplaceType === 'on_site'
                    ? 'On-site'
                    : app.workplaceType === 'remote'
                    ? 'Remote'
                    : app.workplaceType === 'hybrid'
                    ? 'Hybrid'
                    : null;

                return (
                  <Card
                    key={app.id}
                    id={`application-card-${app.id}`}
                    className="border border-border shadow-xs hover:border-border/80 transition-all bg-surface overflow-hidden"
                  >
                    <CardContent className="p-5 sm:p-6 space-y-5">
                      {/* Top Header Row: Company Info & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          {app.companyLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={app.companyLogoUrl}
                              alt={app.companyName || 'Company'}
                              className="w-12 h-12 rounded-xl object-contain bg-surface-hover border border-border p-1 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-lg flex items-center justify-center shrink-0">
                              {companyInitial}
                            </div>
                          )}

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-text-secondary">
                                {app.companyName || 'Campus Partner'}
                              </span>
                              {app.companyWebsite && (
                                <a
                                  href={app.companyWebsite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-primary hover:underline"
                                >
                                  Website ↗
                                </a>
                              )}
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight truncate">
                              {app.jobTitle || 'Placement Opportunity'}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-text-muted">
                              {employmentTypeLabel && (
                                <Badge variant="default" className="text-[10px] font-medium py-0">
                                  {employmentTypeLabel}
                                </Badge>
                              )}
                              {workplaceTypeLabel && (
                                <>
                                  <span>•</span>
                                  <span>{workplaceTypeLabel}</span>
                                </>
                              )}
                              {app.location && (
                                <>
                                  <span>•</span>
                                  <span>{app.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Right: Status Badge & Ref */}
                        <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                          <Badge
                            variant={statusMeta.badgeVariant}
                            className="font-bold text-xs uppercase px-3 py-1"
                          >
                            {statusMeta.label}
                          </Badge>
                          <span className="text-[11px] font-mono text-text-muted">
                            Ref: APP-{app.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Middle Recruitment Progression Timeline */}
                      <div className="pt-2 pb-1 border-t border-border/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                            Recruitment Timeline & Pipeline Stage
                          </span>
                          <span className="text-[11px] text-text-muted font-mono">
                            Applied: {appliedDate}
                          </span>
                        </div>

                        {/* Visual Progress Steps */}
                        <div className="bg-surface-hover/50 p-3.5 sm:p-4 rounded-xl border border-border/80">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
                            {timeline.map((stage, idx) => {
                              const isCompleted = stage.status === 'completed';
                              const isCurrent = stage.status === 'current';
                              const isRejected = stage.status === 'terminal_rejected';
                              const isWithdrawn = stage.status === 'terminal_withdrawn';

                              return (
                                <div key={stage.key} className="flex flex-col space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                                        isCompleted
                                          ? 'bg-success text-white shadow-xs'
                                          : isCurrent
                                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                                          : isRejected
                                          ? 'bg-error-bg text-error border border-error/30'
                                          : isWithdrawn
                                          ? 'bg-surface-hover text-text-muted border border-border'
                                          : 'bg-surface border border-border text-text-muted'
                                      }`}
                                    >
                                      {isCompleted ? '✓' : isRejected ? '✕' : isWithdrawn ? '⊘' : idx + 1}
                                    </div>
                                    <span
                                      className={`text-xs font-semibold truncate ${
                                        isCurrent
                                          ? 'text-primary font-bold'
                                          : isCompleted
                                          ? 'text-text-primary'
                                          : isRejected
                                          ? 'text-error'
                                          : isWithdrawn
                                          ? 'text-text-muted'
                                          : 'text-text-muted'
                                      }`}
                                    >
                                      {stage.label}
                                    </span>
                                  </div>

                                  <div className="pl-8 text-[11px] text-text-muted space-y-0.5">
                                    {stage.timestamp && (
                                      <p className="font-mono text-[10px]">
                                        {new Date(stage.timestamp).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </p>
                                    )}
                                    {stage.remarks && (
                                      <p className="text-[10px] text-text-secondary italic line-clamp-1">
                                        {stage.remarks}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Optional Candidate Cover Note Disclosure */}
                      {app.coverNote && (
                        <div className="text-xs border-t border-border/60 pt-3">
                          <button
                            type="button"
                            onClick={() => toggleNote(app.id)}
                            className="text-text-muted hover:text-text-primary font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <span>{isNoteExpanded ? '▼' : '▶'}</span>
                            <span>{isNoteExpanded ? 'Hide Cover Note' : 'View Submitted Cover Note'}</span>
                          </button>
                          {isNoteExpanded && (
                            <div className="mt-2 p-3 rounded-lg bg-surface-hover/70 border border-border text-text-secondary leading-relaxed whitespace-pre-line text-xs">
                              {app.coverNote}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Actions: Last Updated & View Job CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border text-xs">
                        <span className="text-text-muted font-mono text-[11px]">
                          Last updated: {updatedDate}
                        </span>

                        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                          <Button
                            id={`view-history-btn-${app.id}`}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto text-xs px-3 font-semibold flex items-center gap-1.5"
                            onClick={() => setSelectedHistoryApp(app)}
                          >
                            <span>📜</span>
                            <span>Status History</span>
                          </Button>
                          <Link href={`/student/jobs/${app.jobId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto text-xs px-4 font-semibold"
                            >
                              View Placement Drive →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Application Status History Modal */}
      {selectedHistoryApp && (
        <ApplicationStatusHistoryModal
          isOpen={!!selectedHistoryApp}
          onClose={() => setSelectedHistoryApp(null)}
          applicationId={selectedHistoryApp.id}
          jobTitle={selectedHistoryApp.jobTitle}
          companyName={selectedHistoryApp.companyName}
          currentStatus={selectedHistoryApp.status}
          history={selectedHistoryApp.statusHistory}
          mode="student"
        />
      )}
    </div>
  );
}
