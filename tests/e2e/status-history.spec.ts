import { test, expect } from '@playwright/test';

test.describe('Application Status History Modal & Audit Transparency (TASK-016)', () => {
  const recruiterApplicantRoute = '/company/jobs/job-seed-001/applicants';
  const studentApplicationsRoute = '/student/applications';

  test.describe('Unauthenticated Access Protection', () => {
    test('Unauthenticated user visiting /student/applications is redirected to /login with redirectTo param', async ({
      page,
    }) => {
      await page.goto(studentApplicationsRoute);
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fapplications/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Unauthenticated user visiting recruiter applicants route is redirected to /login with redirectTo param', async ({
      page,
    }) => {
      await page.goto(recruiterApplicantRoute);
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs%2Fjob-seed-001%2Fapplicants/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });
  });

  test.describe('Role Spoofing & Tenant Isolation Resistance', () => {
    test('Company role cookie spoofing cannot access student status tracking view', async ({
      context,
      page,
    }) => {
      await context.addCookies([
        {
          name: 'user_role',
          value: 'company',
          domain: 'localhost',
          path: '/',
        },
      ]);
      await page.goto(studentApplicationsRoute);
      await expect(page).not.toHaveURL(studentApplicationsRoute);
      await expect(page).toHaveURL(/\/login/);
    });

    test('Student role cookie spoofing cannot access recruiter candidate review board', async ({
      context,
      page,
    }) => {
      await context.addCookies([
        {
          name: 'user_role',
          value: 'student',
          domain: 'localhost',
          path: '/',
        },
      ]);
      await page.goto(recruiterApplicantRoute);
      await expect(page).not.toHaveURL(recruiterApplicantRoute);
      await expect(page).toHaveURL(/\/login/);
    });

    test('Cross-tenant company ID injection cannot access unauthorized applicant audit history', async ({
      context,
      page,
    }) => {
      await context.addCookies([
        {
          name: 'user_role',
          value: 'company',
          domain: 'localhost',
          path: '/',
        },
        {
          name: 'company_id',
          value: 'unauthorized-competitor-org',
          domain: 'localhost',
          path: '/',
        },
      ]);
      await page.goto(recruiterApplicantRoute);
      await expect(page).not.toHaveURL(recruiterApplicantRoute);
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side localStorage role manipulation cannot access student or recruiter status history', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'student');
        localStorage.setItem('user_role', 'student');
        localStorage.setItem('company_id', 'company-seed-001');
      });

      await page.goto(studentApplicationsRoute);
      await expect(page).not.toHaveURL(studentApplicationsRoute);
      await expect(page).toHaveURL(/\/login/);

      await page.goto(recruiterApplicantRoute);
      await expect(page).not.toHaveURL(recruiterApplicantRoute);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Multi-Device Responsive QA (375px, 768px, 1440px)', () => {
    const viewports = [
      { name: 'Mobile (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      test(`Student application status view protected redirect renders on ${vp.name} without horizontal overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(studentApplicationsRoute);
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fapplications/);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });

      test(`Recruiter applicant audit view protected redirect renders on ${vp.name} without horizontal overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(recruiterApplicantRoute);
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs%2Fjob-seed-001%2Fapplicants/);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
