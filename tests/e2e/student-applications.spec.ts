import { test, expect } from '@playwright/test';

test.describe('Student Application Tracking View (TASK-013)', () => {
  test.describe('Authentication & Route Protection', () => {
    test('Unauthenticated user visiting /student/applications is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/student/applications');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fapplications/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Company role cookie spoofing cannot access /student/applications', async ({
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

      await page.goto('/student/applications');
      await expect(page).not.toHaveURL('/student/applications');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Admin role cookie spoofing without server session cannot access /student/applications', async ({
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

      await page.goto('/student/applications');
      await expect(page).not.toHaveURL('/student/applications');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side role spoofing in localStorage cannot access /student/applications', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'student');
        localStorage.setItem('user_role', 'student');
      });

      await page.goto('/student/applications');
      await expect(page).not.toHaveURL('/student/applications');
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
        await page.goto('/student/applications');
        await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fapplications/);

        // Verify zero horizontal scroll overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
      });
    }
  });
});
