import { test, expect } from '@playwright/test';

test.describe('Job Application Engine Foundation (TASK-012)', () => {
  test.describe('Authentication & Route Protection', () => {
    test('Unauthenticated candidate accessing job details is redirected to /login', async ({
      page,
    }) => {
      await page.goto('/student/jobs/job-seed-001');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fjobs%2Fjob-seed-001/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Unauthenticated user cannot tamper with apply button or form on client', async ({
      page,
    }) => {
      await page.goto('/student/jobs/job-seed-002');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('#apply-now-btn')).not.toBeVisible();
    });

    test('Company role cookie spoofing cannot access student apply flow', async ({
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

      await page.goto('/student/jobs/job-seed-001');
      await expect(page).not.toHaveURL('/student/jobs/job-seed-001');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side role tampering via localStorage cannot access job details', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'student');
        localStorage.setItem('user_role', 'student');
      });

      await page.goto('/student/jobs/job-seed-001');
      await expect(page).not.toHaveURL('/student/jobs/job-seed-001');
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
      test(`Renders job details protected redirect on ${vp.name} without horizontal overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/student/jobs/job-seed-001');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fjobs%2Fjob-seed-001/);

        // Verify zero horizontal scroll overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
