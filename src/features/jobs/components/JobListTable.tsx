'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { JobPosting, JobStatus } from '@/features/jobs/types';
import { updateJobStatusAction, deleteJobAction } from '@/features/jobs/actions';

interface JobListTableProps {
  jobs: JobPosting[];
  companyName: string;
}

export function JobListTable({ jobs, companyName }: JobListTableProps) {
  const router = useRouter();
  const [busyJobId, setBusyJobId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    setBusyJobId(jobId);
    setErrorMessage(null);
    try {
      const res = await updateJobStatusAction(jobId, newStatus);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update job status');
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing status';
      setErrorMessage(msg);
    } finally {
      setBusyJobId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this draft job posting?')) return;
    setBusyJobId(jobId);
    setErrorMessage(null);
    try {
      const res = await deleteJobAction(jobId);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete job posting');
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting job';
      setErrorMessage(msg);
    } finally {
      setBusyJobId(null);
    }
  };

  if (jobs.length === 0) {
    return (
      <Card className="border-border shadow-sm text-center">
        <CardContent className="py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-hover/80 border border-border mx-auto flex items-center justify-center text-text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-text-primary">No jobs or internships yet</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {companyName} has not created any campus recruitment drives or internship postings yet. Post your first opportunity to attract qualified students.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/company/jobs/new">
              <Button id="create-job-cta" variant="primary" size="md">
                Create Job
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg bg-error-bg/60 border border-error/30 p-3 text-xs text-error font-medium flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-error/70 hover:text-error ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Active & Draft Job Openings</CardTitle>
            <CardDescription className="text-xs">
              Management roster for {jobs.length} recruitment listing(s).
            </CardDescription>
          </div>
          <Link href="/company/jobs/new">
            <Button variant="primary" size="sm" className="text-xs">
              + Post New Job
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50 text-text-muted font-medium uppercase text-[11px]">
                  <th className="py-3 px-4">Job Title & Type</th>
                  <th className="py-3 px-4">Location & Mode</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => {
                  const deadlinePassed = new Date(job.applicationDeadline).getTime() < Date.now();
                  const isBusy = busyJobId === job.id;
                  const createdDate = new Date(job.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={job.id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-text-primary text-sm">{job.title}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary capitalize">
                            <span className="font-medium text-text-primary">
                              {job.employmentType === 'full_time'
                                ? 'Full-Time'
                                : job.employmentType === 'internship'
                                ? 'Internship'
                                : 'Internship + PPO'}
                            </span>
                            {job.department && (
                              <>
                                <span>•</span>
                                <span>{job.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-text-secondary">
                        <p className="font-medium text-text-primary">{job.location}</p>
                        <p className="capitalize text-text-muted">{job.workplaceType.replace('_', ' ')}</p>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] font-mono text-text-secondary">
                        {createdDate}
                      </td>

                      <td className="py-3.5 px-4 text-[11px]">
                        <p className={`font-mono ${deadlinePassed ? 'text-warning font-semibold' : 'text-text-primary'}`}>
                          {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        {deadlinePassed && (
                          <span className="text-[10px] text-warning uppercase font-semibold">Expired</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            job.status === 'published'
                              ? 'success'
                              : job.status === 'closed'
                              ? 'info'
                              : job.status === 'archived'
                              ? 'default'
                              : 'warning'
                          }
                          className="capitalize text-[11px]"
                        >
                          {job.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/company/jobs/${job.id}/applicants`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] px-2.5 py-1"
                              id={`view-applicants-${job.id}`}
                            >
                              Applicants
                            </Button>
                          </Link>

                          <select
                            aria-label={`Status for ${job.title}`}
                            value={job.status}
                            disabled={isBusy}
                            onChange={(e) => handleStatusChange(job.id, e.target.value as JobStatus)}
                            className="px-2 py-1 text-[11px] rounded bg-surface border border-border text-text-secondary focus:outline-none"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="closed">Closed</option>
                            <option value="archived">Archived</option>
                          </select>

                          {job.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleDelete(job.id)}
                              className="text-error hover:text-error hover:bg-error-bg/30 text-xs px-2 py-1"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
