'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { JobPosting } from '@/features/jobs/types';
import type { CompleteStudentProfile } from '@/features/student/types';
import { evaluateJobEligibility } from '@/services/eligibility.service';

interface StudentJobCardProps {
  job: JobPosting;
  studentProfile?: CompleteStudentProfile | null;
}

export function StudentJobCard({ job, studentProfile }: StudentJobCardProps) {
  const eligibility = React.useMemo(() => {
    return evaluateJobEligibility(studentProfile, job);
  }, [studentProfile, job]);

  const deadlineDate = new Date(job.applicationDeadline);
  const now = Date.now();
  const msRemaining = deadlineDate.getTime() - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isExpiringSoon = daysRemaining <= 3;

  const employmentTypeLabel =
    job.employmentType === 'full_time'
      ? 'Full-Time'
      : job.employmentType === 'internship'
      ? 'Internship'
      : 'Internship + PPO';

  const workplaceTypeLabel =
    job.workplaceType === 'on_site'
      ? 'On-site'
      : job.workplaceType === 'remote'
      ? 'Remote'
      : 'Hybrid';

  const companyInitial = (job.companyName || 'C').charAt(0).toUpperCase();

  return (
    <Card className="border border-border/80 bg-surface hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group overflow-hidden">
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Top Header: Company Identity, Badges & Compensation */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {job.companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.companyLogoUrl}
                  alt={job.companyName || 'Company'}
                  className="w-10 h-10 rounded-lg object-contain bg-surface-hover/80 border border-border shrink-0 p-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                  {companyInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary truncate">
                  {job.companyName || 'Corporate Partner'}
                </p>
                <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                  {job.title}
                </h3>
              </div>
            </div>

            {/* Eligibility Badge */}
            {studentProfile ? (
              <Badge
                variant={eligibility.isEligible ? 'success' : 'error'}
                className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
              >
                {eligibility.isEligible ? '✓ Eligible' : '✕ Ineligible'}
              </Badge>
            ) : (
              <Badge variant="default" className="shrink-0 text-[10px] uppercase">
                Active
              </Badge>
            )}
          </div>

          {/* Metadata Chips: Employment Type, Workplace & Location */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-text-secondary">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-hover border border-border/70 font-medium">
              {employmentTypeLabel}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-hover border border-border/70">
              {workplaceTypeLabel} • {job.location}
            </span>
            {job.department && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-hover border border-border/70 truncate max-w-[140px]">
                {job.department}
              </span>
            )}
          </div>

          {/* Role Brief Description */}
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Mid Section: Compensation, CGPA Gate & Skills */}
        <div className="space-y-3 pt-3 border-t border-border/60">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">
                Package / Stipend
              </span>
              <p className="font-mono font-semibold text-text-primary text-xs truncate">
                {job.isSalaryDisclosed
                  ? job.ctcDisplayText ||
                    (job.ctcMin && job.ctcMax
                      ? `₹${job.ctcMin} - ${job.ctcMax} LPA`
                      : job.stipendMonthly
                      ? `₹${job.stipendMonthly.toLocaleString('en-IN')}/mo`
                      : 'Disclosed at interview')
                  : 'Confidential'}
              </p>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">
                Academic Gate
              </span>
              <p className="font-mono text-xs text-text-secondary truncate">
                Min <span className="font-semibold text-text-primary">{job.minCgpa.toFixed(2)}</span> CGPA
                {job.maxActiveBacklogs !== undefined && ` • ≤${job.maxActiveBacklogs} Blg`}
              </p>
            </div>
          </div>

          {/* Required Skills Badges */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              {job.requiredSkills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary border border-border/60"
                >
                  {skill}
                </span>
              ))}
              {job.requiredSkills.length > 3 && (
                <span className="text-[10px] text-text-muted font-medium">
                  +{job.requiredSkills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Deadline & Action */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
              Deadline
            </p>
            <p
              className={`text-[11px] font-mono font-medium truncate ${
                isExpiringSoon ? 'text-warning font-semibold' : 'text-text-primary'
              }`}
            >
              {deadlineDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {isExpiringSoon && (
                <span className="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-warning-bg text-warning font-bold">
                  {daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`}
                </span>
              )}
            </p>
          </div>

          <Link href={`/student/jobs/${job.id}`}>
            <Button
              id={`view-details-${job.id}`}
              variant="outline"
              size="sm"
              className="text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shrink-0"
            >
              View Details →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
