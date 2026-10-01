'use client';

import * as React from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { CompleteStudentProfile } from '@/features/student/types';
import type { ProfileCompletionResult } from '@/features/student/utils/profile-completion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface StudentDashboardProps {
  user: User;
  profile: CompleteStudentProfile | null;
  completion: ProfileCompletionResult;
}

export function StudentDashboard({ user, profile, completion }: StudentDashboardProps) {
  const displayName = profile?.fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Dashboard Header Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-2xl md:text-3xl shrink-0">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
                  Welcome back, {displayName}
                </h1>
                <Badge variant={completion.isReadyForPlacements ? 'success' : 'default'} className="text-xs">
                  {completion.isReadyForPlacements ? 'Placement Ready' : 'Profile in Progress'}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">
                {profile?.degree && profile?.department ? (
                  <span>
                    {profile.degree} in {profile.department} • Class of {profile.batchYear}
                  </span>
                ) : (
                  <span>Institutional Placement Workspace • Candidate Dashboard</span>
                )}
              </p>
              <p className="text-xs text-text-muted font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/student/profile">
              <Button variant="primary" size="md">
                Edit Profile
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="md">
                Portal Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards Row: Profile Completion, Placement Readiness, Resume Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card A: Profile Completion */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Profile Completion</CardTitle>
              <Badge variant={completion.percentage >= 80 ? 'success' : completion.percentage >= 50 ? 'info' : 'warning'}>
                {completion.percentage}%
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Calculated dynamically from your verified academic and profile records.
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

            {/* Incomplete Sections Feedback */}
            {completion.incompleteSections.length > 0 ? (
              <div className="rounded-lg bg-surface-hover/70 border border-border p-3 space-y-1.5">
                <p className="text-xs font-semibold text-text-primary">Suggested next steps:</p>
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
                ✓ All foundational profile sections are fully filled out!
              </div>
            )}

            <Link href="/student/profile" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                {completion.percentage < 100 ? 'Complete Profile →' : 'Review Profile Details'}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card B: Placement Readiness Overview */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Placement Readiness</CardTitle>
              <span className="text-xs font-mono font-medium text-text-muted">CRITERIA</span>
            </div>
            <CardDescription className="text-xs">
              Live checklist of essential attributes evaluated by automated drive screeners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Academic Credentials</span>
                <span className={`font-semibold ${profile?.rollNumber && profile?.cgpa > 0 ? 'text-success' : 'text-warning'}`}>
                  {profile?.rollNumber && profile?.cgpa > 0 ? 'Recorded' : 'Pending CGPA'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Technical Skills</span>
                <span className={`font-semibold ${profile?.skills && profile.skills.length > 0 ? 'text-success' : 'text-text-muted'}`}>
                  {profile?.skills && profile.skills.length > 0 ? `${profile.skills.length} Added` : 'Missing'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Project Showcase</span>
                <span className={`font-semibold ${profile?.projects && profile.projects.length > 0 ? 'text-success' : 'text-text-muted'}`}>
                  {profile?.projects && profile.projects.length > 0 ? `${profile.projects.length} Listed` : 'None Listed'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Professional Portfolio</span>
                <span className={`font-semibold ${profile?.githubUrl || profile?.portfolioUrl ? 'text-success' : 'text-text-muted'}`}>
                  {profile?.githubUrl || profile?.portfolioUrl ? 'Linked' : 'Not Linked'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-text-secondary">Resume Document</span>
                <span className="font-semibold text-warning">Not Uploaded</span>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-info-bg/50 border border-info/20 text-[11px] text-text-muted leading-tight">
              Recruiters prioritize candidates with updated skills and project repositories.
            </div>
          </CardContent>
        </Card>

        {/* Card C: Resume Status Card */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Resume Status</CardTitle>
              <Badge variant="warning">Not Uploaded</Badge>
            </div>
            <CardDescription className="text-xs">
              Primary PDF resume used for single-click job drive applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-dashed border-border bg-surface-hover/40 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-surface border border-border mx-auto flex items-center justify-center text-text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              </div>
              <p className="text-xs font-semibold text-text-primary">No resume on file</p>
              <p className="text-[11px] text-text-muted leading-tight">
                Dedicated PDF resume storage and signed link distribution will be unlocked in Phase 10.
              </p>
            </div>

            <Link href="/student/profile" className="block pt-1">
              <Button variant="ghost" size="sm" className="w-full text-xs border border-border">
                Manage Profile Experience →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 3. Middle Row: Comprehensive Profile Summary Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-semibold">Academic & Profile Summary</CardTitle>
            <CardDescription className="text-xs">
              Live attributes currently registered in the institutional database.
            </CardDescription>
          </div>
          <Link href="/student/profile">
            <Button variant="outline" size="sm" className="text-xs">
              Edit Details
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">Institution</span>
              <p className="text-sm font-semibold text-text-primary truncate">
                {profile?.collegeName || 'Not Provided'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">Program & Branch</span>
              <p className="text-sm font-semibold text-text-primary truncate">
                {profile?.degree || '—'} • {profile?.department || 'Not Provided'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">University Roll No.</span>
              <p className="text-sm font-semibold text-text-primary font-mono truncate">
                {profile?.rollNumber || 'Pending'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-hover/50 border border-border">
              <span className="text-[11px] text-text-muted uppercase font-medium">Academic CGPA</span>
              <p className="text-sm font-bold text-primary font-mono">
                {profile?.cgpa ? Number(profile.cgpa).toFixed(2) : '0.00'} / 10.0
              </p>
            </div>
          </div>

          {/* Skills Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">Registered Competencies</span>
              <span className="text-xs text-text-muted">
                {profile?.skills?.length || 0} skills active
              </span>
            </div>
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <Badge
                    key={i}
                    variant={skill.category === 'technical' ? 'default' : 'info'}
                    className="text-xs px-2.5 py-1"
                  >
                    {skill.name}
                    {skill.proficiency && (
                      <span className="ml-1 opacity-60 text-[10px]">({skill.proficiency})</span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border text-center text-xs text-text-muted">
                No technical skills recorded yet.{' '}
                <Link href="/student/profile" className="text-primary underline font-medium">
                  Add your skills
                </Link>{' '}
                to improve eligibility matching.
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="border-t border-border pt-4 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-text-primary">Portfolio Links:</span>
            {profile?.githubUrl ? (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-mono"
              >
                GitHub ↗
              </a>
            ) : (
              <span className="text-text-muted">GitHub: None</span>
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
            {profile?.portfolioUrl ? (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-mono"
              >
                Portfolio ↗
              </a>
            ) : (
              <span className="text-text-muted">Portfolio: None</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Bottom Grid: Opportunities Preview & Application Activity Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 7: Opportunities Preview Area (Future Job Listings) */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Campus Placement Drives</CardTitle>
              <CardDescription className="text-xs">
                Active recruitment drives matching your department and CGPA.
              </CardDescription>
            </div>
            <Badge variant="default" className="text-[11px]">Upcoming Season</Badge>
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
                    d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  Corporate Placement Drives Active
                </p>
                <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                  Explore published placement openings, review your personalized academic eligibility, and evaluate packages across verified corporate partners.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/student/jobs">
                  <Button id="dashboard-explore-jobs-btn" variant="primary" size="sm" className="text-xs">
                    Explore Placement Drives →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 8: Application Activity Preview Area */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Application Pipeline</CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of submitted drives, assessment rounds, and offers.
              </CardDescription>
            </div>
            <Badge variant="default" className="text-[11px]">0 Active</Badge>
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
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  No active drive applications
                </p>
                <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                  When you apply to upcoming corporate hiring drives, stage progressions (Applied → Shortlisted → Interview → Offered) will appear here.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/student/applications">
                  <Button id="dashboard-track-applications-btn" variant="outline" size="sm" className="text-xs">
                    Track Applications →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Section 9: Recent Milestones & Account Audit Area */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Account Status & System Milestones</CardTitle>
          <CardDescription className="text-xs">
            Chronological audit of candidate initialization and credential verifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-text-primary">Authenticated Student Clearance</p>
                <p className="text-text-muted">
                  Account session verified with student role authorization boundaries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${profile?.rollNumber ? 'bg-success' : 'bg-warning'}`} />
              <div>
                <p className="font-semibold text-text-primary">
                  {profile?.rollNumber ? 'Academic Profile Initialized' : 'Profile Awaiting Academic Data'}
                </p>
                <p className="text-text-muted">
                  {profile?.rollNumber
                    ? `Registered under ${profile.department} (Roll No: ${profile.rollNumber}) with CGPA ${Number(profile.cgpa).toFixed(2)}.`
                    : 'Please complete your university roll number, department, and CGPA in the profile editor.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-text-muted mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-text-primary">Upcoming Placement Drives</p>
                <p className="text-text-muted">
                  Institutional notifications and employer invitations will be dispatched here once drives begin.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
