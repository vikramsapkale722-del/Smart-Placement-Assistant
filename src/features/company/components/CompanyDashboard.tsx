'use client';

import * as React from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { CompanyProfile } from '@/features/company/types';
import type { CompanyProfileCompletionResult } from '@/features/company/utils/profile-completion';
import type { CompanyJobCounts } from '@/features/jobs/types';
import { CompanyVerificationBanner } from '@/features/company/components/CompanyVerificationBanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/features/auth/actions';

interface CompanyDashboardProps {
  user: User;
  profile: CompanyProfile | null;
  completion: CompanyProfileCompletionResult;
  jobCounts?: CompanyJobCounts;
}

export function CompanyDashboard({ user, profile, completion, jobCounts }: CompanyDashboardProps) {
  const companyName = profile?.name || 'Your Company';
  const initial = companyName.charAt(0).toUpperCase();
  const recruiterEmail = user.email || 'Recruiter';

  const totalJobs = jobCounts?.totalJobs ?? 0;
  const activeJobs = jobCounts?.activeJobs ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Dashboard Header Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-2xl md:text-3xl shrink-0 shadow-inner">
              {profile?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logoUrl}
                  alt={companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
                  {companyName}
                </h1>
                <Badge
                  variant={profile?.isVerified ? 'success' : 'warning'}
                  className="text-xs"
                >
                  {profile?.isVerified ? 'Verified Enterprise' : 'Pending Verification'}
                </Badge>
                {profile?.industry && (
                  <Badge variant="default" className="text-xs hidden sm:inline-flex">
                    {profile.industry}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {profile?.location ? (
                  <span>
                    Headquarters: {profile.location} {profile.companySize ? `• ${profile.companySize}` : ''}
                  </span>
                ) : (
                  <span>Enterprise Recruitment Workspace • Corporate Recruiter Portal</span>
                )}
              </p>
              <p className="text-xs text-text-muted font-mono">
                Recruiter: {recruiterEmail}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/company/jobs">
              <Button variant="outline" size="md">
                Manage Jobs
              </Button>
            </Link>
            <Link href="/company/profile">
              <Button variant="primary" size="md">
                Manage Profile
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="md">
                Portal Home
              </Button>
            </Link>
            <form action={logoutAction}>
              <Button variant="ghost" size="md" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. Verification Status Banner */}
      <CompanyVerificationBanner
        isVerified={profile?.isVerified ?? false}
        verifiedAt={profile?.verifiedAt}
      />

      {/* 3. Top Metrics Row: Profile Completion, Compliance Standing, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card A: Company Profile Completion */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Profile Completion</CardTitle>
              <Badge
                variant={
                  completion.percentage >= 80
                    ? 'success'
                    : completion.percentage >= 50
                    ? 'info'
                    : 'warning'
                }
              >
                {completion.percentage}%
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Dynamically evaluated from your corporate credentials and contact records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-surface-hover border border-border overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    completion.percentage >= 80
                      ? 'bg-success'
                      : completion.percentage >= 50
                      ? 'bg-primary'
                      : 'bg-warning'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, completion.percentage))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>{completion.completedCount} of {completion.totalCount} sections complete</span>
                <span>{100 - completion.percentage}% remaining</span>
              </div>
            </div>

            {/* Incomplete Sections Suggestions */}
            {completion.incompleteSections.length > 0 ? (
              <div className="rounded-lg bg-surface-hover/70 border border-border p-3 space-y-1.5">
                <p className="text-xs font-semibold text-text-primary">Recommended steps:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  {completion.incompleteSections.slice(0, 3).map((sec) => (
                    <li key={sec.id} className="flex items-center gap-1.5">
                      <span className="text-warning font-bold">•</span>
                      <span>{sec.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg bg-success-bg/50 border border-success/20 p-3 text-xs text-success">
                ✓ All foundational company profile sections are fully established!
              </div>
            )}

            <Link href="/company/profile" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                {completion.percentage < 100 ? 'Complete Profile →' : 'Edit Company Details'}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card B: Placement Compliance & Drive Authorization */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Drive Clearance</CardTitle>
              <span className="text-xs font-mono font-medium text-text-muted">CRITERIA</span>
            </div>
            <CardDescription className="text-xs">
              Mandatory prerequisites required to post campus placement drives and shortlist candidates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Administrative Verification</span>
                <span className={`font-semibold ${profile?.isVerified ? 'text-success' : 'text-warning'}`}>
                  {profile?.isVerified ? 'Approved' : 'Pending Review'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Corporate Identity</span>
                <span className={`font-semibold ${profile?.name && profile?.industry ? 'text-success' : 'text-warning'}`}>
                  {profile?.name && profile?.industry ? 'Recorded' : 'Incomplete'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Official Recruiter Contact</span>
                <span className={`font-semibold ${profile?.companyEmail || profile?.companyPhone ? 'text-success' : 'text-text-muted'}`}>
                  {profile?.companyEmail || profile?.companyPhone ? 'Connected' : 'Missing'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Headquarters Location</span>
                <span className={`font-semibold ${profile?.location ? 'text-success' : 'text-text-muted'}`}>
                  {profile?.location ? 'Specified' : 'Unspecified'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Hiring Readiness</span>
                <span className={`font-semibold ${completion.isReadyForHiring ? 'text-success' : 'text-text-muted'}`}>
                  {completion.isReadyForHiring ? 'Ready' : 'In Progress'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-info-bg/50 border border-info/20 text-[11px] text-text-muted leading-tight">
              Verified organizations gain instant priority placement distribution across all university departments.
            </div>
          </CardContent>
        </Card>

        {/* Card C: Quick Actions & Drive Management */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              <Badge variant="default">SHORTCUTS</Badge>
            </div>
            <CardDescription className="text-xs">
              Fast navigation to primary recruiter operations and placement portals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/company/jobs/new" className="block">
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-text-primary">Create Placement Drive</p>
                    <Badge variant="success" className="text-[10px] py-0 px-1.5">NEW</Badge>
                  </div>
                  <p className="text-[11px] text-text-secondary">Publish an opening with eligibility rules</p>
                </div>
                <span className="text-primary text-xs font-semibold">+ Post →</span>
              </div>
            </Link>

            <Link href="/company/jobs" className="block">
              <div className="p-3 rounded-lg border border-border bg-surface-hover/50 hover:bg-surface-hover transition-colors flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-text-primary">Manage Job Postings</p>
                    <span className="text-[11px] font-mono text-text-muted">
                      ({totalJobs} total)
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary">View draft and published openings</p>
                </div>
                <span className="text-primary text-xs font-semibold">View →</span>
              </div>
            </Link>

            <Link href="/company/profile" className="block">
              <div className="p-3 rounded-lg border border-border bg-surface-hover/50 hover:bg-surface-hover transition-colors flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-text-primary">Company Profile</p>
                  <p className="text-[11px] text-text-secondary">Update logos, contacts, and description</p>
                </div>
                <span className="text-primary text-xs font-semibold">Edit →</span>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 4. Recruitment KPI Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Drives */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Active Drives</span>
              <span className={`w-2 h-2 rounded-full ${activeJobs > 0 ? 'bg-success' : 'bg-text-muted'}`}></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text-primary">{activeJobs}</span>
              <span className="text-xs text-text-muted font-medium">drives</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1">Live recruitment seasons</p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Job Listings */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Total Jobs</span>
              <span className={`w-2 h-2 rounded-full ${totalJobs > 0 ? 'bg-primary' : 'bg-text-muted'}`}></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text-primary">{totalJobs}</span>
              <span className="text-xs text-text-muted font-medium">openings</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1">Configured job roles</p>
          </CardContent>
        </Card>

        {/* KPI 3: Total Inbound Applications */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Total Applications</span>
              <span className="w-2 h-2 rounded-full bg-info"></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text-primary">0</span>
              <span className="text-xs text-text-muted font-medium">candidates</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1">Received student submissions</p>
          </CardContent>
        </Card>

        {/* KPI 4: Pending Review */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Pending Review</span>
              <span className="w-2 h-2 rounded-full bg-warning"></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text-primary">0</span>
              <span className="text-xs text-text-muted font-medium">actionable</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1">Awaiting recruiter action</p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Organization Overview & Attributes Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-semibold">Corporate Overview</CardTitle>
            <CardDescription className="text-xs">
              Organizational profile attributes registered in the institutional recruitment network.
            </CardDescription>
          </div>
          <Link href="/company/profile">
            <Button variant="outline" size="sm" className="text-xs">
              Edit Details
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">Industry Sector</span>
              <p className="text-sm font-semibold text-text-primary truncate">
                {profile?.industry || 'Not Provided'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">Headquarters</span>
              <p className="text-sm font-semibold text-text-primary truncate">
                {profile?.location || 'Not Provided'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">Organization Scale</span>
              <p className="text-sm font-semibold text-text-primary truncate">
                {profile?.companySize || 'Not Specified'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">Founded Year</span>
              <p className="text-sm font-bold text-primary font-mono">
                {profile?.foundedYear ? profile.foundedYear : '—'}
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-text-primary">About Organization</span>
            {profile?.description ? (
              <p className="text-xs text-text-secondary leading-relaxed bg-surface-hover/30 p-3 rounded-lg border border-border">
                {profile.description}
              </p>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border text-center text-xs text-text-muted">
                No corporate description on file.{' '}
                <Link href="/company/profile" className="text-primary underline font-medium">
                  Add an overview
                </Link>{' '}
                to introduce your company to campus candidates.
              </div>
            )}
          </div>

          {/* Contact & Links Bar */}
          <div className="border-t border-border pt-4 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-text-primary">Corporate Links:</span>
            {profile?.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-mono"
              >
                Website ↗
              </a>
            ) : (
              <span className="text-text-muted">Website: None</span>
            )}
            <span className="text-border">•</span>
            {profile?.linkedinUrl ? (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-mono"
              >
                LinkedIn ↗
              </a>
            ) : (
              <span className="text-text-muted">LinkedIn: None</span>
            )}
            <span className="text-border">•</span>
            <span className="text-text-secondary">
              Contact: {profile?.companyEmail || recruiterEmail}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 6. Bottom Grid: Opportunities Preview & Application Activity Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section A: Campus Placement Drives Preview */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Campus Placement Drives</CardTitle>
              <CardDescription className="text-xs">
                Active hiring campaigns and eligibility criteria for campus talent pools.
              </CardDescription>
            </div>
            <Link href="/company/jobs">
              <Badge variant="default" className="text-[11px] hover:bg-surface-hover cursor-pointer">
                {totalJobs} Configured →
              </Badge>
            </Link>
          </CardHeader>
          <CardContent>
            {totalJobs > 0 ? (
              <div className="p-6 rounded-lg border border-border bg-surface-hover/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-text-primary">
                      {companyName} Placement Drives
                    </p>
                    <p className="text-xs text-text-secondary">
                      {activeJobs} active drive(s) currently open for student applications.
                    </p>
                  </div>
                  <Link href="/company/jobs">
                    <Button variant="primary" size="sm" className="text-xs">
                      View Openings →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-lg border border-dashed border-border bg-surface-hover/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface border border-border mx-auto flex items-center justify-center text-text-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text-primary">
                    No placement drives published yet
                  </p>
                  <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                    Create your first placement drive with custom CGPA gates and department eligibility.
                  </p>
                </div>
                <div className="pt-1">
                  <Link href="/company/jobs/new">
                    <Button variant="primary" size="sm" className="text-xs">
                      + Post First Job
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section B: Application Pipeline Preview */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Candidate Screening Pipeline</CardTitle>
              <CardDescription className="text-xs">
                Inbound student applications, screening stages, and assessment rounds.
              </CardDescription>
            </div>
            <Badge variant="default" className="text-[11px]">Phase 8 Preview</Badge>
          </CardHeader>
          <CardContent>
            <div className="p-8 rounded-lg border border-dashed border-border bg-surface-hover/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface border border-border mx-auto flex items-center justify-center text-text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  No applicants awaiting screening
                </p>
                <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                  Candidate resume matching, test scores, interview scheduling, and placement offers will be processed in Phase 8.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7. System Audit & Organization Milestones */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recruiter Account & System Milestones</CardTitle>
          <CardDescription className="text-xs">
            Chronological audit of enterprise authorization and verification status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-text-primary">Recruiter Session Authorized</p>
                <p className="text-text-muted">
                  Authenticated session established with company role access boundaries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  profile?.name ? 'bg-success' : 'bg-warning'
                }`}
              />
              <div>
                <p className="font-semibold text-text-primary">
                  {profile?.name ? 'Corporate Identity Initialized' : 'Company Profile Awaiting Setup'}
                </p>
                <p className="text-text-muted">
                  {profile?.name
                    ? `Registered as ${profile.name} (${profile.industry}). Profile is ${completion.percentage}% complete.`
                    : 'Please establish your organization name, industry, and contact info in the profile editor.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  profile?.isVerified ? 'bg-success' : 'bg-warning'
                }`}
              />
              <div>
                <p className="font-semibold text-text-primary">
                  {profile?.isVerified ? 'Institutional Verification Complete' : 'Verification Under Administrative Review'}
                </p>
                <p className="text-text-muted">
                  {profile?.isVerified
                    ? 'Placement cell verified this organization for active recruitment participation.'
                    : 'Campus placement administrators are reviewing your corporate credentials.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
