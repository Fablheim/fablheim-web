import { type Page, expect } from '@playwright/test';

export class NavigationHelper {
  constructor(private page: Page) {}

  // --- Top-level page navigation (via URL) ---

  async goToDashboard() {
    await this.page.goto('/app');
    await this.page.waitForLoadState('networkidle');
  }

  async goToCampaigns() {
    await this.page.goto('/app/campaigns');
    await this.page.waitForLoadState('networkidle');
  }

  async goToEnemyLibrary() {
    await this.page.goto('/app/enemies');
    await this.page.waitForLoadState('networkidle');
  }

  // --- Direct navigation ---

  async gotoCampaignDetail(campaignId: string) {
    await this.page.goto(`/app/campaigns/${campaignId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoEncounterPrep(campaignId: string) {
    await this.page.goto(`/app/campaigns/${campaignId}/encounters`);
    await this.page.waitForLoadState('networkidle');
  }

  // --- Campaign workspace prep sidebar (icon buttons with title attributes) ---

  async clickPrepSection(section: 'Overview' | 'World' | 'NPCs' | 'Encounters' | 'Notes' | 'AI Tools' | 'Rules') {
    await this.page.getByRole('button', { name: section }).click();
  }

  // --- Quick Actions (on campaign overview section) ---

  async clickQuickAction(label: 'Characters' | 'World' | 'Notebook' | 'Encounters' | 'AI Tools') {
    await this.page.getByText(label, { exact: true }).click();
  }

  // --- Session runner tabs ---

  async clickSessionTab(tab: 'Notes' | 'Encounters' | 'Map' | 'Handouts' | 'Chat' | 'Events' | 'AI Tools') {
    await this.page.getByRole('button', { name: tab }).click();
  }

  // --- Assertions ---

  async expectOnPage(urlPattern: string | RegExp) {
    await expect(this.page).toHaveURL(urlPattern);
  }
}
