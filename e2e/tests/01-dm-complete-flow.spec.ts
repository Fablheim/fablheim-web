import { test, expect, Page } from '@playwright/test';
import { TEST_ACCOUNTS, TEST_CAMPAIGN, TEST_ENCOUNTER } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import { createCampaign, navigateToCampaign } from './helpers/campaign-helpers';
import {
  startSession,
  endSession,
  clickDMTab,
  sendChatMessage,
} from './helpers/session-helpers';

test.describe.serial('DM Complete Flow — Signup to Session End', () => {
  let page: Page;
  let campaignId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Step 1: Create DM account', async () => {
    await signUp(page, TEST_ACCOUNTS.dm);
    await expect(page).toHaveURL(/\/app/);
  });

  test('Step 2: Navigate to campaigns and create a campaign', async () => {
    await page.goto('/app/campaigns');
    await expect(page).toHaveURL(/\/app\/campaigns/);

    campaignId = await createCampaign(page, TEST_CAMPAIGN);
  });

  test('Step 3: Create an encounter from the campaign workspace', async () => {
    // createCampaign already navigated us into the campaign workspace.
    // Click "Encounters" in the prep sidebar.
    await page.getByRole('button', { name: 'Encounters' }).click();
    await page.waitForTimeout(500);

    // Click "New Encounter" to show the inline creation form
    await page.getByRole('button', { name: /new encounter/i }).click();

    // Fill in the encounter name
    const nameInput = page.locator('input[placeholder="Encounter name..."]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await nameInput.fill(TEST_ENCOUNTER.name);

    // Create the encounter
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Wait for the encounter to be created and details panel to appear
    await expect(page.locator('#enc-name')).toBeVisible({ timeout: 10_000 });

    // Verify the encounter appears (name shows in heading + detail span, use .first())
    await expect(page.getByText(TEST_ENCOUNTER.name).first()).toBeVisible();
  });

  test('Step 4: Go back to campaign workspace and start session', async () => {
    await navigateToCampaign(page, campaignId);
    await expect(page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));

    await startSession(page);
    await expect(page).toHaveURL(/\/session/);
  });

  test('Step 5: Open Encounters DM tab and verify encounter is visible', async () => {
    await clickDMTab(page, 'encounters');

    await expect(page.getByText(TEST_ENCOUNTER.name)).toBeVisible();
  });

  test('Step 6: Send a chat message', async () => {
    await sendChatMessage(page, 'Welcome to the session, adventurers!');

    await expect(page.getByText('Welcome to the session, adventurers!')).toBeVisible();
  });

  test('Step 7: Open Initiative tab and verify tracker heading', async () => {
    await clickDMTab(page, 'initiative');

    await expect(page.getByRole('heading', { name: 'Initiative Tracker' })).toBeVisible();
  });

  test('Step 8: End the session', async () => {
    await endSession(page);
  });

  test('Step 9: Verify campaign returns to recap/prep state', async () => {
    // After ending the session we should be back at the campaign workspace
    await expect(page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));

    // The campaign enters "recap" stage after ending, showing "Return to Prep" button.
    // Or if recap auto-completes, "Start Session" may already be visible.
    const returnToPrep = page.getByRole('button', { name: /return to prep/i });
    const startSessionBtn = page.getByRole('button', { name: /start session/i });

    await expect(returnToPrep.or(startSessionBtn)).toBeVisible({ timeout: 10_000 });
  });
});
