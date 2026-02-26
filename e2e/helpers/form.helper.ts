import { type Page, expect } from '@playwright/test';

export class FormHelper {
  constructor(private page: Page) {}

  // --- Campaign forms ---

  async createCampaign(data: {
    name: string;
    system?: string;
    description?: string;
    setting?: string;
  }) {
    // Click "New Campaign" or equivalent trigger button
    await this.page.getByRole('button', { name: /new campaign/i }).click();

    // Wait for modal
    await expect(this.page.locator('#campaign-name')).toBeVisible({ timeout: 5_000 });

    // Fill required field
    await this.page.fill('#campaign-name', data.name);

    if (data.system) {
      await this.page.selectOption('#campaign-system', data.system);
    }
    if (data.description) {
      await this.page.fill('#campaign-description', data.description);
    }
    if (data.setting) {
      await this.page.fill('#campaign-setting', data.setting);
    }

    // Submit
    await this.page.getByRole('button', { name: 'Create Campaign' }).click();

    // Wait for modal to close (campaign list refreshes via query invalidation)
    await expect(this.page.locator('#campaign-name')).toBeHidden({ timeout: 10_000 });

    // Verify campaign appears in the list
    await expect(this.page.getByText(data.name)).toBeVisible({ timeout: 5_000 });
  }

  // --- Enemy template forms ---

  async createEnemyTemplate(data: {
    name: string;
    category?: string;
    cr?: string;
    hp?: number;
    ac?: number;
    system?: string;
  }) {
    // Click new template button
    await this.page.getByRole('button', { name: /new template/i }).click();

    // Wait for modal — scope all interactions to the modal overlay (fixed z-50)
    const modal = this.page.locator('.fixed.z-50');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill name (required field)
    await modal.locator('input[placeholder="Goblin"]').fill(data.name);

    // The modal has selects in order: Category, System, Size
    // Page filter selects are OUTSIDE the modal, so scoping to modal avoids conflicts.
    if (data.category) {
      // Category is the first select in the modal
      const categorySelect = modal.locator('select').first();
      await categorySelect.selectOption(data.category);
    }

    if (data.system) {
      // System is the second select in the modal
      const systemSelect = modal.locator('select').nth(1);
      await systemSelect.selectOption(data.system);
    }

    if (data.cr) {
      await modal.locator('input[placeholder="1/4"]').fill(data.cr);
    }

    // HP and AC inputs are in the combat stats section within the modal.
    if (data.hp !== undefined) {
      const hpDiv = modal.locator('label').filter({ hasText: /^HP/ }).first().locator('..');
      await hpDiv.locator('input').fill(String(data.hp));
    }

    if (data.ac !== undefined) {
      const acDiv = modal.locator('label').filter({ hasText: /^AC/ }).first().locator('..');
      await acDiv.locator('input').fill(String(data.ac));
    }

    // Submit
    await modal.getByRole('button', { name: 'Create Template' }).click();

    // Wait for modal to close
    await expect(modal).toBeHidden({ timeout: 10_000 });
  }

  // --- Encounter forms ---

  async createEncounter(data: {
    name: string;
    difficulty?: string;
    notes?: string;
  }) {
    // Click "New Encounter" to show inline creation form
    await this.page.getByRole('button', { name: /new encounter/i }).click();

    // Fill the inline name input (placeholder: "Encounter name...")
    const nameInput = this.page.locator('input[placeholder="Encounter name..."]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill(data.name);

    // Click "Create" to save the encounter
    await this.page.getByRole('button', { name: 'Create', exact: true }).click();

    // Wait for the encounter to be created and selected (details panel appears)
    await expect(this.page.locator('#enc-name')).toBeVisible({ timeout: 10_000 });

    // Fill optional fields in the details panel
    if (data.difficulty) {
      await this.page.selectOption('#enc-diff', data.difficulty);
    }

    if (data.notes) {
      await this.page.fill('#enc-notes', data.notes);
    }

    // Save if we changed anything
    if (data.difficulty || data.notes) {
      await this.page.getByRole('button', { name: 'Save Changes' }).click();
      // Verify save via toast (button text can flicker due to query invalidation)
      await expect(
        this.page.locator('[data-sonner-toast]').filter({ hasText: /encounter saved/i }),
      ).toBeVisible({ timeout: 5_000 });
    }
  }

  // --- Session management ---

  async startSession() {
    await this.page.getByRole('button', { name: 'Start Session' }).click();
    // Session opens in a tab (no URL change). Wait for the session runner to load.
    await expect(this.page.getByText(/online/i)).toBeVisible({ timeout: 15_000 });
  }

  async endSession() {
    await this.page.getByRole('button', { name: 'End Session' }).click();
    // Confirm if there's a confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirm|end/i });
    if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }

  // --- Generic helpers ---

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async clickButton(name: string | RegExp) {
    await this.page.getByRole('button', { name }).click();
  }

  async expectToast(text: string | RegExp) {
    // Sonner toast notifications
    await expect(this.page.locator('[data-sonner-toast]').filter({ hasText: text })).toBeVisible({
      timeout: 5_000,
    });
  }
}
