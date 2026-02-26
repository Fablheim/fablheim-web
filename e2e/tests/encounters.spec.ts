import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { FormHelper } from '../helpers/form.helper';
import { generateTestUser, generateCampaign, generateEncounter } from '../fixtures/test-users';

test.describe('Encounter Prep', () => {
  let auth: AuthHelper;
  let nav: NavigationHelper;
  let form: FormHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    nav = new NavigationHelper(page);
    form = new FormHelper(page);

    // Register and create a campaign
    const user = generateTestUser('dm');
    await auth.register(user.username, user.email, user.password);

    // Navigate to campaigns and create one
    await nav.goToCampaigns();
    const campaign = generateCampaign();
    await form.createCampaign({ name: campaign.name, system: 'dnd5e' });

    // Open the campaign detail by clicking on it
    await page.getByText(campaign.name).click();
    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 10_000 });
  });

  test('should access encounter prep from campaign quick actions', async ({ page }) => {
    await nav.clickQuickAction('Encounters');
    // Encounter prep page loads — check for "New Encounter" button (unique to this page)
    await expect(page.getByRole('button', { name: /new encounter/i })).toBeVisible({ timeout: 10_000 });
  });

  test('should show empty encounter library initially', async ({ page }) => {
    await nav.clickQuickAction('Encounters');
    await expect(page.getByText('No encounters yet')).toBeVisible({ timeout: 5_000 });
  });

  test('should create a new encounter', async ({ page }) => {
    await nav.clickQuickAction('Encounters');

    const encounter = generateEncounter();
    await form.createEncounter({
      name: encounter.name,
      difficulty: 'medium',
      notes: encounter.notes,
    });

    // Verify encounter name is visible in the details panel
    await expect(page.locator('#enc-name')).toHaveValue(encounter.name);
  });

  test('should edit encounter details', async ({ page }) => {
    await nav.clickQuickAction('Encounters');

    const encounter = generateEncounter();
    await form.createEncounter({ name: encounter.name, difficulty: 'easy' });

    // Wait for the initial save toast to disappear before making more changes
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /encounter saved/i }),
    ).toBeHidden({ timeout: 10_000 });

    // Change difficulty
    await page.selectOption('#enc-diff', 'hard');

    // Save and verify via toast
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /encounter saved/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('should change encounter status', async ({ page }) => {
    await nav.clickQuickAction('Encounters');

    const encounter = generateEncounter();
    await form.createEncounter({ name: encounter.name });

    // Change status to ready
    await page.selectOption('#enc-status', 'ready');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 5_000 });
  });

  test('should delete an encounter', async ({ page }) => {
    await nav.clickQuickAction('Encounters');

    const encounter = generateEncounter();
    await form.createEncounter({ name: encounter.name });

    // Go back to library view first
    await page.getByRole('button', { name: 'Back' }).first().click();

    // The encounter card should be visible in the library
    const encounterCard = page.locator('button').filter({ hasText: encounter.name });
    await expect(encounterCard).toBeVisible({ timeout: 5_000 });

    // Accept the browser confirm dialog before triggering it
    page.on('dialog', (dialog) => dialog.accept());

    // The delete button is inside the encounter card, hidden until hover.
    // Force-hover the card, then find the small nested button (not the card itself).
    await encounterCard.hover();
    // The delete button is the only nested button inside the card button
    const deleteBtn = encounterCard.locator('button');
    await deleteBtn.click({ force: true });

    // Should be gone from the library
    await expect(page.getByText(encounter.name)).toBeHidden({ timeout: 5_000 });
  });

  test('should navigate back to encounter library', async ({ page }) => {
    await nav.clickQuickAction('Encounters');

    const encounter = generateEncounter();
    await form.createEncounter({ name: encounter.name });

    // Click back to return to library
    await page.getByText('Back').first().click();

    // Should see library view with encounter card
    await expect(page.getByText(encounter.name)).toBeVisible();
  });
});
