import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { FormHelper } from '../helpers/form.helper';
import { generateTestUser, generateCampaign } from '../fixtures/test-users';

test.describe('Campaigns', () => {
  let auth: AuthHelper;
  let nav: NavigationHelper;
  let form: FormHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    nav = new NavigationHelper(page);
    form = new FormHelper(page);

    const user = generateTestUser('dm');
    await auth.register(user.username, user.email, user.password);
  });

  test('should create a new campaign', async ({ page }) => {
    await nav.goToCampaigns();
    const campaign = generateCampaign();

    await form.createCampaign({
      name: campaign.name,
      system: 'dnd5e',
      description: campaign.description,
      setting: campaign.setting,
    });

    // Campaign should appear in the list after modal closes
    await expect(page.getByText(campaign.name)).toBeVisible();
  });

  test('should open campaign detail and show quick actions', async ({ page }) => {
    await nav.goToCampaigns();
    const campaign = generateCampaign();
    await form.createCampaign({ name: campaign.name, system: 'dnd5e' });

    // Click on the campaign card to open it in a tab
    await page.getByText(campaign.name).click();

    // Verify quick actions are visible in the campaign detail view
    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 10_000 });
    // Use exact match scoped to quick actions area to avoid sidebar/heading collisions
    await expect(page.getByText('Manage PCs and NPCs')).toBeVisible();
    await expect(page.getByText('Plan & prep encounters')).toBeVisible();
  });

  test('should list campaigns on campaigns page', async ({ page }) => {
    await nav.goToCampaigns();

    // Create two campaigns
    const campaign1 = generateCampaign();
    await form.createCampaign({ name: campaign1.name, system: 'dnd5e' });

    const campaign2 = generateCampaign();
    await form.createCampaign({ name: campaign2.name, system: 'pathfinder2e' });

    // Both should be in the list
    await expect(page.getByText(campaign1.name)).toBeVisible();
    await expect(page.getByText(campaign2.name)).toBeVisible();
  });

  test('should open campaign detail from campaign card', async ({ page }) => {
    await nav.goToCampaigns();
    const campaign = generateCampaign();
    await form.createCampaign({ name: campaign.name, system: 'dnd5e' });

    // Click on the campaign to open detail in a tab
    await page.getByText(campaign.name).click();

    // Campaign detail should load with quick actions visible
    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 10_000 });
  });
});
