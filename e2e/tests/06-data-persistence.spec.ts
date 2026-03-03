import { test, expect, Page } from '@playwright/test';
import {
  generateAccounts,
  generateCampaignData,
  TEST_CHARACTER,
  TEST_ENCOUNTER,
} from './helpers/test-data';
import { signUp, login, logout } from './helpers/auth-helpers';
import { createCampaign, navigateToCampaign } from './helpers/campaign-helpers';
import {
  goToCharacterCreation,
  createCharacter,
  expectCharacterVisible,
} from './helpers/character-helpers';
import {
  startSession,
  endSession,
  returnToPrep,
  clickDMTab,
} from './helpers/session-helpers';

test.describe.serial('Data Persistence — Survives Reload, Re-Login, and Multiple Refreshes', () => {
  let page: Page;
  let campaignId: string;
  let aiNpcName: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── 1. Campaign Persistence ──────────────────────────────

  test('Step 1: Create account and campaign, reload, verify campaign still accessible', async () => {
    // Create a fresh DM account
    await signUp(page, accounts.dm);
    await expect(page).toHaveURL(/\/app/);

    // Navigate to campaigns list and create a campaign
    await page.goto('/app/campaigns');
    campaignId = await createCampaign(page, campaign);
    expect(campaignId).toBeTruthy();

    // Verify we landed on the campaign workspace
    await expect(page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));
    await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 10_000 });

    // Hard reload and verify the campaign is still there
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));
    await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 10_000 });

    // Click Overview tab to see the system label
    await page.getByRole('button', { name: 'Overview' }).click();
    await page.waitForTimeout(500);

    // Verify system label persisted
    await expect(
      page.getByText(/D&D 5e|dnd5e|Dungeons & Dragons 5th Edition/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── 2. Campaign Survives Logout / Login ──────────────────

  test('Step 2: Logout, login again, verify campaign still listed', async () => {
    await logout(page);
    await expect(page).toHaveURL(/\/login/);

    await login(page, accounts.dm.email, accounts.dm.password);
    await expect(page).toHaveURL(/\/app/);

    // Navigate to the campaigns list
    await page.goto('/app/campaigns');

    // The campaign created in step 1 should still appear
    await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 10_000 });

    // Navigate into the campaign to confirm full access
    await navigateToCampaign(page, campaignId);
    await expect(page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));
    await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 10_000 });
  });

  // ── 3. Character HP / AC / Speed Persistence ─────────────

  test('Step 3: Create character with stats, reload, verify HP/AC/Speed persisted', async () => {
    // Navigate to character creation for this campaign
    await goToCharacterCreation(page, campaignId);

    // Create the character (wizard sets defaults for stats)
    await createCharacter(page, TEST_CHARACTER);

    // Verify the character is visible after creation
    await expectCharacterVisible(page, TEST_CHARACTER.name);

    // Capture the actual HP displayed on the character sheet (wizard defaults)
    const hpText = await page.getByText(/\d+\s*\/\s*\d+/).first().textContent();
    expect(hpText).toBeTruthy();

    // Reload and verify the character and its stats survive the refresh
    await page.reload({ waitUntil: 'networkidle' });

    await expectCharacterVisible(page, TEST_CHARACTER.name);

    // Verify the same HP value is still displayed after reload
    await expect(
      page.getByText(hpText!.trim()).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Verify AC and Speed stats still render (using default values from wizard)
    await expect(page.getByText('AC').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/\d+ ft/).first()).toBeVisible({ timeout: 5_000 });
  });

  // ── 4. Encounter Details Persistence ─────────────────────

  test('Step 4: Create encounter with details, save, reload, verify fields persisted', async () => {
    // Navigate to campaign workspace and open Encounters prep section (sidebar button)
    await navigateToCampaign(page, campaignId);
    await page.locator('button[aria-label="Encounters"]').click();
    await page.waitForTimeout(500);

    // Click "New Encounter" to show the inline creation form
    await page.getByRole('button', { name: /new encounter/i }).click();

    // Fill in the encounter name
    const nameInput = page.locator('input[placeholder="Encounter name..."]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill(TEST_ENCOUNTER.name);

    // Create the encounter
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Wait for the encounter to be created and detail panel to appear
    await expect(page.locator('#enc-name')).toBeVisible({ timeout: 10_000 });

    // Fill in encounter detail fields
    const encName = page.locator('#enc-name');
    await encName.waitFor({ timeout: 5_000 });
    await encName.clear();
    await encName.fill(TEST_ENCOUNTER.name);

    const encTactics = page.locator('#enc-tactics');
    await encTactics.fill(TEST_ENCOUNTER.tactics);

    const encTerrain = page.locator('#enc-terrain');
    await encTerrain.fill(TEST_ENCOUNTER.terrain);

    const encTreasure = page.locator('#enc-treasure');
    await encTreasure.fill(TEST_ENCOUNTER.treasure);

    const encDesc = page.locator('#enc-desc');
    await encDesc.fill(TEST_ENCOUNTER.description);

    // Save the encounter details
    await page.getByRole('button', { name: /save changes/i }).click();

    // Wait for save confirmation (toast or button text changes to "Saved")
    await expect(
      page.getByText(/saved/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Reload and re-navigate to the Encounters section (sidebar button)
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('button[aria-label="Encounters"]').click();
    await page.waitForTimeout(500);

    // Click on the encounter again to re-open its detail panel
    await expect(page.getByText(TEST_ENCOUNTER.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText(TEST_ENCOUNTER.name).first().click();
    await page.waitForTimeout(1_000);

    // Verify all fields persisted
    await expect(page.locator('#enc-name')).toHaveValue(TEST_ENCOUNTER.name, { timeout: 5_000 });
    await expect(page.locator('#enc-tactics')).toHaveValue(TEST_ENCOUNTER.tactics);
    await expect(page.locator('#enc-terrain')).toHaveValue(TEST_ENCOUNTER.terrain);
    await expect(page.locator('#enc-treasure')).toHaveValue(TEST_ENCOUNTER.treasure);
    await expect(page.locator('#enc-desc')).toHaveValue(TEST_ENCOUNTER.description);
  });

  // ── 5. AI NPC Save to World Persistence ──────────────────

  test('Step 5: Create world entity in session, end session, verify entity persists', async () => {
    // Navigate back to campaign workspace and start a session
    await navigateToCampaign(page, campaignId);
    await startSession(page);

    // Create a world entity manually via the World tab
    await clickDMTab(page, 'world');

    // Open the Create Entity modal
    await page.getByRole('button', { name: /create entity/i }).click();

    // Fill out the entity form
    const nameInput = page.locator('input#entity-name');
    await nameInput.waitFor({ timeout: 5_000 });
    await nameInput.fill('Kael the Wanderer');

    await page.locator('select#entity-type').selectOption('npc');

    await page.locator('textarea#entity-description').fill(
      'A mysterious traveler who knows the old roads.',
    );

    // Submit and wait for the entity to appear
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1_000);
    aiNpcName = 'Kael the Wanderer';

    await expect(page.getByText(aiNpcName)).toBeVisible({ timeout: 5_000 });

    // End the session
    await endSession(page);

    // Return to prep from recap stage so we can start a new session
    await returnToPrep(page);

    // Start a new session to verify entity persists across sessions
    await startSession(page);

    // Check the World tab for the entity
    await clickDMTab(page, 'world');
    await expect(page.getByText(aiNpcName).first()).toBeVisible({ timeout: 10_000 });

    // End session for cleanup
    await endSession(page);
  });

  // ── 6. Data Integrity After Multiple Refreshes ───────────

  test('Step 6: Reload 3 times, verify campaign, character, and entities remain intact', async () => {
    // Navigate to the campaign workspace and return to prep if in recap stage
    await navigateToCampaign(page, campaignId);
    const returnBtn = page.getByRole('button', { name: /return to prep/i });
    if (await returnBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await returnBtn.click();
      await expect(
        page.getByRole('button', { name: /start session/i }),
      ).toBeVisible({ timeout: 10_000 });
    }

    // First reload
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 10_000 });

    // Second reload
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 10_000 });

    // Third reload
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(campaign.name)).toBeVisible({ timeout: 10_000 });

    // Click Overview tab to see the system label
    await page.getByRole('button', { name: 'Overview' }).click();
    await page.waitForTimeout(500);

    // Verify system label is still correct
    await expect(
      page.getByText(/D&D 5e|dnd5e|Dungeons & Dragons 5th Edition/i),
    ).toBeVisible({ timeout: 10_000 });

    // Navigate to encounters section and verify our encounter data is still intact
    await page.locator('button[aria-label="Encounters"]').click();
    await page.waitForTimeout(500);
    await expect(page.getByText(TEST_ENCOUNTER.name)).toBeVisible({ timeout: 10_000 });

    // Click into the encounter and verify details survived
    await page.getByText(TEST_ENCOUNTER.name).first().click();
    await page.waitForTimeout(1_000);
    await expect(page.locator('#enc-tactics')).toHaveValue(TEST_ENCOUNTER.tactics, { timeout: 5_000 });
    await expect(page.locator('#enc-terrain')).toHaveValue(TEST_ENCOUNTER.terrain);
    await expect(page.locator('#enc-treasure')).toHaveValue(TEST_ENCOUNTER.treasure);

    // Start a session to check world entities
    await navigateToCampaign(page, campaignId);
    await startSession(page);

    // Verify the AI NPC still exists in the World tab
    await clickDMTab(page, 'world');
    if (aiNpcName && aiNpcName !== 'Unknown NPC') {
      await expect(page.getByText(aiNpcName).first()).toBeVisible({ timeout: 10_000 });
    }

    // Verify the character is still accessible via the Party tab
    await clickDMTab(page, 'party');
    await expect(page.getByText(TEST_CHARACTER.name).first()).toBeVisible({ timeout: 10_000 });

    // End session for final cleanup
    await endSession(page);
  });
});
