import { test, expect } from '@playwright/test';

test.describe('Job Posting Engine Foundation (TASK-010)', () => {
  test.describe('Authentication & Route Protection', () => {
    test('Unauthenticated user visiting /company/jobs is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/company/jobs');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Unauthenticated user visiting /company/jobs/new is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/company/jobs/new');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs%2Fnew/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Client-side role spoofing in localStorage cannot access /company/jobs', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'company');
        localStorage.setItem('user_role', 'company');
      });

      await page.goto('/company/jobs');
      await expect(page).not.toHaveURL('/company/jobs');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side role spoofing in localStorage cannot access /company/jobs/new', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'company');
        localStorage.setItem('user_role', 'company');
      });

      await page.goto('/company/jobs/new');
      await expect(page).not.toHaveURL('/company/jobs/new');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side cookie injection without verified server session cannot access /company/jobs', async ({
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

      await page.goto('/company/jobs');
      await expect(page).not.toHaveURL('/company/jobs');
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
        await page.goto('/company/jobs');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fjobs/);

        // Verify page renders without horizontal overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of safety
      });
    }
  });
});
