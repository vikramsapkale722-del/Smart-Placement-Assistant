import { test, expect } from '@playwright/test';

test.describe('Student Job Discovery & Details (TASK-011)', () => {
  test.describe('Authentication & Route Protection', () => {
    test('Unauthenticated user visiting /student/jobs is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/student/jobs');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fjobs/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Unauthenticated user visiting /student/jobs/any-id is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/student/jobs/job-seed-001');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fjobs%2Fjob-seed-001/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Client-side role spoofing in localStorage cannot access /student/jobs', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'student');
        localStorage.setItem('user_role', 'student');
      });

      await page.goto('/student/jobs');
      await expect(page).not.toHaveURL('/student/jobs');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side cookie injection with student role cannot bypass server session validation', async ({
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

      await page.goto('/student/jobs');
      await expect(page).not.toHaveURL('/student/jobs');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Company role cookie spoofing cannot gain access to /student/jobs', async ({
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

      await page.goto('/student/jobs');
      await expect(page).not.toHaveURL('/student/jobs');
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
        await page.goto('/student/jobs');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fjobs/);

        // Verify page renders without horizontal overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });

      test(`Renders job details protected redirect on ${vp.name} without horizontal overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/student/jobs/job-seed-001');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fjobs%2Fjob-seed-001/);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
