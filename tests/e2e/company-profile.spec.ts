import { test, expect } from '@playwright/test';

test.describe('Company Profile Foundation (TASK-007)', () => {
  test.describe('Authentication & Access Control Protection', () => {
    test('Unauthenticated recruiter visiting /company/profile is redirected to /login with redirectTo param', async ({
      page,
    }) => {
      await page.goto('/company/profile');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany%2Fprofile/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Client-side role spoofing in localStorage cannot bypass /company/profile authorization', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'company');
        localStorage.setItem('user_role', 'company');
      });

      await page.goto('/company/profile');
      await expect(page).not.toHaveURL('/company/profile');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side cookie injection without server session cannot access /company/profile', async ({
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

      await page.goto('/company/profile');
      await expect(page).not.toHaveURL('/company/profile');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Company Gateway Navigation', () => {
    test('/company gateway protects recruiter boundary and redirects unauthenticated visitors', async ({
      page,
    }) => {
      await page.goto('/company');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany/);
    });
  });
});
