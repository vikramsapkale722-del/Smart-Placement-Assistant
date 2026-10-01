import { test, expect } from '@playwright/test';

test.describe('Company Verification & Administrative Workflow (TASK-008)', () => {
  test.describe('Authentication & Access Control Protection', () => {
    test('Unauthenticated visitor navigating to /admin/companies is redirected to /login with redirectTo param', async ({
      page,
    }) => {
      await page.goto('/admin/companies');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin%2Fcompanies/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Client-side role spoofing in localStorage cannot bypass /admin/companies authorization', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'admin');
        localStorage.setItem('user_role', 'admin');
      });

      await page.goto('/admin/companies');
      await expect(page).not.toHaveURL('/admin/companies');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side cookie injection with admin role cannot bypass server session authorization', async ({
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

      await page.goto('/admin/companies');
      await expect(page).not.toHaveURL('/admin/companies');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Admin Control Center Gateway Integration', () => {
    test('/admin gateway boundary protects administrator center and redirects unauthenticated visits', async ({
      page,
    }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin/);
    });
  });
});
