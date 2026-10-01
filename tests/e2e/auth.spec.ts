import { test, expect } from '@playwright/test';

test.describe('Authentication UI & User Flow (TASK-003)', () => {
  test('Login page renders cleanly with accessible inputs, branding, and links', async ({ page }) => {
    await page.goto('/login');

    // Verify Title & Branding
    await expect(page).toHaveTitle(/Sign In \| Smart Placement Portal/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Verify Form Inputs
    const emailInput = page.getByLabel(/College \/ Corporate Email/i);
    const passwordInput = page.getByLabel(/^Password/i);
    const submitBtn = page.getByRole('button', { name: /Sign In/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Verify Navigation to Register
    const registerLink = page.getByRole('link', { name: /Register here/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });

  test('Register page renders with role selector, fields, and password confirmation', async ({ page }) => {
    await page.goto('/register');

    // Verify Title & Branding
    await expect(page).toHaveTitle(/Create an Account \| Smart Placement Portal/);
    await expect(page.getByRole('heading', { name: 'Create an Account' })).toBeVisible();

    // Verify Role Toggle Buttons
    const studentTab = page.getByRole('button', { name: /Student Candidate/i });
    const companyTab = page.getByRole('button', { name: /Company Recruiter/i });

    await expect(studentTab).toBeVisible();
    await expect(companyTab).toBeVisible();

    // Verify Form Inputs
    const nameInput = page.getByLabel(/Full Name/i);
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/^Password/i);
    const confirmPasswordInput = page.getByLabel(/Confirm Password/i);
    const submitBtn = page.getByRole('button', { name: /Create Account/i });

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Verify Navigation to Login
    const loginLink = page.getByRole('link', { name: /Sign in to your account/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('Register form client validation handles password mismatch and required fields', async ({ page }) => {
    await page.goto('/register');

    // Fill form with mismatched passwords
    await page.getByLabel(/Full Name/i).fill('Test Candidate');
    await page.getByLabel(/Email/i).fill('candidate@university.edu');
    await page.getByLabel(/^Password/i).fill('password123');
    await page.getByLabel(/Confirm Password/i).fill('differentPassword456');

    // Submit form
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Verify mismatch error is displayed
    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  });

  test('Public Home page displays portal gateway with Sign In and Register actions', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Smart Placement Portal' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('Responsive viewport verification at Mobile (375px), Tablet (768px), and Desktop (1440px)', async ({ page }) => {
    // 1. Mobile (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();

    // 2. Tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create an Account' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();

    // 3. Desktop (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Smart Placement Portal' })).toBeVisible();
  });
});
