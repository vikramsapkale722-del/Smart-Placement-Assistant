import { test, expect } from '@playwright/test';

test.describe('Student Dashboard Foundation (TASK-006)', () => {
  test.describe('Authentication & Route Protection', () => {
    test('Unauthenticated student visiting /student is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/student');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Client-side role spoofing in localStorage cannot bypass dashboard authorization', async ({
      page,
    }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'student');
        localStorage.setItem('user_role', 'student');
      });

      await page.goto('/student');
      await expect(page).not.toHaveURL('/student');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Portal Home Entry to Student Workspace', () => {
    test('Public Home page includes /student navigation link that enforces authentication', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const studentLink = page.getByRole('link', { name: '/student' });
      await expect(studentLink).toBeVisible();
      await studentLink.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForURL(/\/login\?redirectTo=%2Fstudent/),
        studentLink.click(),
      ]);
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent/);
    });
  });
});
