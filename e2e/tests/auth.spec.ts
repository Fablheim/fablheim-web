import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { generateTestUser } from '../fixtures/test-users';

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should register a new user and redirect to dashboard', async ({ page }) => {
      const user = generateTestUser();
      const auth = new AuthHelper(page);

      await page.goto('/register');
      await page.fill('#username', user.username);
      await page.fill('#email', user.email);
      await page.fill('#password', user.password);
      await page.getByRole('button', { name: 'Begin Your Quest' }).click();

      await page.waitForURL('**/app', { timeout: 15_000 });
      await expect(page.getByText('Sign Out')).toBeVisible({ timeout: 15_000 });
    });

    test('should show error for duplicate email', async ({ page }) => {
      const user = generateTestUser();
      const auth = new AuthHelper(page);

      // Register first time
      await auth.register(user.username, user.email, user.password);
      await auth.logout();

      // Try to register again with same email
      await page.goto('/register');
      await page.fill('#username', user.username + '-dup');
      await page.fill('#email', user.email);
      await page.fill('#password', user.password);
      await page.getByRole('button', { name: 'Begin Your Quest' }).click();

      await auth.expectAuthError();
    });

    test('should enforce password minimum length', async ({ page }) => {
      await page.goto('/register');
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toHaveAttribute('minlength', '8');
    });
  });

  test.describe('Login', () => {
    let registeredUser: ReturnType<typeof generateTestUser>;

    test.beforeAll(async ({ browser }) => {
      // Register a user to log in with
      registeredUser = generateTestUser();
      const page = await browser.newPage();
      const auth = new AuthHelper(page);
      await auth.register(registeredUser.username, registeredUser.email, registeredUser.password);
      await page.close();
    });

    test('should login with valid credentials', async ({ page }) => {
      const auth = new AuthHelper(page);
      await auth.login(registeredUser.email, registeredUser.password);
      await auth.expectLoggedIn();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const auth = new AuthHelper(page);

      await page.goto('/login');
      await page.fill('#email', 'nonexistent@fablheim-e2e.test');
      await page.fill('#password', 'WrongPassword123!');
      await page.getByRole('button', { name: 'Enter' }).click();

      await auth.expectAuthError();
    });

    test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
      await page.goto('/app');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Logout', () => {
    test('should log out and redirect to login', async ({ page }) => {
      const user = generateTestUser();
      const auth = new AuthHelper(page);

      await auth.register(user.username, user.email, user.password);
      await auth.logout();
      await auth.expectLoggedOut();
    });
  });

  test.describe('Session persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      const user = generateTestUser();
      const auth = new AuthHelper(page);

      await auth.register(user.username, user.email, user.password);
      await page.reload();
      await auth.expectLoggedIn();
    });
  });
});
