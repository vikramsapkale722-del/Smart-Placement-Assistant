'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { JobPosting } from '@/features/jobs/types';
import type { CompleteStudentProfile } from '@/features/student/types';
import type { JobApplication } from '@/features/applications/types';
import { evaluateJobEligibility } from '@/services/eligibility.service';
import { submitApplicationAction } from '@/features/applications/actions';

interface JobDetailViewProps {
  job: JobPosting;
  studentProfile?: CompleteStudentProfile | null;
  initialApplication?: JobApplication | null;
}

export function JobDetailView({ job, studentProfile, initialApplication }: JobDetailViewProps) {
  const [showApplyModal, setShowApplyModal] = React.useState(false);
  const [application, setApplication] = React.useState<JobApplication | null>(initialApplication || null);
  const [coverNote, setCoverNote] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const eligibility = React.useMemo(() => {
    return evaluateJobEligibility(studentProfile, job);
  }, [studentProfile, job]);

  const deadline = new Date(job.applicationDeadline);
  const now = Date.now();
  const msRemaining = deadline.getTime() - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isExpired = msRemaining <= 0;
  const hasApplied = Boolean(application);

  const employmentTypeLabel =
    job.employmentType === 'full_time'
      ? 'Full-Time Direct'
      : job.employmentType === 'internship'
      ? 'Internship Only'
      : 'Internship + PPO';

  const workplaceTypeLabel =
    job.workplaceType === 'on_site'
      ? 'On-site Office / Campus'
      : job.workplaceType === 'remote'
      ? 'Fully Remote'
      : 'Hybrid (Office & Remote)';

  const companyInitial = (job.companyName || 'C').charAt(0).toUpperCase();

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || hasApplied || !eligibility.isEligible || isExpired) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await submitApplicationAction({
        jobId: job.id,
        coverNote: coverNote.trim() || null,
      });

      if (res.success && res.data) {
        setApplication(res.data);
        setSubmitSuccess(true);
      } else {
        setSubmitError(res.error || 'Failed to submit application. Please check your credentials.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Navigation Breadcrumb */}
      <div>
        <Link
          href="/student/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to Placement Opportunities
        </Link>
      </div>

      {/* Main Role Header Card */}
      <Card className="border border-border/90 shadow-sm bg-surface overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              {job.companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.companyLogoUrl}
                  alt={job.companyName || 'Company'}
                  className="w-14 h-14 rounded-xl object-contain bg-surface-hover border border-border p-1.5 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xl flex items-center justify-center shrink-0">
                  {companyInitial}
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-secondary">
                    {job.companyName || 'Campus Partner'}
                  </span>
                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Website ↗
                    </a>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-text-secondary">
                  <Badge variant="default" className="font-medium">
                    {employmentTypeLabel}
                  </Badge>
                  <span>•</span>
                  <span>{workplaceTypeLabel}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                  {job.department && (
                    <>
                      <span>•</span>
                      <span>{job.department}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Top CTA & Eligibility Indicator */}
            <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
              {hasApplied ? (
                <div className="flex flex-col sm:items-end gap-1.5">
                  <Button
                    id="apply-now-btn"
                    variant="outline"
                    size="md"
                    disabled
                    className="w-full sm:w-auto px-6 font-semibold bg-success-bg/30 text-success border-success/40 cursor-default"
                  >
                    ✓ Already Applied
                  </Button>
                  <span id="already-applied-badge" className="text-[11px] text-text-muted font-mono">
                    Status: <span className="font-semibold text-success uppercase">Applied</span>
                  </span>
                </div>
              ) : isExpired ? (
                <div className="flex flex-col sm:items-end gap-1.5">
                  <Button
                    id="apply-now-btn"
                    variant="outline"
                    size="md"
                    disabled
                    className="w-full sm:w-auto px-6 font-semibold cursor-not-allowed opacity-75"
                  >
                    Deadline Passed
                  </Button>
                  <p className="text-[11px] text-text-muted font-mono">
                    Applications Closed
                  </p>
                </div>
              ) : !eligibility.isEligible ? (
                <div className="flex flex-col sm:items-end gap-1.5">
                  <Button
                    id="apply-now-btn"
                    variant="outline"
                    size="md"
                    disabled
                    className="w-full sm:w-auto px-6 font-semibold cursor-not-allowed opacity-75"
                  >
                    Criteria Not Met
                  </Button>
                  <p className="text-[11px] text-warning font-mono">
                    Academic restriction
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:items-end gap-1.5">
                  <Button
                    id="apply-now-btn"
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setSubmitError(null);
                      setShowApplyModal(true);
                    }}
                    className="w-full sm:w-auto px-6 font-semibold"
                  >
                    Apply Now
                  </Button>
                  <p className="text-[11px] text-text-muted font-mono">
                    Closes in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-hover/60 border border-border/80">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                Compensation
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-text-primary">
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

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                Min Academic CGPA
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-text-primary">
                {job.minCgpa.toFixed(2)} / 10.00
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                Openings
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-text-primary">
                {job.numberOfOpenings ? `${job.numberOfOpenings} seats` : 'Unspecified'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                Application Deadline
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-text-primary">
                {deadline.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Eligibility Gate Card */}
      <Card
        className={`border shadow-xs ${
          eligibility.isEligible
            ? 'border-success/30 bg-success-bg/30'
            : 'border-warning/30 bg-warning-bg/30'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span>{eligibility.isEligible ? '✓' : '⚠️'}</span>
              <span>Your Placement Eligibility Status</span>
            </CardTitle>
            <Badge variant={eligibility.isEligible ? 'success' : 'warning'}>
              {eligibility.isEligible ? 'QUALIFIED TO APPLY' : 'RESTRICTED CRITERIA'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {eligibility.isEligible
              ? 'You meet all institutional academic gates, branch requirements, and graduation cohort constraints for this drive.'
              : 'One or more institutional gates currently restrict your automatic profile matching for this drive:'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* CGPA */}
            <div className="p-3 rounded-lg bg-surface/90 border border-border/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">CGPA Check</span>
                <span>{eligibility.criteria.cgpa.passed ? '✅' : '❌'}</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                {eligibility.criteria.cgpa.message}
              </p>
            </div>

            {/* Backlogs */}
            <div className="p-3 rounded-lg bg-surface/90 border border-border/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">Backlogs</span>
                <span>{eligibility.criteria.backlogs.passed ? '✅' : '❌'}</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                {eligibility.criteria.backlogs.message}
              </p>
            </div>

            {/* Branch */}
            <div className="p-3 rounded-lg bg-surface/90 border border-border/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">Department</span>
                <span>{eligibility.criteria.department.passed ? '✅' : '❌'}</span>
              </div>
              <p className="text-[11px] text-text-secondary truncate">
                {eligibility.criteria.department.message}
              </p>
            </div>

            {/* Batch Year */}
            <div className="p-3 rounded-lg bg-surface/90 border border-border/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">Graduation Batch</span>
                <span>{eligibility.criteria.batchYear.passed ? '✅' : '❌'}</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                {eligibility.criteria.batchYear.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Details & Description */}
      <Card className="border border-border/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Role Description & Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-xs sm:text-sm text-text-primary leading-relaxed">
          <div className="whitespace-pre-line text-text-secondary">
            {job.description}
          </div>

          {/* Required Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Technical Stack & Required Competencies
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-surface-hover border border-border text-text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selection & Interview Process */}
          {job.selectionProcess && (
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Interview Workflow & Selection Stages
              </h3>
              <div className="p-4 rounded-lg bg-surface-hover/60 border border-border font-mono text-xs whitespace-pre-line text-text-secondary leading-relaxed">
                {job.selectionProcess}
              </div>
            </div>
          )}

          {/* Institutional Eligibility Details */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Academic & Cohort Specifications
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-hover/40 border border-border/70">
                <dt className="text-text-muted font-medium">Eligible Degrees</dt>
                <dd className="font-semibold text-text-primary mt-0.5">{job.degree || 'B.Tech / M.Tech / MCA'}</dd>
              </div>

              <div className="p-3 rounded-lg bg-surface-hover/40 border border-border/70">
                <dt className="text-text-muted font-medium">Allowed Branches</dt>
                <dd className="font-semibold text-text-primary mt-0.5">
                  {job.allowedDepartments.length > 0 ? job.allowedDepartments.join(', ') : 'All Branches Allowed'}
                </dd>
              </div>

              <div className="p-3 rounded-lg bg-surface-hover/40 border border-border/70">
                <dt className="text-text-muted font-medium">Graduation Batches</dt>
                <dd className="font-semibold text-text-primary mt-0.5 font-mono">
                  {job.eligibleBatchYears.length > 0
                    ? job.eligibleBatchYears.map((y) => `Class of ${y}`).join(', ')
                    : 'Open to all current & upcoming batches'}
                </dd>
              </div>

              <div className="p-3 rounded-lg bg-surface-hover/40 border border-border/70">
                <dt className="text-text-muted font-medium">Maximum Active Backlogs</dt>
                <dd className="font-semibold text-text-primary mt-0.5 font-mono">
                  ≤ {job.maxActiveBacklogs} backlog(s) allowed
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Application Modal */}
      {showApplyModal && (
        <div
          id="apply-confirm-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <Card className="max-w-lg w-full border border-border shadow-2xl bg-surface animate-in zoom-in-95">
            <CardHeader className="pb-3 border-b border-border/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-text-primary">
                  {submitSuccess ? 'Application Confirmed' : 'Campus Drive Application'}
                </CardTitle>
                <button
                  type="button"
                  id="modal-close-btn"
                  onClick={() => {
                    setShowApplyModal(false);
                    setSubmitSuccess(false);
                  }}
                  className="text-text-muted hover:text-text-primary text-sm font-semibold p-1 transition-colors"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <CardDescription className="text-xs">
                {job.title} • {job.companyName || 'Corporate Partner'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {submitSuccess ? (
                /* Success Confirmation State */
                <div id="application-success-view" className="space-y-5 py-2">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-success/15 text-success mx-auto flex items-center justify-center text-2xl font-bold border border-success/30">
                      ✓
                    </div>
                    <h3 className="text-base font-bold text-text-primary">
                      Application Submitted Successfully!
                    </h3>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto">
                      Your application has been registered for this placement drive. The recruitment team will review your profile.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-hover/80 border border-border/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Application Ref</span>
                      <span id="application-reference-id" className="font-mono font-semibold text-text-primary text-[11px]">
                        {application?.id || 'APP-RECORDED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Status</span>
                      <Badge variant="success" className="font-semibold text-[10px] uppercase">
                        {application?.status || 'applied'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Position</span>
                      <span className="font-medium text-text-primary truncate max-w-[200px]">
                        {job.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Organization</span>
                      <span className="font-medium text-text-primary">
                        {job.companyName || 'Partner'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border">
                    <Link
                      href="/student/jobs"
                      className="w-full sm:w-auto text-center px-4 py-2 rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-hover border border-border transition-colors"
                    >
                      Browse Other Drives
                    </Link>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowApplyModal(false);
                        setSubmitSuccess(false);
                      }}
                      className="w-full sm:w-auto text-xs px-5"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Application Form / Submission State */
                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                  {/* Candidate Summary Box */}
                  <div className="p-3.5 rounded-xl bg-surface-hover/70 border border-border/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Candidate Profile</span>
                      <span className="font-semibold text-text-primary">
                        {studentProfile?.fullName || 'Authenticated Candidate'}
                      </span>
                    </div>
                    {studentProfile?.rollNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted font-medium">Roll Number</span>
                        <span className="font-mono text-text-primary">{studentProfile.rollNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Academic CGPA</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {studentProfile?.cgpa ? `${studentProfile.cgpa.toFixed(2)} / 10.00` : 'On file'}
                      </span>
                    </div>
                    <div className="pt-1 flex items-center gap-1.5 text-success font-medium text-[11px]">
                      <span>✓</span>
                      <span>Institutional eligibility verified and locked</span>
                    </div>
                  </div>

                  {/* Optional Cover Note */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="cover-note-input" className="font-medium text-text-primary">
                        Cover Note <span className="text-text-muted font-normal">(Optional)</span>
                      </label>
                      <span className="text-[11px] text-text-muted font-mono">
                        {coverNote.length}/2000
                      </span>
                    </div>
                    <textarea
                      id="cover-note-input"
                      rows={3}
                      maxLength={2000}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Highlight relevant projects, top skills, or notes for the recruiter..."
                      disabled={isSubmitting}
                      className="w-full text-xs p-3 rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Server/Validation Error Alert */}
                  {submitError && (
                    <div
                      id="application-error-alert"
                      role="alert"
                      className="p-3 rounded-lg text-xs bg-danger-bg text-danger border border-danger/30 font-medium space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>{submitError}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-text-muted leading-relaxed">
                    By submitting your application, your verified institutional profile, transcript, and academic records will be shared directly with {job.companyName || 'the recruiting organization'}.
                  </p>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                    <Button
                      type="button"
                      id="cancel-application-btn"
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() => setShowApplyModal(false)}
                      className="text-xs px-4"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      id="submit-application-btn"
                      variant="primary"
                      size="sm"
                      disabled={isSubmitting}
                      className="text-xs px-5 font-semibold"
                    >
                      {isSubmitting ? 'Submitting Application...' : 'Confirm & Apply'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
