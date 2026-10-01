'use client';

import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { STANDARD_DEPARTMENTS } from '@/features/jobs/schemas';
import type {
  JobEmploymentType,
  JobWorkplaceType,
  StudentJobFilters as FiltersState,
  StudentJobSortOption,
} from '@/features/jobs/types';

interface StudentJobFiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  onClear: () => void;
  hasStudentProfile: boolean;
  totalResults: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const BATCH_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

export function StudentJobFilters({
  filters,
  onChange,
  onClear,
  hasStudentProfile,
  totalResults,
}: StudentJobFiltersProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState(false);

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.employmentType && filters.employmentType !== 'all') ||
    (filters.workplaceType && filters.workplaceType !== 'all') ||
    (filters.department && filters.department !== 'all') ||
    Boolean(filters.minCgpa) ||
    Boolean(filters.batchYear) ||
    Boolean(filters.onlyEligible);

  const handleSearchChange = (val: string) => {
    onChange({ ...filters, search: val, page: 1 });
  };

  const handleClearSearch = () => {
    onChange({ ...filters, search: '', page: 1 });
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Search Input, Quick Sort & Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Field with Icon & Clear */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <Input
            id="job-search-input"
            type="text"
            placeholder="Search by role title, company, skills (e.g. React, Python), or department..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-8 text-xs h-10 w-full"
          />
          {filters.search && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search text"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="sort-selector" className="text-xs font-medium text-text-secondary whitespace-nowrap hidden sm:inline">
            Sort by:
          </label>
          <select
            id="sort-selector"
            aria-label="Sort jobs by"
            value={filters.sortBy || 'newest'}
            onChange={(e) =>
              onChange({ ...filters, sortBy: e.target.value as StudentJobSortOption, page: 1 })
            }
            className="px-3 py-2 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 h-10"
          >
            <option value="newest">Newest First</option>
            <option value="deadline">Application Deadline</option>
            <option value="ctc_desc">Highest Package (CTC)</option>
            <option value="title">Role Title (A-Z)</option>
          </select>

          {/* Filter Drawer Toggle on Mobile / Compact screens */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`h-10 text-xs px-3 sm:hidden ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
          >
            Filters {hasActiveFilters && '•'}
          </Button>
        </div>
      </div>

      {/* Filter Panel (Always visible on md+, collapsible on mobile) */}
      <div
        className={`${
          isFilterPanelOpen ? 'block' : 'hidden sm:block'
        } p-4 rounded-xl border border-border/80 bg-surface/70 shadow-xs space-y-4`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Employment Type */}
          <div className="space-y-1">
            <label htmlFor="filter-employment-type" className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Employment Type
            </label>
            <select
              id="filter-employment-type"
              value={filters.employmentType || 'all'}
              onChange={(e) =>
                onChange({
                  ...filters,
                  employmentType: e.target.value as JobEmploymentType | 'all',
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Types</option>
              <option value="full_time">Full-Time Job</option>
              <option value="internship">Internship</option>
              <option value="internship_to_full_time">Internship + PPO</option>
            </select>
          </div>

          {/* 2. Workplace Mode */}
          <div className="space-y-1">
            <label htmlFor="filter-workplace-type" className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Work Mode
            </label>
            <select
              id="filter-workplace-type"
              value={filters.workplaceType || 'all'}
              onChange={(e) =>
                onChange({
                  ...filters,
                  workplaceType: e.target.value as JobWorkplaceType | 'all',
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Modes</option>
              <option value="on_site">On-site Campus/Office</option>
              <option value="hybrid">Hybrid (Office & Remote)</option>
              <option value="remote">Fully Remote</option>
            </select>
          </div>

          {/* 3. Department / Branch */}
          <div className="space-y-1">
            <label htmlFor="filter-department" className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Branch / Department
            </label>
            <select
              id="filter-department"
              value={filters.department || 'all'}
              onChange={(e) =>
                onChange({
                  ...filters,
                  department: e.target.value,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Departments</option>
              {STANDARD_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Graduation Batch */}
          <div className="space-y-1">
            <label htmlFor="filter-batch" className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Graduation Year
            </label>
            <select
              id="filter-batch"
              value={filters.batchYear || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  batchYear: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Batches</option>
              {BATCH_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  Class of {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lower row: Only Eligible Toggle & Clear Filters Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2">
            {hasStudentProfile && (
              <label
                htmlFor="filter-only-eligible"
                className="flex items-center gap-2 text-xs font-medium text-text-primary cursor-pointer select-none"
              >
                <input
                  id="filter-only-eligible"
                  type="checkbox"
                  checked={Boolean(filters.onlyEligible)}
                  onChange={(e) =>
                    onChange({ ...filters, onlyEligible: e.target.checked, page: 1 })
                  }
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span>Show Only Roles I Am Eligible For</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-text-muted">
              {totalResults} opening{totalResults === 1 ? '' : 's'} matching
            </span>
            {hasActiveFilters && (
              <Button
                id="clear-filters-btn"
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-xs text-primary hover:text-primary/80 h-8 px-2.5"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
