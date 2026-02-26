import { type Page, expect } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /** Wait for the app shell to fully load (auth resolved, sidebar visible). */
  private async waitForAppShell() {
    // Wait for the loading spinner to disappear and the sidebar to render.
    await expect(this.page.getByText('Sign Out')).toBeVisible({ timeout: 15_000 });

    // Dismiss the WelcomeTour modal if it appears (shows for first-time users).
    const skipTour = this.page.getByLabel('Skip tour');
    if (await skipTour.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await skipTour.click();
      await expect(skipTour).toBeHidden({ timeout: 3_000 });
    }
  }

  async register(username: string, email: string, password: string) {
    await this.page.goto('/register');
    await this.page.fill('#username', username);
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.getByRole('button', { name: 'Begin Your Quest' }).click();
    await this.page.waitForURL('**/app', { timeout: 15_000 });
    await this.waitForAppShell();
  }

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.getByRole('button', { name: 'Enter' }).click();
    await this.page.waitForURL('**/app', { timeout: 15_000 });
    await this.waitForAppShell();
  }

  async logout() {
    await this.page.getByText('Sign Out').click();
    await this.page.waitForURL('**/login', { timeout: 10_000 });
  }

  async expectLoggedIn() {
    await expect(this.page.getByText('Sign Out')).toBeVisible({ timeout: 15_000 });
  }

  async expectLoggedOut() {
    await expect(this.page).toHaveURL(/\/(login|register|$)/);
  }

  async expectAuthError() {
    // Error container uses border-blood/30 styling
    await expect(this.page.locator('.border-blood\\/30')).toBeVisible({ timeout: 5_000 });
  }
}
