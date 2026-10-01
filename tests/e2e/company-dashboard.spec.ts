import { test, expect } from '@playwright/test';

test.describe('Company Dashboard Foundation (TASK-009)', () => {
  test.describe('Authentication & Route Protection', () => {
    test('Unauthenticated user visiting /company is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/company');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Client-side role spoofing in localStorage cannot bypass company dashboard authorization', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'company');
        localStorage.setItem('user_role', 'company');
      });

      await page.goto('/company');
      await expect(page).not.toHaveURL('/company');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Client-side cookie injection without verified server session cannot access /company', async ({
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

      await page.goto('/company');
      await expect(page).not.toHaveURL('/company');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Portal Home Gateway to Recruiter Dashboard', () => {
    test('Public Home page includes /company link that enforces recruiter authentication', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const companyLink = page.getByRole('link', { name: '/company' });
      await expect(companyLink).toBeVisible();
      await companyLink.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForURL(/\/login\?redirectTo=%2Fcompany/),
        companyLink.click(),
      ]);
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany/);
    });
  });
});
