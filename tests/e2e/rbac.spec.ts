import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control & Route Authorization (TASK-004)', () => {
  test.describe('Unauthenticated Access Protection (TEST 1)', () => {
    test('Unauthenticated user navigating to /student is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/student');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Unauthenticated user navigating to /company is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/company');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcompany/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('Unauthenticated user navigating to /admin is redirected to /login with redirectTo query', async ({
      page,
    }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin/);
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });
  });

  test.describe('Unauthorized 403 Experience (STEP 6)', () => {
    test('/unauthorized page renders professional 403 UI, accessible alert, and recovery actions', async ({
      page,
    }) => {
      await page.goto('/unauthorized');

      await expect(page).toHaveTitle(/Access Restricted \| Smart Placement Portal/);
      await expect(page.getByText('403 • Access Denied')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Authorization Required' })).toBeVisible();
      await expect(
        page.getByText(
          'Your account does not possess the required clearance level to access this specific portal resource.'
        )
      ).toBeVisible();

      // Verify Recovery Navigation Buttons
      const portalHomeBtn = page.getByRole('link', { name: 'Portal Home' });
      await expect(portalHomeBtn).toBeVisible();
      await expect(portalHomeBtn).toHaveAttribute('href', '/');

      const switchAccountBtn = page.getByRole('button', { name: 'Switch Account' });
      await expect(switchAccountBtn).toBeVisible();
    });
  });

  test.describe('Client-Side Manipulation Hardening (TEST 9 & TEST 10)', () => {
    test('Client-side localStorage role manipulation cannot bypass server authorization to /admin', async ({
      page,
    }) => {
      // Attacker attempts client-side spoofing by writing to localStorage
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('role', 'admin');
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('isAdmin', 'true');
      });

      // Navigate to /admin
      await page.goto('/admin');

      // Authorization must hold: redirected away from /admin
      await expect(page).not.toHaveURL('/admin');
      await expect(page).toHaveURL(/\/login|\/unauthorized/);
    });

    test('Client-side cookie injection cannot bypass server authorization to /admin', async ({
      context,
      page,
    }) => {
      // Attacker injects a synthetic client-side cookie
      await context.addCookies([
        {
          name: 'role',
          value: 'admin',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/admin');

      // Server-side middleware must ignore arbitrary client cookies
      await expect(page).not.toHaveURL('/admin');
      await expect(page).toHaveURL(/\/login|\/unauthorized/);
    });

    test('Direct URL refresh preserves server-side security enforcement', async ({ page }) => {
      await page.goto('/student');
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent/);

      // Reloading the page maintains protection
      await page.reload();
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent/);
    });
  });

  test.describe('Portal Landing Boundary Navigation', () => {
    test('Public Home page includes boundary check links that enforce authentication', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Verify boundary testing links
      const studentLink = page.getByRole('link', { name: '/student' });
      const companyLink = page.getByRole('link', { name: '/company' });
      const adminLink = page.getByRole('link', { name: '/admin' });

      await expect(studentLink).toBeVisible();
      await expect(companyLink).toBeVisible();
      await expect(adminLink).toBeVisible();

      // Click /student -> redirected to /login
      await studentLink.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForURL(/\/login\?redirectTo=%2Fstudent/),
        studentLink.click(),
      ]);
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fstudent/);
    });
  });
});
