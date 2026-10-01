'use client';

import * as React from 'react';
import type { JobPosting, StudentJobFilters as FiltersState } from '@/features/jobs/types';
import type { CompleteStudentProfile } from '@/features/student/types';
import { StudentJobFilters } from '@/features/jobs/components/StudentJobFilters';
import { StudentJobCard } from '@/features/jobs/components/StudentJobCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { evaluateJobEligibility } from '@/services/eligibility.service';

interface StudentJobListingProps {
  initialJobs: JobPosting[];
  studentProfile?: CompleteStudentProfile | null;
}

const DEFAULT_FILTERS: FiltersState = {
  search: '',
  employmentType: 'all',
  workplaceType: 'all',
  department: 'all',
  minCgpa: undefined,
  batchYear: undefined,
  onlyEligible: false,
  sortBy: 'newest',
  page: 1,
  pageSize: 9,
};

export function StudentJobListing({ initialJobs, studentProfile }: StudentJobListingProps) {
  const [filters, setFilters] = React.useState<FiltersState>(DEFAULT_FILTERS);

  // Compute filtered & sorted jobs
  const filteredJobs = React.useMemo(() => {
    let result = [...initialJobs];

    // 1. Search Query
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((j) => {
        const titleMatch = j.title.toLowerCase().includes(q);
        const companyMatch = (j.companyName || '').toLowerCase().includes(q);
        const deptMatch = (j.department || '').toLowerCase().includes(q);
        const skillsMatch = (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q));
        const locationMatch = j.location.toLowerCase().includes(q);
        return titleMatch || companyMatch || deptMatch || skillsMatch || locationMatch;
      });
    }

    // 2. Employment Type Filter
    if (filters.employmentType && filters.employmentType !== 'all') {
      result = result.filter((j) => j.employmentType === filters.employmentType);
    }

    // 3. Workplace Mode Filter
    if (filters.workplaceType && filters.workplaceType !== 'all') {
      result = result.filter((j) => j.workplaceType === filters.workplaceType);
    }

    // 4. Department / Branch Filter
    if (filters.department && filters.department !== 'all') {
      const targetDept = filters.department.trim().toLowerCase();
      result = result.filter((j) => {
        const inAllowed = (j.allowedDepartments || []).some(
          (d) => d.trim().toLowerCase() === targetDept
        );
        const inDept = (j.department || '').toLowerCase().includes(targetDept);
        return inAllowed || inDept || (j.allowedDepartments || []).length === 0;
      });
    }

    // 5. Graduation Batch Year Filter
    if (filters.batchYear) {
      const targetYear = filters.batchYear;
      result = result.filter(
        (j) =>
          !j.eligibleBatchYears ||
          j.eligibleBatchYears.length === 0 ||
          j.eligibleBatchYears.includes(targetYear)
      );
    }

    // 6. Only Eligible Filter
    if (filters.onlyEligible && studentProfile) {
      result = result.filter((j) => {
        const evalResult = evaluateJobEligibility(studentProfile, j);
        return evalResult.isEligible;
      });
    }

    // 7. Sorting
    if (filters.sortBy === 'deadline') {
      result.sort(
        (a, b) => new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime()
      );
    } else if (filters.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sortBy === 'ctc_desc') {
      result.sort((a, b) => (b.ctcMax || b.ctcMin || 0) - (a.ctcMax || a.ctcMin || 0));
    } else {
      // Default: newest first
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [initialJobs, filters, studentProfile]);

  // Pagination calculation
  const pageSize = filters.pageSize || 9;
  const totalCount = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, filters.page || 1), totalPages);

  const paginatedJobs = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.employmentType && filters.employmentType !== 'all') ||
    (filters.workplaceType && filters.workplaceType !== 'all') ||
    (filters.department && filters.department !== 'all') ||
    Boolean(filters.batchYear) ||
    Boolean(filters.onlyEligible);

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <StudentJobFilters
        filters={filters}
        onChange={setFilters}
        onClear={handleClearFilters}
        hasStudentProfile={Boolean(studentProfile)}
        totalResults={filteredJobs.length}
      />

      {/* Zero Jobs Empty State */}
      {paginatedJobs.length === 0 ? (
        <Card className="border border-border/80 shadow-xs text-center py-16 px-4">
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
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-text-primary">
                {hasActiveFilters
                  ? 'No placement openings match your filters'
                  : 'No active recruitment drives available yet'}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {hasActiveFilters
                  ? 'Try broadening your search query or clearing specific branch and workplace filters to view more opportunities.'
                  : 'Campus placement partners will publish new roles as recruitment cycles open. Please check back soon.'}
              </p>
            </div>
            {hasActiveFilters && (
              <div className="pt-2">
                <Button
                  id="reset-search-btn"
                  variant="primary"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Reset Search & Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Job Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedJobs.map((job) => (
              <StudentJobCard
                key={job.id}
                job={job}
                studentProfile={studentProfile}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/80">
              <span className="text-xs text-text-muted">
                Showing{' '}
                <span className="font-semibold text-text-primary">
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-text-primary">
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>{' '}
                of <span className="font-semibold text-text-primary">{totalCount}</span> opportunities
              </span>

              <div className="flex items-center gap-2">
                <Button
                  id="pagination-prev-btn"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: currentPage - 1 }))}
                  className="text-xs h-8 px-3"
                >
                  ← Previous
                </Button>

                <span className="text-xs font-mono font-medium px-2 text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  id="pagination-next-btn"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: currentPage + 1 }))}
                  className="text-xs h-8 px-3"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
