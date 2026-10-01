import { test, expect } from '@playwright/test';

test.describe('Recruiter Applicant Management Board (TASK-014)', () => {
  const targetJobId = 'job-seed-001';
  const targetRoute = `/company/jobs/${targetJobId}/applicants`;

  test.describe('Authentication & Route Protection', () => {
    test('Unauthenticated user visiting /company/jobs/[id]/applicants is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto(targetRoute);
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs%2Fjob-seed-001%2Fapplicants/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Student role cookie spoofing cannot access /company/jobs/[id]/applicants', async ({
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

      await page.goto(targetRoute);
      await expect(page).not.toHaveURL(targetRoute);
      await expect(page).toHaveURL(/\/login/);
    });

    test('Admin role cookie spoofing without server session cannot access /company/jobs/[id]/applicants', async ({
      context,
      page,
    }) => {
      await context.addCookies([
        {
          name: 'user_role',
          value: 'admin',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto(targetRoute);
      await expect(page).not.toHaveURL(targetRoute);
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side role spoofing in localStorage cannot bypass recruiter applicant board authorization', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'company');
        localStorage.setItem('user_role', 'company');
      });

      await page.goto(targetRoute);
      await expect(page).not.toHaveURL(targetRoute);
      await expect(page).toHaveURL(/\/login/);
    });

    test('Arbitrary company cookie injection without verified server session is rejected', async ({
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
          value: 'company-nexus-tech',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto(targetRoute);
      await expect(page).not.toHaveURL(targetRoute);
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
      test(`Renders protected redirect cleanly on ${vp.name} without horizontal overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(targetRoute);
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs%2Fjob-seed-001%2Fapplicants/);

        // Verify zero horizontal scroll overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });

  test.describe('Candidate Pipeline Security & Stage Transitions (TASK-015)', () => {
    test('Cross-tenant unauthorized company cookie injection cannot access job applicant pipeline', async ({
      context,
      page,
    }) => {
      await context.addCookies([
        {
          name: 'company_id',
          value: 'company-unauthorized-corp',
          domain: 'localhost',
          path: '/',
        },
        {
          name: 'user_role',
          value: 'company',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto(targetRoute);
      await expect(page).not.toHaveURL(targetRoute);
      await expect(page).toHaveURL(/\/login/);
    });

    test('Malformed or invalid job ID route is protected and handled safely', async ({ page }) => {
      await page.goto('/company/jobs/non-existent-job-xyz-999/applicants');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs%2Fnon-existent-job-xyz-999%2Fapplicants/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Student attempting direct URL access to recruiter pipeline is redirected', async ({
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
        {
          name: 'student_id',
          value: 'student-profile-seed-001',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto(targetRoute);
      await expect(page).not.toHaveURL(targetRoute);
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
