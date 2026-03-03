import { test, expect, Page } from '@playwright/test';
import { generateAccounts, generateCampaignData } from './helpers/test-data';
import { signUp } from './helpers/auth-helpers';
import { createCampaign, navigateToCampaign } from './helpers/campaign-helpers';
import {
  startSession,
  endSession,
  clickDMTab,
  createNoteInSession,
  generateAINPC,
  startCombat,
  nextTurn,
  endCombat,
} from './helpers/session-helpers';

test.describe.serial('Mid-Session Workflows — In-Session Content Creation', () => {
  let page: Page;
  let campaignId: string;
  let generatedNPCName: string;
  const accounts = generateAccounts();
  const campaign = generateCampaignData();

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Setup ────────────────────────────────────────────────

  test('Step 1: Create DM account, campaign, and start session', async () => {
    // Register a fresh DM account
    await signUp(page, accounts.dm);
    await expect(page).toHaveURL(/\/app/);

    // Navigate to campaigns list and create a new campaign
    await page.goto('/app/campaigns');
    campaignId = await createCampaign(page, campaign);
    expect(campaignId).toBeTruthy();

    // Navigate into the campaign workspace and launch a live session
    await navigateToCampaign(page, campaignId);
    await startSession(page);

    // Verify we transitioned into the session runner
    await expect(page).toHaveURL(/\/session/);
  });

  // ── World Tab — NPC creation via modal ─────────────────

  test('Step 2: Create a world entity (NPC) via World tab', async () => {
    await clickDMTab(page, 'world');

    // Open the Create Entity modal
    await page.getByRole('button', { name: /create entity/i }).click();

    // Wait for the modal to appear and fill it out
    const nameInput = page.locator('input#entity-name');
    await nameInput.waitFor({ timeout: 5_000 });
    await nameInput.fill('Brannor the Bold');

    // Select "npc" from the entity type dropdown
    await page.locator('select#entity-type').selectOption('npc');

    // Fill the description
    await page.locator('textarea#entity-description').fill(
      'A retired adventurer who runs the local tavern. Grizzled but kind.',
    );

    // Submit the modal form — target the form's submit button specifically
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1_000);

    // Verify the NPC now appears in the World tab entity list
    await expect(page.getByText('Brannor the Bold')).toBeVisible({ timeout: 5_000 });
  });

  // ── Notes Tab — Session note ───────────────────────────

  test('Step 3: Create a note via Notes tab', async () => {
    await createNoteInSession(
      page,
      'Important clue',
      'The innkeeper mentioned a hidden passage beneath the old mill.',
    );

    // Verify the note title is visible in the notes list
    await expect(page.getByText('Important clue')).toBeVisible({ timeout: 5_000 });
  });

  // ── AI Tools Tab — Generate NPC and save to world ──────

  test('Step 4: Generate an AI NPC and save it to the campaign world', async () => {
    // Generate an NPC using the AI tools (auto-persisted to world server-side)
    generatedNPCName = await generateAINPC(
      page,
      'A cunning half-elf spy who operates from the shadows of the marketplace',
    );
    expect(generatedNPCName).toBeTruthy();

    // Verify the NPC result is displayed with at least an appearance section
    await expect(
      page.locator('text=/Appearance/i').first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── Initiative Tab — Manual entry ──────────────────────

  test('Step 5: Add initiative entry manually via Initiative tab', async () => {
    await clickDMTab(page, 'initiative');

    // Open the Add Entry form
    await page.getByRole('button', { name: /add entry/i }).click();
    await page.waitForTimeout(500);

    // Select MON type via button
    const monBtn = page.getByRole('button', { name: 'MON', exact: true });
    await monBtn.waitFor({ timeout: 5_000 });
    await monBtn.click();

    // Fill creature name using the specific placeholder input
    const nameInput = page.locator('input[placeholder="Goblin Scout"]');
    await nameInput.waitFor({ timeout: 5_000 });
    await nameInput.fill('Dire Wolf');

    // Fill initiative roll value using the specific placeholder input
    const initInput = page.locator('input[placeholder="15"]');
    await initInput.fill('18');

    // Wait for the Add button to be enabled, then click
    const addBtn = page.getByRole('button', { name: /^add$/i });
    await expect(addBtn).toBeEnabled({ timeout: 5_000 });
    await addBtn.click();

    // Verify the entry appears in the initiative tracker
    await expect(page.getByText('Dire Wolf')).toBeVisible({ timeout: 10_000 });
  });

  // ── Combat round ──────────────────────────────────────

  test('Step 6: Start combat, advance turns, and end combat', async () => {
    // Entry already has initiative 18 from step 5 — go straight to combat
    await startCombat(page);

    // Advance a turn (single entry wraps back to itself)
    await nextTurn(page);

    // End combat — clears the active combat state
    await endCombat(page);
  });

  // ── End session and verify return ──────────────────────

  test('Step 7: End the session and verify return to campaign workspace', async () => {
    await endSession(page);

    // Verify we are back at the campaign workspace (no longer in /session)
    await expect(page).toHaveURL(new RegExp(`/app/campaigns/${campaignId}`));

    // The campaign enters "recap" stage showing "Return to Prep",
    // or "Start Session" if recap auto-completes
    const returnToPrep = page.getByRole('button', { name: /return to prep/i });
    const startSessionBtn = page.getByRole('button', { name: /start session/i });
    await expect(returnToPrep.or(startSessionBtn)).toBeVisible({ timeout: 10_000 });
  });
});
