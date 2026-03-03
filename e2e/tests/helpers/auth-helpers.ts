import { type Page, expect } from '@playwright/test';

/**
 * Dismiss the WelcomeTour modal if it appears (first-time users).
 */
async function dismissWelcomeTour(page: Page): Promise<void> {
  const skipTour = page.getByLabel('Skip tour');
  if (await skipTour.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipTour.click();
    await expect(skipTour).toBeHidden({ timeout: 3_000 });
  }
}

/**
 * Wait for the app shell to fully load (auth resolved, top nav visible).
 */
async function waitForAppShell(page: Page): Promise<void> {
  await expect(
    page.getByRole('button', { name: 'Campaigns' }),
  ).toBeVisible({ timeout: 15_000 });
  await dismissWelcomeTour(page);
}

/**
 * Register a new account.
 * Form fields: #username, #email, #password
 * Submit button text: "Begin Your Quest"
 * Redirects to /app on success.
 */
export async function signUp(
  page: Page,
  account: { username: string; email: string; password: string },
): Promise<void> {
  await page.goto('/register');

  await page.locator('#username').fill(account.username);
  await page.locator('#email').fill(account.email);
  await page.locator('#password').fill(account.password);

  await page.getByRole('button', { name: /begin your quest/i }).click();

  await page.waitForURL(/\/app/, { timeout: 15_000 });
  await waitForAppShell(page);
}

/**
 * Log in to an existing account.
 * Form fields: #email, #password
 * Submit button text: "Enter the Hall"
 * Redirects to /app on success.
 */
export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login', { waitUntil: 'networkidle' });

  // Wait for the login form to be fully rendered (submit button visible)
  const submitBtn = page.getByRole('button', { name: /enter the hall/i });
  await submitBtn.waitFor({ timeout: 10_000 });

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  await submitBtn.click();

  await page.waitForURL(/\/app/, { timeout: 15_000 });
  await waitForAppShell(page);
}

/**
 * Log out the current user via the nav dropdown.
 */
export async function logout(page: Page): Promise<void> {
  // Open user menu via aria-label
  await page.getByLabel('User menu').click();

  // Click Sign Out
  await page.getByText('Sign Out').click();

  await page.waitForURL(/\/login/, { timeout: 10_000 });

  // Ensure the server-side logout API call completes and cookies are cleared.
  // The app's onClick fires logout() (async) without awaiting it,
  // so we clear cookies explicitly to avoid stale session redirects.
  await page.context().clearCookies();
}

/**
 * Verify the user is on the authenticated dashboard.
 */
export async function expectLoggedIn(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/app/);
}
