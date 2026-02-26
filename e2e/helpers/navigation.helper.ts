import { type Page, expect } from '@playwright/test';

export class NavigationHelper {
  constructor(private page: Page) {}

  // --- Sidebar navigation ---
  // Sidebar items are <button> elements that open tabs (no URL change).

  private async clickSidebarItem(name: string) {
    // Scope to the sidebar <nav> to avoid matching buttons elsewhere on the page.
    // The sidebar nav has aria-label="Main navigation".
    const sidebar = this.page.locator('nav[aria-label="Main navigation"]');
    await sidebar.getByRole('button', { name }).first().click();
  }

  async goToDashboard() {
    await this.clickSidebarItem('Dashboard');
  }

  async goToCampaigns() {
    await this.clickSidebarItem('Campaigns');
  }

  async goToSessions() {
    await this.clickSidebarItem('Sessions');
  }

  async goToCharacters() {
    await this.clickSidebarItem('Characters');
  }

  async goToWorld() {
    await this.clickSidebarItem('World');
  }

  async goToNotebook() {
    await this.clickSidebarItem('Notebook');
  }

  async goToAITools() {
    await this.clickSidebarItem('AI Tools');
  }

  async goToEnemyLibrary() {
    await this.clickSidebarItem('Enemy Library');
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

  // --- Quick Actions (on campaign detail page) ---

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
