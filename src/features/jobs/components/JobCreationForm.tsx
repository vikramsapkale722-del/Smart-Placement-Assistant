'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { STANDARD_DEPARTMENTS } from '@/features/jobs/schemas';
import type { JobEmploymentType, JobWorkplaceType, JobStatus } from '@/features/jobs/types';
import { createJobAction } from '@/features/jobs/actions';

const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

export function JobCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // 1. Job Overview State
  const [title, setTitle] = React.useState('');
  const [employmentType, setEmploymentType] = React.useState<JobEmploymentType>('full_time');
  const [department, setDepartment] = React.useState('Software Engineering');
  const [description, setDescription] = React.useState('');

  // 2. Workplace & Location State
  const [workplaceType, setWorkplaceType] = React.useState<JobWorkplaceType>('on_site');
  const [location, setLocation] = React.useState('');

  // 3. Compensation State
  const [ctcMin, setCtcMin] = React.useState('');
  const [ctcMax, setCtcMax] = React.useState('');
  const [stipendMonthly, setStipendMonthly] = React.useState('');
  const [ctcDisplayText, setCtcDisplayText] = React.useState('');
  const [isSalaryDisclosed, setIsSalaryDisclosed] = React.useState(true);

  // 4. Eligibility State
  const [minCgpa, setMinCgpa] = React.useState('6.00');
  const [maxActiveBacklogs, setMaxActiveBacklogs] = React.useState('0');
  const [degree, setDegree] = React.useState('B.Tech / B.E. / MCA');
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([
    'Computer Science and Engineering',
    'Information Technology',
  ]);
  const [selectedBatches, setSelectedBatches] = React.useState<number[]>([CURRENT_YEAR + 1]);
  const [skillsInput, setSkillsInput] = React.useState('React, TypeScript, SQL');

  // 5. Recruitment Process State
  const [numberOfOpenings, setNumberOfOpenings] = React.useState('');
  const [selectionProcess, setSelectionProcess] = React.useState(
    '1. Online Assessment (DSA & Aptitude)\n2. Technical Round 1\n3. Technical Round 2 & System Design\n4. HR Discussion'
  );

  // 6. Publishing Settings State
  const [applicationDeadline, setApplicationDeadline] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleBatch = (year: number) => {
    setSelectedBatches((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleSubmit = async (targetStatus: JobStatus) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title,
      description,
      employmentType,
      department: department || null,
      workplaceType,
      location,
      ctcMin: ctcMin ? parseFloat(ctcMin) : null,
      ctcMax: ctcMax ? parseFloat(ctcMax) : null,
      ctcDisplayText: ctcDisplayText || null,
      stipendMonthly: stipendMonthly ? parseFloat(stipendMonthly) : null,
      isSalaryDisclosed,
      degree: degree || 'B.Tech / B.E.',
      minCgpa: parseFloat(minCgpa) || 0.0,
      maxActiveBacklogs: parseInt(maxActiveBacklogs, 10) || 0,
      allowedDepartments: selectedDepartments,
      eligibleBatchYears: selectedBatches,
      requiredSkills: skills,
      numberOfOpenings: numberOfOpenings ? parseInt(numberOfOpenings, 10) : null,
      selectionProcess: selectionProcess || null,
      applicationDeadline: new Date(applicationDeadline).toISOString(),
      status: targetStatus,
    };

    try {
      const res = await createJobAction(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create job posting');
        setIsSubmitting(false);
        return;
      }

      router.push('/company/jobs');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg bg-error-bg/60 border border-error/30 p-4 text-xs text-error font-medium flex items-center justify-between shadow-sm"
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

      {/* SECTION 1: Job Overview */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">1. Job Overview</CardTitle>
            <Badge variant="default">OVERVIEW</Badge>
          </div>
          <CardDescription className="text-xs">
            Basic job title, role category, department, and role responsibilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="job-title"
            label="Job Title *"
            placeholder="e.g. Graduate Software Engineer (Backend)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={fieldErrors.title}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="employment-type" className="text-xs font-semibold text-text-primary">
                Job Type *
              </label>
              <select
                id="employment-type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as JobEmploymentType)}
                className="w-full px-3 py-2 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="full_time">Full-time Job</option>
                <option value="internship">Internship Only</option>
                <option value="internship_to_full_time">Internship with PPO (Full-time)</option>
              </select>
            </div>

            <Input
              id="job-department"
              label="Department / Business Unit"
              placeholder="e.g. Core Engineering, Product, Analytics"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="job-description" className="text-xs font-semibold text-text-primary">
                Job Description & Scope * (Min 20 characters)
              </label>
              <span className="text-[11px] text-text-muted">{description.length} / 5000</span>
            </div>
            <textarea
              id="job-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe candidate responsibilities, role expectations, and technical impact..."
              className="w-full px-3 py-2 text-xs rounded-md bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Workplace & Location */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">2. Workplace & Location</CardTitle>
            <Badge variant="default">LOCATION</Badge>
          </div>
          <CardDescription className="text-xs">
            Where and how the candidate will be expected to work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="workplace-type" className="text-xs font-semibold text-text-primary">
                Work Mode *
              </label>
              <select
                id="workplace-type"
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value as JobWorkplaceType)}
                className="w-full px-3 py-2 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="on_site">On-site (Office / Campus)</option>
                <option value="hybrid">Hybrid (Office & Remote)</option>
                <option value="remote">Remote (Work from Anywhere)</option>
              </select>
            </div>

            <Input
              id="job-location"
              label="Work Location *"
              placeholder="e.g. Bengaluru / Hyderabad / Pan-India"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Compensation */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">3. Compensation</CardTitle>
            <span className="text-xs font-mono font-medium text-text-muted">INR (₹)</span>
          </div>
          <CardDescription className="text-xs">
            Annual CTC (LPA) or monthly internship stipend, plus visibility configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              id="ctc-min"
              type="number"
              step="0.1"
              label="Minimum CTC (₹ LPA)"
              placeholder="e.g. 8.5"
              value={ctcMin}
              onChange={(e) => setCtcMin(e.target.value)}
            />
            <Input
              id="ctc-max"
              type="number"
              step="0.1"
              label="Maximum CTC (₹ LPA)"
              placeholder="e.g. 12.0"
              value={ctcMax}
              onChange={(e) => setCtcMax(e.target.value)}
            />
            <Input
              id="stipend"
              type="number"
              step="1000"
              label="Monthly Stipend (₹)"
              placeholder="e.g. 40000"
              value={stipendMonthly}
              onChange={(e) => setStipendMonthly(e.target.value)}
            />
            <Input
              id="ctc-display"
              label="Compensation Summary"
              placeholder="e.g. ₹8 - 12 LPA + Stock Options"
              value={ctcDisplayText}
              onChange={(e) => setCtcDisplayText(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-border flex items-center gap-3">
            <input
              id="is-salary-disclosed"
              type="checkbox"
              checked={isSalaryDisclosed}
              onChange={(e) => setIsSalaryDisclosed(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <label htmlFor="is-salary-disclosed" className="text-xs text-text-primary cursor-pointer select-none">
              <span className="font-semibold">Display compensation publicly</span> — If unchecked, compensation will be marked as &quot;Confidential / Disclosed during interview&quot;.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: Eligibility */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">4. Eligibility</CardTitle>
            <Badge variant="warning">ACADEMIC GATES</Badge>
          </div>
          <CardDescription className="text-xs">
            Minimum CGPA, backlogs, qualifying degree, allowed branches, and skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="min-cgpa"
              type="number"
              step="0.01"
              min="0.0"
              max="10.0"
              label="Minimum CGPA (out of 10.0) *"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              required
            />
            <Input
              id="max-backlogs"
              type="number"
              min="0"
              max="10"
              label="Maximum Active Backlogs *"
              value={maxActiveBacklogs}
              onChange={(e) => setMaxActiveBacklogs(e.target.value)}
              required
            />
            <Input
              id="degree-qual"
              label="Eligible Degree *"
              placeholder="e.g. B.Tech / M.Tech / MCA"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              required
            />
          </div>

          {/* Department / Branch Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">Eligible Branches / Departments</span>
              <span className="text-xs text-text-muted">
                {selectedDepartments.length} of {STANDARD_DEPARTMENTS.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STANDARD_DEPARTMENTS.map((dept) => {
                const isSelected = selectedDepartments.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDepartment(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batch Year Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">Eligible Graduation Years</span>
              <span className="text-xs text-text-muted">{selectedBatches.length} batch(es) selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BATCH_YEARS.map((year) => {
                const isSelected = selectedBatches.includes(year);
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => toggleBatch(year)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    Class of {year}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-1">
            <Input
              id="required-skills"
              label="Required Skills (Comma separated)"
              placeholder="e.g. Python, Django, PostgreSQL, Docker, AWS"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
            />
            <p className="text-[11px] text-text-muted">
              Specify the primary technical skills candidates will be evaluated on.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5: Recruitment Process */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">5. Recruitment Process</CardTitle>
            <Badge variant="default">PROCESS</Badge>
          </div>
          <CardDescription className="text-xs">
            Openings count and selection stages for candidates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="number-of-openings"
              type="number"
              min="1"
              label="Number of Openings"
              placeholder="e.g. 5"
              value={numberOfOpenings}
              onChange={(e) => setNumberOfOpenings(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="selection-process" className="text-xs font-semibold text-text-primary">
              Recruitment / Selection Rounds Description
            </label>
            <textarea
              id="selection-process"
              rows={4}
              value={selectionProcess}
              onChange={(e) => setSelectionProcess(e.target.value)}
              placeholder="Detail the interview workflow (e.g. Online Assessment -> Technical Interview -> HR Round)..."
              className="w-full px-3 py-2 text-xs rounded-md bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6: Publishing Settings */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">6. Publishing Settings</CardTitle>
            <Badge variant="default">LIFECYCLE</Badge>
          </div>
          <CardDescription className="text-xs">
            Application cut-off deadline and submission options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="deadline" className="text-xs font-semibold text-text-primary">
                Application Deadline *
              </label>
              <input
                id="deadline"
                type="datetime-local"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => router.push('/company/jobs')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              id="save-draft-btn"
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              id="publish-job-btn"
              type="button"
              variant="primary"
              size="md"
              onClick={() => handleSubmit('published')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Job'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

