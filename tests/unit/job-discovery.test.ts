import { describe, it, expect, beforeEach } from 'vitest';
import { jobService } from '@/services/job.service';

describe('Job Discovery & Filtering Unit Tests (TASK-011)', () => {
  it('discovers only published jobs with active deadlines', async () => {
    const res = await jobService.getPublishedJobs();
    expect(res.jobs.length).toBeGreaterThan(0);
    const now = Date.now();

    for (const job of res.jobs) {
      expect(job.status).toBe('published');
      expect(new Date(job.applicationDeadline).getTime()).toBeGreaterThan(now);
    }
  });

  it('filters jobs by free-text search query across title, company, and skills', async () => {
    // Search by title keyword
    const titleRes = await jobService.getPublishedJobs({ search: 'Frontend' });
    expect(titleRes.jobs.length).toBeGreaterThan(0);
    expect(
      titleRes.jobs.every(
        (j) =>
          j.title.toLowerCase().includes('frontend') ||
          (j.requiredSkills || []).some((s) => s.toLowerCase().includes('frontend'))
      )
    ).toBe(true);

    // Search by skill keyword
    const skillRes = await jobService.getPublishedJobs({ search: 'React' });
    expect(skillRes.jobs.length).toBeGreaterThan(0);
    expect(
      skillRes.jobs.every(
        (j) =>
          j.title.toLowerCase().includes('react') ||
          (j.requiredSkills || []).some((s) => s.toLowerCase().includes('react'))
      )
    ).toBe(true);

    // Search by company keyword
    const compRes = await jobService.getPublishedJobs({ search: 'Nexus' });
    expect(compRes.jobs.length).toBeGreaterThan(0);
    expect(
      compRes.jobs.every((j) => (j.companyName || '').toLowerCase().includes('nexus'))
    ).toBe(true);
  });

  it('filters jobs by employment type', async () => {
    const fullTimeRes = await jobService.getPublishedJobs({ employmentType: 'full_time' });
    expect(fullTimeRes.jobs.length).toBeGreaterThan(0);
    expect(fullTimeRes.jobs.every((j) => j.employmentType === 'full_time')).toBe(true);

    const internRes = await jobService.getPublishedJobs({ employmentType: 'internship' });
    expect(internRes.jobs.length).toBeGreaterThan(0);
    expect(internRes.jobs.every((j) => j.employmentType === 'internship')).toBe(true);
  });

  it('filters jobs by workplace mode', async () => {
    const remoteRes = await jobService.getPublishedJobs({ workplaceType: 'remote' });
    expect(remoteRes.jobs.length).toBeGreaterThan(0);
    expect(remoteRes.jobs.every((j) => j.workplaceType === 'remote')).toBe(true);

    const hybridRes = await jobService.getPublishedJobs({ workplaceType: 'hybrid' });
    expect(hybridRes.jobs.length).toBeGreaterThan(0);
    expect(hybridRes.jobs.every((j) => j.workplaceType === 'hybrid')).toBe(true);
  });

  it('filters jobs by department', async () => {
    const cseRes = await jobService.getPublishedJobs({
      department: 'Computer Science and Engineering',
    });
    expect(cseRes.jobs.length).toBeGreaterThan(0);
    expect(
      cseRes.jobs.every(
        (j) =>
          j.allowedDepartments.length === 0 ||
          j.allowedDepartments.some((d) => d.includes('Computer Science')) ||
          (j.department || '').includes('Computer Science')
      )
    ).toBe(true);
  });

  it('sorts jobs by deadline ascending', async () => {
    const res = await jobService.getPublishedJobs({ sortBy: 'deadline' });
    expect(res.jobs.length).toBeGreaterThan(1);

    for (let i = 0; i < res.jobs.length - 1; i++) {
      const current = new Date(res.jobs[i]!.applicationDeadline).getTime();
      const next = new Date(res.jobs[i + 1]!.applicationDeadline).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it('sorts jobs by title ascending', async () => {
    const res = await jobService.getPublishedJobs({ sortBy: 'title' });
    expect(res.jobs.length).toBeGreaterThan(1);

    for (let i = 0; i < res.jobs.length - 1; i++) {
      expect(res.jobs[i]!.title.localeCompare(res.jobs[i + 1]!.title)).toBeLessThanOrEqual(0);
    }
  });

  it('paginates results accurately', async () => {
    const page1 = await jobService.getPublishedJobs({ page: 1, pageSize: 2 });
    expect(page1.jobs.length).toBeLessThanOrEqual(2);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);
    expect(page1.totalPages).toBeGreaterThanOrEqual(1);

    if (page1.totalPages > 1) {
      const page2 = await jobService.getPublishedJobs({ page: 2, pageSize: 2 });
      expect(page2.page).toBe(2);
      expect(page2.jobs[0]?.id).not.toBe(page1.jobs[0]?.id);
    }
  });

  it('retrieves published job details by ID', async () => {
    const listRes = await jobService.getPublishedJobs();
    const firstJob = listRes.jobs[0]!;

    const details = await jobService.getPublishedJobById(firstJob.id);
    expect(details).not.toBeNull();
    expect(details?.id).toBe(firstJob.id);
    expect(details?.title).toBe(firstJob.title);
    expect(details?.companyName).toBeDefined();
  });

  it('returns null when querying draft or nonexistent job via getPublishedJobById', async () => {
    const notFound = await jobService.getPublishedJobById('non-existent-id-12345');
    expect(notFound).toBeNull();
  });
});
