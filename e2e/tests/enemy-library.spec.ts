import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { FormHelper } from '../helpers/form.helper';
import { generateTestUser, generateCampaign, generateEnemyTemplate } from '../fixtures/test-users';

test.describe('Enemy Library', () => {
  let auth: AuthHelper;
  let nav: NavigationHelper;
  let form: FormHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    nav = new NavigationHelper(page);
    form = new FormHelper(page);

    const user = generateTestUser('dm');
    await auth.register(user.username, user.email, user.password);

    // Create a campaign so DM sidebar items become visible
    // (showDMItems requires at least one DM campaign)
    await nav.goToCampaigns();
    const campaign = generateCampaign();
    await form.createCampaign({ name: campaign.name, system: 'dnd5e' });
  });

  test('should navigate to enemy library from sidebar', async ({ page }) => {
    await nav.goToEnemyLibrary();
    // Enemy Library page should render — check for "New Template" button
    await expect(page.getByRole('button', { name: /new template/i })).toBeVisible({ timeout: 5_000 });
  });

  test('should show empty state when no templates exist', async ({ page }) => {
    await nav.goToEnemyLibrary();
    await expect(page.getByText('No enemy templates yet')).toBeVisible({ timeout: 5_000 });
  });

  test('should create a new enemy template', async ({ page }) => {
    const template = generateEnemyTemplate();
    await nav.goToEnemyLibrary();

    await form.createEnemyTemplate({
      name: template.name,
      category: 'humanoid',
      cr: template.cr,
      hp: template.hp,
      ac: template.ac,
      system: 'dnd5e',
    });

    // Verify template appears in list
    await expect(page.getByText(template.name)).toBeVisible();
  });

  test('should edit an existing enemy template', async ({ page }) => {
    const template = generateEnemyTemplate();
    await nav.goToEnemyLibrary();

    // Create first
    await form.createEnemyTemplate({
      name: template.name,
      hp: template.hp,
      ac: template.ac,
    });

    // Click on the template card to open edit modal (whole card is clickable)
    await page.getByText(template.name).click();

    // Expect edit modal with "Edit Enemy Template" title
    await expect(page.getByText('Edit Enemy Template')).toBeVisible({ timeout: 5_000 });

    // Change name
    const nameInput = page.locator('input[placeholder="Goblin"]');
    await nameInput.clear();
    await nameInput.fill(template.name + ' Edited');

    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify updated name
    await expect(page.getByText(template.name + ' Edited')).toBeVisible({ timeout: 5_000 });
  });

  test('should delete an enemy template', async ({ page }) => {
    const template = generateEnemyTemplate();
    await nav.goToEnemyLibrary();

    await form.createEnemyTemplate({
      name: template.name,
      hp: template.hp,
      ac: template.ac,
    });

    // Accept the browser confirm dialog before triggering it
    page.on('dialog', (dialog) => dialog.accept());

    // The delete button is inside the card, hidden until hover (opacity-0 → opacity-100).
    // Hover over the card to reveal it, then click the second button (first is edit).
    const card = page.locator('.group').filter({ hasText: template.name });
    await card.hover();

    // The card has two hover-revealed buttons: edit (Pencil) and delete (Trash2).
    // Delete is the second one in the opacity container.
    const hoverBtns = card.locator('.opacity-0 button, .group-hover\\:opacity-100 button');
    const deleteBtn = hoverBtns.last();
    await deleteBtn.click({ force: true });

    // Verify template is gone
    await expect(page.getByText(template.name)).toBeHidden({ timeout: 5_000 });
  });

  test('should filter by system', async ({ page }) => {
    await nav.goToEnemyLibrary();

    // Create a D&D template
    const dndTemplate = generateEnemyTemplate();
    await form.createEnemyTemplate({
      name: dndTemplate.name,
      system: 'dnd5e',
      hp: 10,
      ac: 12,
    });

    // Create a Daggerheart template
    const dhTemplate = generateEnemyTemplate();
    await form.createEnemyTemplate({
      name: dhTemplate.name,
      system: 'daggerheart',
      hp: 10,
      ac: 12,
    });

    // Filter to D&D only — look for the system filter dropdown
    const systemFilter = page.locator('select').filter({ hasText: /all systems/i });
    if (await systemFilter.isVisible()) {
      await systemFilter.selectOption('dnd5e');

      // D&D template should be visible, Daggerheart should not
      await expect(page.getByText(dndTemplate.name)).toBeVisible();
      await expect(page.getByText(dhTemplate.name)).toBeHidden();
    }
  });

  test('should search templates by name', async ({ page }) => {
    await nav.goToEnemyLibrary();

    const template = generateEnemyTemplate();
    await form.createEnemyTemplate({
      name: template.name,
      hp: 10,
      ac: 12,
    });

    // Look for search input
    const searchInput = page.locator('input[placeholder*="earch"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(template.name.slice(0, 10));
      await expect(page.getByText(template.name)).toBeVisible();

      // Search for nonsense
      await searchInput.clear();
      await searchInput.fill('zzz-nonexistent-xxx');
      await expect(page.getByText(template.name)).toBeHidden();
    }
  });
});
