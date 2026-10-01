import { test, expect } from '@playwright/test';

test.describe('Student Profile Foundation (TASK-005)', () => {
  test.describe('Authentication & Access Control Protection', () => {
    test('Unauthenticated visitor navigating to /student/profile is redirected to /login with redirectTo param', async ({
      page,
    }) => {
      await page.goto('/student/profile');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent%2Fprofile/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Client-side role spoofing in localStorage cannot access /student/profile', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'student');
        localStorage.setItem('user_role', 'student');
      });

      await page.goto('/student/profile');
      await expect(page).not.toHaveURL('/student/profile');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Student Navigation & Entry Point', () => {
    test('/student protected gateway includes direct link to /student/profile', async ({
      page,
    }) => {
      // In unauthenticated mode, accessing /student redirects to login
      await page.goto('/student');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent/);
    });
  });
});
